import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { MapPin, PackageCheck, CreditCard, Plus, ShieldCheck, LogOut, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import type { Address, Order } from '../types'
import { money } from '../data/initialData'
import { Logo } from '../components/Logo'

// OAuth SVGs & Helpers
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px' }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.93h6.59c-.28 1.5-.1.86-1.5 2.4l3.1 2.4c1.8-1.66 2.85-4.1 2.85-6.66z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.1-2.4c-.86.58-1.97.92-3.23.92-2.48 0-4.58-1.68-5.33-3.93L5.1 18.06c2 3.97 6.1 6.64 10.77 6.64z"
    />
    <path
      fill="#FBBC05"
      d="M6.67 15.68c-.19-.58-.3-1.2-.3-1.84s.11-1.26.3-1.84L3.6 9.61C2.75 11.31 2.27 13.2 2.27 15s.48 3.69 1.33 5.39l3.07-2.41z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.33 0 3.23 2.67 1.23 6.64l3.07 2.41c.75-2.25 2.85-3.93 5.33-3.93z"
    />
  </svg>
)

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39" />
  </svg>
)

const StarDivider = () => (
  <div className="star-divider">
    <div className="divider-line" />
    <span className="diamond-star">✦</span>
    <div className="divider-line" />
  </div>
)

export function AccountPage({
  navigate,
  addresses,
  setAddresses,
  orders,
  isAdmin,
  setIsAdmin,
  userEmail,
  setUserEmail
}: {
  navigate: (path: string) => void
  addresses: Address[]
  setAddresses: Dispatch<SetStateAction<Address[]>>
  orders: Order[]
  isAdmin: boolean
  setIsAdmin: Dispatch<SetStateAction<boolean>>
  userEmail: string | null
  setUserEmail: Dispatch<SetStateAction<string | null>>
}) {
  const [activeTab, setActiveTab] = useState<'locations' | 'orders' | 'profile'>('locations')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Login & Sign Up Form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  // Location Form state
  const [formName, setFormName] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formStreet, setFormStreet] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formState, setFormState] = useState('')
  const [formPincode, setFormPincode] = useState('')
  const [formTag, setFormTag] = useState<'Home' | 'Office' | 'Other'>('Home')
  const [formDefault, setFormDefault] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    if (emailInput.trim().toLowerCase() === 'admin@femiro.com' && passwordInput === 'makkuani47*') {
      setIsAdmin(true)
      setUserEmail('admin@femiro.com')
      localStorage.setItem('femiro-user-email', 'admin@femiro.com')
      localStorage.setItem('femiro-is-admin', 'true')
    } else if (emailInput.trim()) {
      setIsAdmin(false)
      setUserEmail(emailInput)
      localStorage.setItem('femiro-user-email', emailInput)
      localStorage.setItem('femiro-is-admin', 'false')
    } else {
      setLoginError('Please enter a valid email address.')
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    if (emailInput.trim() && nameInput.trim()) {
      setIsAdmin(false)
      setUserEmail(nameInput.trim())
      localStorage.setItem('femiro-user-email', nameInput.trim())
      localStorage.setItem('femiro-is-admin', 'false')
    } else {
      setLoginError('Please fill out all fields.')
    }
  }

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    if (emailInput.trim()) {
      setResetSuccess(`Password reset link sent to ${emailInput}!`)
      setTimeout(() => {
        setResetSuccess(null)
        setAuthMode('signin')
      }, 3000)
    } else {
      setLoginError('Please enter your email.')
    }
  }


  const handleLogout = () => {
    setIsAdmin(false)
    setUserEmail(null)
    localStorage.removeItem('femiro-user-email')
    localStorage.removeItem('femiro-is-admin')
  }

  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr)
      setFormName(addr.name)
      setFormMobile(addr.mobile)
      setFormStreet(addr.street)
      setFormCity(addr.city)
      setFormState(addr.state)
      setFormPincode(addr.pincode)
      setFormTag(addr.tag)
      setFormDefault(addr.isDefault)
    } else {
      setEditingAddress(null)
      setFormName(userEmail || 'Aisha Sharma')
      setFormMobile('+91 ')
      setFormStreet('')
      setFormCity('Mumbai')
      setFormState('Maharashtra')
      setFormPincode('')
      setFormTag('Home')
      setFormDefault(addresses.length === 0)
    }
    setIsModalOpen(true)
  }

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (formDefault) {
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: false })))
    }
    if (editingAddress) {
      setAddresses(prev =>
        prev.map(a =>
          a.id === editingAddress.id
            ? {
                ...a,
                name: formName,
                mobile: formMobile,
                street: formStreet,
                city: formCity,
                state: formState,
                pincode: formPincode,
                tag: formTag,
                isDefault: formDefault
              }
            : a
        )
      )
    } else {
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        name: formName,
        mobile: formMobile,
        street: formStreet,
        city: formCity,
        state: formState,
        pincode: formPincode,
        tag: formTag,
        isDefault: formDefault
      }
      setAddresses(prev => [...prev, newAddr])
    }
    setIsModalOpen(false)
  }

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  if (!userEmail) {
    return (
      <main className="signin-fullscreen-layout">
        <div className="signin-right-container">
          <div className="signin-card">
            
            {authMode === 'signin' && (
              <>
                <div className="signin-card-header">
                  <button className="back-store-link" onClick={() => navigate('/')}>
                    ← Back to Shop
                  </button>
                  <div style={{ textAlign: 'center', width: '100%', marginTop: '8px' }}>
                    <h2 style={{ font: "500 clamp(28px, 3.5vw, 36px) 'Playfair Display', serif", margin: '0 0 4px', color: 'var(--ink)' }}>
                      Welcome <span style={{ color: 'var(--wine)', fontStyle: 'italic' }}>Back</span>
                    </h2>
                    <p className="signin-subtitle">
                      Sign in to continue to <span style={{ color: 'var(--pink)', fontWeight: 600 }}>Femiro</span>
                    </p>
                  </div>
                  <StarDivider />
                </div>

                <form className="account-form" onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="input-field">
                    <label htmlFor="signin-email">Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon-left" size={16} />
                      <input
                        id="signin-email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-field">
                    <label htmlFor="signin-password">Password</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon-left" size={16} />
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="input-icon-right-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button type="button" className="forgot-password-link" onClick={() => setAuthMode('forgot')}>
                    Forgot Password?
                  </button>

                  {loginError && <p className="signin-error">{loginError}</p>}
                  
                  <button className="button dark product-add-btn" type="submit" style={{ width: '100%', borderRadius: '10px', height: '48px', textTransform: 'none', fontSize: '14px !important', letterSpacing: 'normal' }}>
                    Sign In
                  </button>
                </form>

                <div className="oauth-divider">or continue with</div>

                <div className="oauth-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <button className="oauth-btn" type="button" style={{ width: '100%' }} onClick={() => { setUserEmail('Google User'); navigate('/'); }}>
                    <GoogleIcon /> Continue with Google
                  </button>
                </div>

                <div className="signin-card-footer">
                  Don't have an account? <button type="button" onClick={() => { setAuthMode('signup'); setLoginError(null); }}>Sign Up</button>
                </div>
              </>
            )}

            {authMode === 'signup' && (
              <>
                <div className="signin-card-header">
                  <button className="back-store-link" onClick={() => setAuthMode('signin')}>
                    ← Back to Sign In
                  </button>
                  <div style={{ textAlign: 'center', width: '100%', marginTop: '8px' }}>
                    <h2 style={{ font: "500 clamp(28px, 3.5vw, 36px) 'Playfair Display', serif", margin: '0 0 4px', color: 'var(--ink)' }}>
                      Create <span style={{ color: 'var(--wine)', fontStyle: 'italic' }}>Account</span>
                    </h2>
                    <p className="signin-subtitle">
                      Join <span style={{ color: 'var(--pink)', fontWeight: 600 }}>Femiro</span> today.
                    </p>
                  </div>
                  <StarDivider />
                </div>

                <form className="account-form" onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="input-field">
                    <label htmlFor="signup-name">Full Name</label>
                    <div className="input-wrapper">
                      <User className="input-icon-left" size={16} />
                      <input
                        id="signup-name"
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-field">
                    <label htmlFor="signup-email">Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon-left" size={16} />
                      <input
                        id="signup-email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="input-field">
                    <label htmlFor="signup-password">Password</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon-left" size={16} />
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Create a password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="input-icon-right-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {loginError && <p className="signin-error">{loginError}</p>}
                  
                  <button className="button dark product-add-btn" type="submit" style={{ width: '100%', borderRadius: '10px', height: '48px', textTransform: 'none', fontSize: '14px !important', letterSpacing: 'normal' }}>
                    Sign Up
                  </button>
                </form>

                <div className="oauth-divider">or sign up with</div>

                <div className="oauth-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <button className="oauth-btn" type="button" style={{ width: '100%' }} onClick={() => { setUserEmail('Google User'); navigate('/'); }}>
                    <GoogleIcon /> Sign up with Google
                  </button>
                </div>

                <div className="signin-card-footer">
                  Already have an account? <button type="button" onClick={() => { setAuthMode('signin'); setLoginError(null); }}>Sign In</button>
                </div>

              </>
            )}

            {authMode === 'forgot' && (
              <>
                <div className="signin-card-header">
                  <button className="back-store-link" onClick={() => setAuthMode('signin')}>
                    ← Back to Sign In
                  </button>
                  <div style={{ textAlign: 'center', width: '100%', marginTop: '8px' }}>
                    <h2 style={{ font: "500 clamp(28px, 3.5vw, 36px) 'Playfair Display', serif", margin: '0 0 4px', color: 'var(--ink)' }}>
                      Reset <span style={{ color: 'var(--wine)', fontStyle: 'italic' }}>Password</span>
                    </h2>
                    <p className="signin-subtitle">
                      Enter email to recover password.
                    </p>
                  </div>
                  <StarDivider />
                </div>

                <form className="account-form" onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div className="input-field">
                    <label htmlFor="forgot-email">Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon-left" size={16} />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                      />
                    </div>
                  </div>

                  {loginError && <p className="signin-error">{loginError}</p>}
                  {resetSuccess && <p style={{ color: '#137333', fontSize: '13px', fontWeight: 600, margin: 0 }}>{resetSuccess}</p>}
                  
                  <button className="button dark product-add-btn" type="submit" style={{ width: '100%', borderRadius: '10px', height: '48px', textTransform: 'none', fontSize: '14px !important', letterSpacing: 'normal' }}>
                    Send Reset Link
                  </button>
                </form>

                <div className="signin-card-footer" style={{ marginTop: '36px' }}>
                  Remember your password? <button type="button" onClick={() => setAuthMode('signin')}>Sign In</button>
                </div>
              </>
            )}

            <div className="signin-admin-info">
              <p>Admin Email: <strong>admin@femiro.com</strong></p>
              <p>Password: <strong>makkuani47*</strong></p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">YOUR FEMIRO ACCOUNT</p>
        <h1>Welcome, {userEmail}</h1>
        <p>Manage your saved delivery locations, view order history, or access admin controls.</p>
      </div>

      <div className="account-wrapper">
          <nav className="account-tabs">
            <button
              className={activeTab === 'locations' ? 'active' : ''}
              onClick={() => setActiveTab('locations')}
            >
              <MapPin size={18} /> Saved Locations ({addresses.length})
            </button>
            <button
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              <PackageCheck size={18} /> Order History ({orders.length})
            </button>
            <button
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              <CreditCard size={18} /> Profile & Settings
            </button>
            <button onClick={handleLogout} style={{ color: '#c5221f', marginTop: '20px' }}>
              <LogOut size={18} /> Sign Out
            </button>
          </nav>

          <section className="account-section">
            {isAdmin && (
              <div className="admin-banner-card">
                <div className="admin-banner-info">
                  <ShieldCheck size={24} color="var(--wine)" />
                  <div>
                    <b style={{ color: 'var(--wine)', fontSize: '14px' }}>Administrator Mode Active</b>
                    <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>
                      Logged in as admin@femiro.com with full store management access.
                    </p>
                  </div>
                </div>
                <button className="button dark" style={{ width: 'auto' }} onClick={() => navigate('/cms')}>
                  Open CMS Dashboard
                </button>
              </div>
            )}

            {activeTab === 'locations' && (
              <div>
                <div className="account-section-header">
                  <div>
                    <h2>Saved Delivery Locations</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                      Add or update address locations for seamless one-click checkout.
                    </p>
                  </div>
                  <button className="button dark" style={{ width: 'auto' }} onClick={() => openAddressModal()}>
                    <Plus size={16} /> Add New Location
                  </button>
                </div>

                <div className="address-grid">
                  {addresses.map(addr => (
                    <div key={addr.id} className={addr.isDefault ? 'address-card default' : 'address-card'}>
                      <span className="address-tag">{addr.tag}</span>
                      {addr.isDefault && (
                        <span
                          style={{
                            float: 'right',
                            fontSize: '10px',
                            color: 'var(--wine)',
                            fontWeight: 600,
                            letterSpacing: '0.05em'
                          }}
                        >
                          ✓ DEFAULT
                        </span>
                      )}
                      <h3>{addr.name}</h3>
                      <p>
                        {addr.street}
                        <br />
                        {addr.city}, {addr.state} - {addr.pincode}
                        <br />
                        Phone: {addr.mobile}
                      </p>
                      <div className="address-actions">
                        <button onClick={() => openAddressModal(addr)}>Edit</button>
                        <button onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                      </div>
                    </div>
                  ))}

                  <button className="add-address-btn" onClick={() => openAddressModal()}>
                    <Plus size={24} />
                    <span>Add Another Delivery Location</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <div className="account-section-header">
                  <h2>Order History & Tracking</h2>
                </div>
                <div className="orders-list">
                  {orders.map(ord => (
                    <div key={ord.id} className="order-card">
                      <div className="order-header">
                        <div>
                          <b>{ord.id}</b> · <small>{ord.date}</small>
                        </div>
                        <span className="order-status">{ord.status}</span>
                      </div>
                      <div className="order-items">
                        {ord.items.map((item, idx) => (
                          <img key={idx} src={item.image} alt={item.name} className="order-item-thumb" />
                        ))}
                        <div style={{ alignSelf: 'center', fontSize: '13px' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>Total Paid: {money(ord.total)}</p>
                          <small style={{ color: '#666' }}>Deliver to: {ord.deliveryAddress}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <div className="account-section-header">
                  <h2>Profile Details</h2>
                </div>
                <form className="account-form" onSubmit={e => e.preventDefault()}>
                  <label>
                    Account Email
                    <input type="email" disabled value={userEmail || ''} />
                  </label>
                  <label>
                    Account Role
                    <input type="text" disabled value={isAdmin ? 'Administrator (CMS Access)' : 'Customer'} />
                  </label>
                </form>
              </div>
            )}
          </section>
        </div>

      {/* Address Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>{editingAddress ? 'Edit Delivery Location' : 'Add New Location'}</h3>
            <form onSubmit={handleSaveAddress} className="form-grid">
              <div className="input-field full">
                <label>Full Name</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="input-field full">
                <label>Street Address / Flat No.</label>
                <input required value={formStreet} onChange={e => setFormStreet(e.target.value)} />
              </div>
              <div className="input-field">
                <label>City</label>
                <input required value={formCity} onChange={e => setFormCity(e.target.value)} />
              </div>
              <div className="input-field">
                <label>State</label>
                <input required value={formState} onChange={e => setFormState(e.target.value)} />
              </div>
              <div className="input-field">
                <label>Pincode</label>
                <input required value={formPincode} onChange={e => setFormPincode(e.target.value)} />
              </div>
              <div className="input-field">
                <label>Mobile Phone</label>
                <input required value={formMobile} onChange={e => setFormMobile(e.target.value)} />
              </div>
              <div className="input-field">
                <label>Location Tag</label>
                <select value={formTag} onChange={e => setFormTag(e.target.value as any)}>
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-field full" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="defCheck"
                  checked={formDefault}
                  onChange={e => setFormDefault(e.target.checked)}
                />
                <label htmlFor="defCheck" style={{ textTransform: 'none', cursor: 'pointer' }}>
                  Set as default delivery address
                </label>
              </div>
              <div className="full" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="button dark" style={{ flex: 1 }}>
                  Save Location
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ width: 'auto' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
