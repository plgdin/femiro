declare global {
  interface Window {
    Razorpay: any
  }
}

import { supabase } from '../lib/supabase'

export interface RazorpayOptions {
  amount: number // in INR (will be converted to paise)
  items: { id: number; qty: number; size: string }[]
  deliveryAddress: string
  coupon?: string
  phone?: string
  name?: string
  description?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string }) => void
  onError: (error: string) => void
  onVerifying?: () => void
  onDismiss?: () => void
}

export async function processRazorpayPayment(options: RazorpayOptions): Promise<void> {
  const amountInPaise = Math.round(options.amount * 100)

  if (amountInPaise < 100) {
    options.onError('Minimum payment amount is ₹1.00 (100 paise).')
    return
  }

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID

  if (!razorpayKey) {
    options.onError('Razorpay Key ID is not configured.')
    return
  }

  try {
    // Step 1: Create Order via backend
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      options.onError('Please sign in before checkout.')
      return
    }

    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        items: options.items,
        delivery_address: options.deliveryAddress,
        coupon: options.coupon || '',
        customer_phone: options.phone || ''
      })
    })

    const orderData = await response.json()

    if (!response.ok || !orderData.order_id) {
      throw new Error(orderData.error || 'Failed to create order on server.')
    }

    // Step 2: Configure Razorpay Checkout Modal
    const checkoutOptions = {
      key: razorpayKey,
      amount: orderData.amount,
      currency: orderData.currency,
      name: options.name || 'Femiro Storefront',
      description: options.description || 'Order Checkout',
      order_id: orderData.order_id,
      prefill: options.prefill || {},
      theme: {
        color: '#842952'
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: 'UPI / QR',
              instruments: [{ method: 'upi' }]
            },
            cards: {
              name: 'Cards',
              instruments: [{ method: 'card' }]
            },
            banks: {
              name: 'Net Banking',
              instruments: [{ method: 'netbanking' }]
            }
          },
          sequence: ['block.upi', 'block.cards', 'block.banks'],
          preferences: {
            show_default_blocks: false
          }
        }
      },
      method: {
        netbanking: true,
        card: true,
        upi: true,
        wallet: false,
        paylater: false,
        emi: false
      },
      handler: async function (paymentResponse: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) {
        try {
          options.onVerifying?.()
          // Step 3: Verify Payment Signature via backend
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            })
          })

          const verifyData = await verifyRes.json()

          if (verifyRes.ok && verifyData.success) {
            options.onSuccess({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id
            })
          } else {
            options.onError(verifyData.error || 'Payment signature verification failed.')
          }
        } catch (err: any) {
          options.onError(err.message || 'Error verifying payment signature.')
        }
      },
      modal: {
        confirm_close: true,
        escape: true,
        ondismiss: function () {
          if (options.onDismiss) {
            options.onDismiss()
          }
        }
      }
    }

    if (typeof window.Razorpay === 'undefined') {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
    }

    const rzp = new window.Razorpay(checkoutOptions)

    rzp.on('payment.failed', function (resp: any) {
      const errMsg = resp.error?.description || 'Payment failed. Please try again.'
      options.onError(errMsg)
    })

    rzp.open()
  } catch (err: any) {
    options.onError(err.message || 'Payment initiation failed.')
  }
}
