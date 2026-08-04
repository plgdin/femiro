import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Trash2, Lock, Gift, Tag, ChevronDown, ChevronUp, ArrowLeft, ShoppingCart } from 'lucide-react'
import type { CartItem, Address } from '../types'
import { money } from '../data/initialData'

export function CartPage({
  cart,
  setCart,
  addresses,
  navigate,
  onPlaceOrder
}: {
  cart: CartItem[]
  setCart: Dispatch<SetStateAction<CartItem[]>>
  addresses: Address[]
  navigate: (path: string) => void
  onPlaceOrder: (selectedAddr: string, total: number) => void
}) {
  const [selectedAddrId, setSelectedAddrId] = useState(addresses[0]?.id || '')
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [customAddr, setCustomAddr] = useState('')

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const shippingCost = subtotal > 2999 ? 0 : 199

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'FEMIRO10') {
      setDiscount(Math.round(subtotal * 0.1))
      setCouponApplied(true)
    } else {
      alert('Invalid coupon. Try "FEMIRO10" for 10% off.')
    }
  }

  const finalTotal = Math.max(0, subtotal - discount)
  const activeAddress = addresses.find(a => a.id === selectedAddrId) || addresses[0]
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0)

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

                {discount > 0 && (
                  <div className="detail-row discount-row">
                    <span>Discount (10%)</span>
                    <b>-{money(discount)}</b>
                  </div>
                )}

                {/* Delivery Location Field inside checkout details */}
                <div className="delivery-summary-section">
                  <label>Shipping Destination</label>
                  {addresses.length > 0 ? (
                    <select value={selectedAddrId} onChange={e => setSelectedAddrId(e.target.value)}>
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>
                          [{a.tag}] {a.street}, {a.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Enter shipping address manually"
                        value={customAddr}
                        onChange={e => setCustomAddr(e.target.value)}
                        className="custom-address-field"
                      />
                      <button
                        onClick={() => navigate('/account')}
                        className="manage-address-btn"
                        type="button"
                      >
                        + Manage addresses in Account
                      </button>
                    </div>
                  )}
                </div>

                <div className="divider-line-horizontal" />

                <div className="detail-row total-row">
                  <span>Estimated Total</span>
                  <span className="price-total-val">{money(finalTotal + shippingCost)}</span>
                </div>

                <p className="taxes-note">Taxes included. Shipping calculated at checkout.</p>
              </div>

              <button
                className="button dark product-add-btn proceed-checkout-btn"
                type="button"
                onClick={() => {
                  const addrStr = activeAddress
                    ? `${activeAddress.street}, ${activeAddress.city}`
                    : customAddr.trim()

                  if (!addrStr) {
                    alert('Please enter or select a delivery address.')
                    return
                  }

                  const totalWithShipping = finalTotal + shippingCost
                  onPlaceOrder(addrStr, totalWithShipping)
                }}
              >
                <Lock size={15} /> Proceed to Checkout
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
                    placeholder="PROMO CODE (e.g. FEMIRO10)"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    disabled={couponApplied}
                  />
                  <button onClick={handleApplyCoupon} disabled={couponApplied}>
                    {couponApplied ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  )
}
