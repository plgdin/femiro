import crypto from 'crypto'
import Razorpay from 'razorpay'
import { getSupabaseAdmin, requireUser } from './auth'

export async function handleVerifyPayment(req: any, body: any) {
  const user = await requireUser(req)
  const supabaseAdmin = getSupabaseAdmin()
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Payment service is not configured.')

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) throw new Error('Payment details are incomplete.')

  const generated = crypto.createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  const expected = Buffer.from(generated, 'utf8')
  const received = Buffer.from(String(razorpay_signature), 'utf8')
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new Error('Invalid payment signature.')
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id,user_id,total,status')
    .eq('razorpay_order_id', razorpay_order_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (orderError || !order) throw new Error('Order not found.')
  if (order.status !== 'Payment Pending') throw new Error('Order has already been processed.')

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
  const payment = await razorpay.payments.fetch(razorpay_payment_id)
  if (payment.order_id !== razorpay_order_id || payment.status !== 'captured') throw new Error('Payment was not captured.')
  if (Number(payment.amount) !== Math.round(Number(order.total) * 100)) throw new Error('Payment amount mismatch.')

  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'Processing',
      razorpay_payment_id,
      paid_at: new Date().toISOString()
    })
    .eq('id', order.id)
    .eq('status', 'Payment Pending')
  if (updateError) throw updateError

  return { status: 200, data: { success: true, order_id: order.id, payment_id: razorpay_payment_id } }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const result = await handleVerifyPayment(req, body || {})
    return res.status(result.status).json(result.data)
  } catch (error: any) {
    const message = error?.message || 'Payment verification failed.'
    const status = message.includes('Authentication') || message.includes('token') ? 401 : 400
    return res.status(status).json({ error: message })
  }
}
