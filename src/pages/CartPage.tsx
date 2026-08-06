import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Trash2, Lock, Gift, Tag, ChevronDown, ChevronUp, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import type { CartItem, Address, DiscountCode } from '../types'
import { money } from '../data/initialData'
import { processRazorpayPayment } from '../services/razorpayService'
import { AddressDropdown } from '../components/AddressDropdown'

type PaidInvoice = {
  orderId: string
  paymentId: string
  date: string
  address: string
  items: CartItem[]
  total: number
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
]

export function CartPage({
  cart,
  setCart,
  addresses,
  discounts,
  navigate,
  onPlaceOrder
}: {
  cart: CartItem[]
  setCart: Dispatch<SetStateAction<CartItem[]>>
  addresses: Address[]
  discounts: DiscountCode[]
  navigate: (path: string) => void
  onPlaceOrder: (selectedAddr: string, total: number) => void
}) {
  const [selectedAddrId, setSelectedAddrId] = useState(addresses[0]?.id || '')
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [shippingName, setShippingName] = useState('')
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingStreet, setShippingStreet] = useState('')
  const [shippingAddress2, setShippingAddress2] = useState('')
  const [shippingCity, setShippingCity] = useState('')
  const [shippingState, setShippingState] = useState('')
  const [shippingPincode, setShippingPincode] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentFailure, setPaymentFailure] = useState<string | null>(null)
  const [paidInvoice, setPaidInvoice] = useState<PaidInvoice | null>(null)

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const shippingCost = subtotal > 2000 ? 0 : 59
  const packingCost = 15
  const gstAmount = Math.round(Math.max(0, subtotal - discount) * 0.05)

  const handleApplyCoupon = () => {
    const found = discounts.find(item => item.code === coupon.trim().toUpperCase() && item.active)
    if (found) {
      const eligibleSubtotal = cart.reduce((sum, item) => {
        const eligible = found.scope === 'storewide' ||
          (found.scope === 'category' && item.product.type === found.categoryTarget) ||
          (found.scope === 'products' && found.productIds?.includes(item.product.id))
        return eligible ? sum + item.product.price * item.qty : sum
      }, 0)
      if (eligibleSubtotal <= 0 || eligibleSubtotal < found.minSpend) {
        alert('This coupon does not apply to items in your cart.')
        return
      }
      const value = found.type === 'fixed'
        ? found.fixedAmount || 0
        : Math.round(eligibleSubtotal * found.discountPercent / 100)
      setDiscount(Math.min(value, eligibleSubtotal))
      setCouponApplied(true)
    } else {
      alert('Invalid or unavailable coupon.')
    }
  }

  const finalTotal = Math.max(0, subtotal - discount)
  const activeAddress = addresses.find(a => a.id === selectedAddrId) || addresses[0]
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0)
  const estimatedTotal = finalTotal + gstAmount + shippingCost + packingCost
  const animatedTotalRef = useRef(estimatedTotal)
  const [displayedTotal, setDisplayedTotal] = useState(estimatedTotal)

  useEffect(() => {
    const start = animatedTotalRef.current
    const difference = estimatedTotal - start
    if (difference === 0) return
    const startedAt = performance.now()
    const duration = 650
    let frame = 0
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = Math.round(start + difference * eased)
      animatedTotalRef.current = value
      setDisplayedTotal(value)
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [estimatedTotal])

  useEffect(() => {
    if (!activeAddress) return
    setShippingName(activeAddress.name)
    setShippingPhone(activeAddress.mobile)
    setShippingStreet(activeAddress.street)
    setShippingAddress2(activeAddress.landmark || '')
    setShippingCity(activeAddress.city)
    setShippingState(activeAddress.state)
    setShippingPincode(activeAddress.pincode)
  }, [activeAddress?.id])

  const verifyPincode = async () => {
    const pincode = shippingPincode.trim()
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus(pincode ? 'invalid' : 'idle')
      return
    }
    setPincodeStatus('checking')
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const result = await response.json() as Array<{ Status?: string; PostOffice?: Array<{ District?: string; State?: string }> }>
      const office = result[0]?.Status === 'Success' ? result[0]?.PostOffice?.[0] : undefined
      if (!office) {
        setPincodeStatus('invalid')
        return
      }
      if (office.District) setShippingCity(office.District)
      if (office.State && INDIAN_STATES.includes(office.State)) setShippingState(office.State)
      setPincodeStatus('valid')
    } catch {
      setPincodeStatus('invalid')
    }
  }

  if (paidInvoice) {
    return (
      <main className="page-shell premium-cart-page invoice-page">
        <section className="invoice-card" id="print-invoice">
          <div className="invoice-success-mark">✓</div>
          <p className="eyebrow">PAYMENT CONFIRMED</p>
          <h1 className="cart-title">Thank you for your order</h1>
          <p className="cart-subtitle">Your payment went through. Keep this invoice for your records.</p>

          <div className="invoice-meta">
            <span>Order ID <b>{paidInvoice.orderId}</b></span>
            <span>Payment ID <b>{paidInvoice.paymentId}</b></span>
            <span>Date <b>{paidInvoice.date}</b></span>
          </div>

          <div className="invoice-items">
            {paidInvoice.items.map(item => (
              <div className="invoice-item" key={`${item.product.id}-${item.size}`}>
                <span>{item.product.name} · {item.size} × {item.qty}</span>
                <b>{money(item.product.price * item.qty)}</b>
              </div>
            ))}
          </div>

          <div className="invoice-total">
            <span>Total paid</span>
            <b>{money(paidInvoice.total)}</b>
          </div>
          <p className="invoice-address">Delivering to: {paidInvoice.address}</p>
          <div className="invoice-actions no-print">
            <button className="button dark" type="button" onClick={() => window.print()}>Print Invoice</button>
            <button className="button secondary" type="button" onClick={() => navigate('/account')}>View Account</button>
          </div>
        </section>
      </main>
    )
  }

  if (paymentFailure) {
    return (
      <main className="page-shell premium-cart-page payment-failure-page">
        <section className="payment-failure-card">
          <div className="payment-failure-icon"><AlertCircle size={30} /></div>
          <p className="eyebrow">PAYMENT NOT COMPLETED</p>
          <h1>Payment failed</h1>
          <p>We could not confirm this payment. Your cart is safe. No new order was confirmed.</p>
          <div className="payment-failure-reason">We could not complete your payment. Please try again.</div>
          <p className="payment-failure-help">
            If money was deducted, do not pay again immediately. Email <a href="mailto:femirodesigns@gmail.com">femirodesigns@gmail.com</a> or call <a href="tel:+919562637753">+91 95626 37753</a>. Share your payment reference and registered email.
          </p>
          <div className="payment-failure-actions">
            <button className="button dark" type="button" onClick={() => { setPaymentFailure(null); setPaymentError(null) }}>Try Payment Again</button>
            <button className="button secondary" type="button" onClick={() => navigate('/shop')}>Continue Shopping</button>
          </div>
        </section>
      </main>
    )
  }

  if (cart.length === 0) {
    return (
      <main className="page-shell premium-cart-page empty-cart-fullscreen">
        <div className="empty-cart-view-nobox">
          <img src="/bag.png" alt="Empty bag" className="empty-cart-image-big" />
          <h1 className="empty-cart-title">
            Your cart is <span className="empty-pink-text">empty</span>
          </h1>
          <p className="empty-cart-desc">
            Looks like you haven't added anything to your bag yet.<br />
            Explore our collections and find something you'll love.
          </p>
          <button
            className="empty-cart-btn"
            style={{ width: '280px', padding: '0 24px', height: '56px', textTransform: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}
            onClick={() => navigate('/shop')}
          >
            Continue Shopping
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell premium-cart-page">
      {/* Top Header Row */}
      <div className="cart-header-row">
        <div>
          <h1 className="cart-title">Your Cart</h1>
          <p className="cart-subtitle">Review your items, update quantities, and proceed to checkout.</p>
        </div>
        <button className="continue-shopping-btn" onClick={() => navigate('/shop')}>
          <ArrowLeft size={16} /> Continue Shopping
        </button>
      </div>
      <div className="cart-main-grid">
          {/* Left Column: Items Table */}
          <div className="cart-items-column">
            <div className="cart-table-header">
              <span className="col-product">Product</span>
              <span className="col-price">Price</span>
              <span className="col-qty">Quantity</span>
              <span className="col-total">Total</span>
            </div>

            <div className="cart-rows-list">
              {cart.map((item, idx) => {
                const itemTotal = item.product.price * item.qty
                return (
                  <div key={idx} className="cart-item-row">
                    {/* Thumbnail & Description */}
                    <div className="cart-item-info">
                      <img src={item.product.image} alt={item.product.name} />
                      <div className="item-meta">
                        <h3>{item.product.name}</h3>
                        <p>{item.product.type} • {item.size}</p>
                        <span className="in-stock-badge">In Stock</span>
                      </div>
                    </div>

                    {/* Single Price */}
                    <div className="cart-item-price">
                      {money(item.product.price)}
                    </div>

                    {/* Quantity Picker & Trash */}
                    <div className="cart-item-qty">
                      <div className="qty-capsule">
                        <button
                          type="button"
                          onClick={() =>
                            setCart(prev =>
                              prev
                                .map((i, index) => (index === idx ? { ...i, qty: i.qty - 1 } : i))
                                .filter(i => i.qty > 0)
                            )
                          }
                        >
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setCart(prev => prev.map((i, index) => (index === idx ? { ...i, qty: i.qty + 1 } : i)))
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="item-delete-btn"
                        type="button"
                        aria-label="Remove item"
                        onClick={() => setCart(prev => prev.filter((_, index) => index !== idx))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Row Total */}
                    <div className="cart-item-total">
                      {money(itemTotal)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Gift Note Trigger */}
            <button className="add-gift-note-btn" type="button">
              <Gift size={16} /> Add a gift note
            </button>
          </div>

          {/* Right Column: Checkout Summary & Delivery */}
          <div className="cart-sidebar-column">
            <div className="summary-box-card">
              <h3>Order Summary</h3>

              <div className="summary-details">
                <div className="detail-row">
                  <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
                  <b>{money(subtotal)}</b>
                </div>
                <div className="detail-row">
                  <span>Shipping</span>
                  <b style={{ color: shippingCost === 0 ? '#137333' : 'inherit' }}>
                    {shippingCost === 0 ? 'FREE' : money(shippingCost)}
                  </b>
                </div>

                <div className="detail-row">
                  <span>Packing</span>
                  <b>{money(packingCost)}</b>
                </div>

                {discount > 0 && (
                  <div className="detail-row discount-row">
                    <span>Discount</span>
                    <b>-{money(discount)}</b>
                  </div>
                )}

                <div className="detail-row">
                  <span>GST (5%)</span>
                  <b>{money(gstAmount)}</b>
                </div>

                {/* Delivery Location Field inside checkout details */}
                <div className="delivery-summary-section">
                  <label>Shipping Destination</label>
                  <button type="button" className="checkout-address-preview" onClick={() => { setAddressConfirmed(false); setAddressModalOpen(true) }}>
                    {shippingStreet && shippingCity && shippingPincode
                      ? `${shippingStreet}${shippingAddress2 ? `, ${shippingAddress2}` : ''}, ${shippingCity}, ${shippingState} - ${shippingPincode}`
                      : 'Add shipping address'}
                    <span>Change</span>
                  </button>
                </div>

                <div className="divider-line-horizontal" />

                <div className="detail-row total-row">
                  <span>Estimated Total</span>
                  <span className="price-total-val total-rolling-value">{money(displayedTotal)}</span>
                </div>

                <p className="taxes-note">Taxes included. Shipping calculated at checkout.</p>
              </div>

              {paymentError && (
                <div style={{
                  padding: '10px 14px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#fdf2f2',
                  border: '1px solid #f8b4b4',
                  color: '#9b1c1c',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                className="button dark product-add-btn proceed-checkout-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (!addressConfirmed) {
                    setAddressModalOpen(true)
                    return
                  }
                  const addrStr = `${shippingStreet.trim()}${shippingAddress2.trim() ? `, ${shippingAddress2.trim()}` : ''}, ${shippingCity.trim()}, ${shippingState.trim()} - ${shippingPincode.trim()}`

                  if (!shippingName.trim() || !shippingPhone.trim() || !shippingStreet.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPincode.trim()) {
                    alert('Please complete your name, phone, address, city, state, and pincode.')
                    return
                  }

                  const totalWithShipping = finalTotal + gstAmount + shippingCost + packingCost
                  setIsProcessing(true)
                  setPaymentError(null)

                  processRazorpayPayment({
                    amount: totalWithShipping,
                    items: cart.map(item => ({ id: item.product.id, qty: item.qty, size: item.size })),
                    deliveryAddress: addrStr,
                    coupon: couponApplied ? coupon.trim().toUpperCase() : undefined,
                    phone: shippingPhone,
                    name: 'Femiro Storefront',
                    description: `Order for ${totalItemCount} item(s)`,
                    prefill: {
                      name: shippingName,
                      contact: shippingPhone
                    },
                    onSuccess: (_response) => {
                      setIsProcessing(false)
                      setIsVerifying(false)
                      setPaidInvoice({
                        orderId: _response.razorpay_order_id,
                        paymentId: _response.razorpay_payment_id,
                        date: new Date().toLocaleDateString('en-IN'),
                        address: addrStr,
                        items: cart,
                        total: totalWithShipping
                      })
                      void onPlaceOrder(addrStr, totalWithShipping)
                    },
                    onVerifying: () => {
                      setIsProcessing(true)
                      setIsVerifying(true)
                      setPaymentError(null)
                    },
                    onError: (errMessage) => {
                      setIsProcessing(false)
                      setIsVerifying(false)
                      console.error('Payment failed', errMessage)
                      setPaymentError('Payment could not be completed.')
                      setPaymentFailure('Payment could not be completed.')
                    },
                    onDismiss: () => {
                      setIsProcessing(false)
                      setIsVerifying(false)
                    }
                  })
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> {isVerifying ? 'Confirming Payment...' : 'Opening Secure Checkout...'}
                  </>
                ) : (
                  <>
                    <Lock size={15} /> Pay with Razorpay
                  </>
                )}
              </button>

              <div className="razorpay-badge">
                Secure checkout powered by <span className="razorpay-text">Razorpay</span>
              </div>
            </div>

            {/* Accordion Coupon Box */}
            <div className="coupon-accordion-container">
              <button
                className="coupon-accordion-header"
                type="button"
                onClick={() => setShowCouponInput(!showCouponInput)}
              >
                <span className="accordion-label">
                  <Tag size={16} /> Apply Coupon Code
                </span>
                {showCouponInput ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <div className={`coupon-accordion-content ${showCouponInput ? 'show' : ''}`}>
                <div className="coupon-inline-box">
                  <input
                    placeholder="Enter promo code"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    disabled={couponApplied}
                  />
                  <button onClick={() => {
                    if (couponApplied) {
                      setCoupon('')
                      setDiscount(0)
                      setCouponApplied(false)
                    } else {
                      handleApplyCoupon()
                    }
                  }}>
                    {couponApplied ? 'Remove' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {addressModalOpen && (
          <div className="modal-overlay checkout-address-overlay" onClick={() => setAddressModalOpen(false)}>
            <div className="modal-card checkout-address-modal" onClick={event => event.stopPropagation()}>
              <div className="checkout-address-modal-header">
                <div>
                  <p className="eyebrow">DELIVERY DETAILS</p>
                  <h3>Where should we deliver?</h3>
                </div>
                <button type="button" onClick={() => setAddressModalOpen(false)} aria-label="Close">×</button>
              </div>
              {addresses.length > 0 && (
                <AddressDropdown
                  addresses={addresses}
                  selectedId={selectedAddrId}
                  onSelect={id => { setSelectedAddrId(id); setAddressConfirmed(false) }}
                  customAddr=""
                  setCustomAddr={() => undefined}
                  onManageAddresses={() => navigate('/account')}
                />
              )}
              <div className="checkout-address-form">
                <label>Full Name<input value={shippingName} onChange={e => setShippingName(e.target.value)} required /></label>
                <label>Phone Number<input type="tel" value={shippingPhone} onChange={e => setShippingPhone(e.target.value)} required /></label>
                <label className="full">Address 1<input value={shippingStreet} onChange={e => setShippingStreet(e.target.value)} placeholder="House / street / area" required /></label>
                <label className="full">Address 2 <span className="optional-field">(optional)</span><input value={shippingAddress2} onChange={e => setShippingAddress2(e.target.value)} placeholder="Apartment, floor, landmark" /></label>
                <label>City / Location<input value={shippingCity} onChange={e => setShippingCity(e.target.value)} required /></label>
                <label>State<select value={shippingState} onChange={e => setShippingState(e.target.value)} required><option value="">Choose state</option>{INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}</select></label>
                <label>Pincode<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={shippingPincode} onChange={e => { setShippingPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPincodeStatus('idle') }} onBlur={() => void verifyPincode()} required />{pincodeStatus === 'checking' && <small>Checking pincode…</small>}{pincodeStatus === 'valid' && <small className="pincode-valid">Pincode verified</small>}{pincodeStatus === 'invalid' && <small className="pincode-invalid">Enter a valid Indian pincode</small>}</label>
              </div>
              <button type="button" className="button dark checkout-address-continue" onClick={() => {
                if (!shippingName.trim() || !shippingPhone.trim() || !shippingStreet.trim() || !shippingCity.trim() || !shippingState.trim() || !shippingPincode.trim()) {
                  alert('Please complete your name, phone, address, city, state, and pincode.')
                  return
                }
                setAddressConfirmed(true)
                setAddressModalOpen(false)
              }}>Continue to payment</button>
            </div>
          </div>
        )}
    </main>
  )
}
