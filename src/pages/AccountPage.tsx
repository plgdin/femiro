import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { MapPin, PackageCheck, CreditCard, Plus, ShieldCheck, LogOut, Mail, Lock, Eye, EyeOff, User, Download } from 'lucide-react'
import type { Address, Order } from '../types'
import { money } from '../data/initialData'
import { Logo } from '../components/Logo'
import { supabase } from '../lib/supabase'
import { deleteAddress, saveAddress } from '../services/storeService'

type AdminUser = {
  id: string
  email: string
  displayName: string
  role: 'user' | 'employee' | 'admin'
}

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
  setUserEmail,
  setUserRole,
  userRole,
  userId
}: {
  navigate: (path: string) => void
  addresses: Address[]
  setAddresses: Dispatch<SetStateAction<Address[]>>
  orders: Order[]
  isAdmin: boolean
  setIsAdmin: Dispatch<SetStateAction<boolean>>
  userEmail: string | null
  setUserEmail: Dispatch<SetStateAction<string | null>>
  userRole?: 'admin' | 'employee' | 'user'
  setUserRole?: Dispatch<SetStateAction<'admin' | 'employee' | 'user'>>
  userId?: string | null
}) {
  const handleDownloadInvoice = (ord: Order) => {
    const itemsHtml = ord.items.map(item => 
      '<tr>' +
      '<td>' + item.name + '</td>' +
      '<td>' + (item.size || 'Free Size') + '</td>' +
      '<td>' + item.qty + '</td>' +
      '<td>₹' + item.price + '</td>' +
      '<td>₹' + (item.price * item.qty) + '</td>' +
      '</tr>'
    ).join('')

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice - Femiro Designs</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c2c2c; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #842952; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #842952; }
    .title { font-size: 28px; text-transform: uppercase; color: #842952; }
    .details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .table th, .table td { border-bottom: 1px solid #ded5d8; padding: 12px; text-align: left; }
    .table th { background: #fdf2f6; color: #842952; font-weight: bold; }
    .total-section { margin-top: 30px; text-align: right; font-size: 16px; }
    .total-amount { font-size: 20px; font-weight: bold; color: #842952; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #8c7e83; border-top: 1px solid #ded5d8; padding-top: 20px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">FEMIRO DESIGNS</div>
      <p style="margin: 5px 0 0 0;">femirodesigns@gmail.com | +91 95626 37753</p>
    </div>
    <div class="title">Invoice</div>
  </div>
  
  <div class="details">
    <div>
      <h3>Order Information</h3>
      <p><strong>Order ID:</strong> ${ord.id}</p>
      <p><strong>Date:</strong> ${ord.date}</p>
      <p><strong>Status:</strong> ${ord.status}</p>
    </div>
    <div>
      <h3>Delivery Address</h3>
      <p>${ord.deliveryAddress}</p>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Item Details</th>
        <th>Size</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="total-section">
    <p>Total Paid: <span class="total-amount">₹${ord.total}</span></p>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Femiro Designs!</p>
    <p class="no-print"><button onclick="window.print()" style="padding: 8px 16px; background: #842952; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Invoice</button></p>
  </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_${ord.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [roleSaving, setRoleSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin || !userId) return
    const loadAdminUsers = async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      const response = await fetch('/api/admin-users', { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) return
      const result = await response.json() as { users?: AdminUser[] }
      setAdminUsers(result.users || [])
    }
    void loadAdminUsers()
  }, [isAdmin, userId])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Password changed successfully.')
  }

  const handleRoleChange = async (targetId: string, role: AdminUser['role']) => {
    setRoleSaving(targetId)
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      setRoleSaving(null)
      return
    }
    const response = await fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: targetId, role })
    })
    if (response.ok) setAdminUsers(users => users.map(user => user.id === targetId ? { ...user, role } : user))
    setRoleSaving(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    const lowerEmail = emailInput.trim().toLowerCase()
    if (!lowerEmail || !passwordInput) {
      setLoginError('Please enter a valid email address.')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: lowerEmail,
      password: passwordInput
    })

    if (error || !data.user) {
      setLoginError(error?.message || 'Unable to sign in.')
      return
    }

    const role = data.user.app_metadata?.role === 'admin' || data.user.app_metadata?.role === 'employee'
      ? data.user.app_metadata.role
      : 'user'
    setIsAdmin(role !== 'user')
    setUserRole?.(role)
    setUserEmail(data.user.email || lowerEmail)
    navigate(role === 'user' ? '/' : '/cms')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    if (!emailInput.trim() || !nameInput.trim() || !passwordInput) {
      setLoginError('Please fill out all fields.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailInput.trim().toLowerCase(),
      password: passwordInput,
      options: { data: { name: nameInput.trim() } }
    })

    if (error) {
      setLoginError(error.message)
      return
    }

    if (data.user && data.session) {
      setIsAdmin(false)
      setUserRole?.('user')
      setUserEmail(data.user.email || emailInput.trim().toLowerCase())
      navigate('/')
    } else {
      setResetSuccess('Account created. Check your email to confirm it, then sign in.')
      setAuthMode('signin')
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    if (!emailInput.trim()) {
      setLoginError('Please enter your email.')
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/account'
    })
    if (error) {
      setLoginError(error.message)
      return
    }
    setResetSuccess('Password reset link sent. Check your email.')
  }


  const handleLogout = () => {
    void supabase.auth.signOut()
    setIsAdmin(false)
    setUserRole?.('user')
    setUserEmail(null)
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
      setFormName('')
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
    let nextAddresses: Address[] = []
    if (editingAddress) {
      nextAddresses = addresses.map(a =>
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
      nextAddresses = [...addresses, newAddr]
    }
    if (formDefault) nextAddresses = nextAddresses.map(a => ({ ...a, isDefault: a.id === (editingAddress?.id || nextAddresses[nextAddresses.length - 1]?.id) }))
    setAddresses(nextAddresses)
    if (userId) void Promise.all(nextAddresses.map(address => saveAddress(userId, address)))
    setIsModalOpen(false)
  }

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id))
    void deleteAddress(id)
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

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell account-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR FEMIRO ACCOUNT</p>
        <h1>Welcome</h1>
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
                      Staff access enabled for this account.
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
                          {ord.shippingId && (
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--wine)', fontWeight: 600 }}>
                              Tracking ID: <span style={{ fontFamily: 'monospace', background: '#fdf2f6', padding: '2px 6px', borderRadius: '4px' }}>{ord.shippingId}</span>
                            </p>
                          )}
                          {ord.notes && (
                            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#555', fontStyle: 'italic', background: '#fcfafb', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid var(--wine)', maxWidth: '400px', lineHeight: 1.4 }}>
                              <strong>Seller Note:</strong> {ord.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Download Invoice Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '14px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                        <button
                          type="button"
                          className="button secondary"
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', height: '32px' }}
                          onClick={() => handleDownloadInvoice(ord)}
                        >
                          <Download size={13} /> Download Invoice
                        </button>
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
                <div className="profile-fields">
                  <label className="profile-field">
                    Account Email
                    <input type="email" disabled value={userEmail || ''} />
                  </label>
                </div>

                <form className="password-panel" onSubmit={handleChangePassword}>
                  <h3>Change Password</h3>
                  <p>Use a new password with at least 8 characters.</p>
                  <div className="profile-fields">
                    <label className="profile-field">
                      New Password
                      <input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                    </label>
                    <label className="profile-field">
                      Confirm Password
                      <input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </label>
                  </div>
                  {passwordError && <p className="form-error">{passwordError}</p>}
                  {passwordMessage && <p className="form-success">{passwordMessage}</p>}
                  <button className="button dark" type="submit">Change Password</button>
                </form>

                {isAdmin && (
                  <div className="role-management">
                    <div className="account-section-header">
                      <div>
                        <h2>Manage User Roles</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>Give staff CMS access. Changes apply to the account immediately.</p>
                      </div>
                    </div>
                    <div className="role-user-list">
                      {adminUsers.map(user => (
                        <div className="role-user-row" key={user.id}>
                          <div>
                            <b>{user.email}</b>
                            {user.displayName && <small>{user.displayName}</small>}
                          </div>
                          <select value={user.role} disabled={roleSaving === user.id} onChange={e => void handleRoleChange(user.id, e.target.value as AdminUser['role'])}>
                            <option value="user">Customer</option>
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
