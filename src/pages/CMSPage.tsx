import React, { useEffect, useRef, useState, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  Plus,
  LayoutDashboard,
  PackageCheck,
  Sparkles,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  Tag,
  Wand2,
  Check,
  FolderPlus,
  Shield,
  Briefcase,
  Image as ImageIcon,
  Percent,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  Upload,
  Phone,
  Mail,
  ChevronDown,
  MapPin
} from 'lucide-react'
import type { Product, Order, HeroContent, DiscountCode } from '../types'
import { money } from '../data/initialData'
import { deleteProduct, saveProduct, uploadProductImage, updateOrder } from '../services/storeService'

const AVAILABLE_COLORS = [
  { name: 'Wine', hex: '#842952' },
  { name: 'Rose', hex: '#e6b4bb' },
  { name: 'Charcoal', hex: '#2c2c2c' },
  { name: 'Linen', hex: '#ece2d6' },
  { name: 'Onyx', hex: '#191919' },
  { name: 'Beige', hex: '#d4c1ad' },
  { name: 'Blush', hex: '#f2d8d6' },
  { name: 'Plum', hex: '#8d284c' },
  { name: 'Emerald', hex: '#137333' },
  { name: 'Royal Blue', hex: '#1565c0' },
  { name: 'Gold', hex: '#d4af37' }
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size']
const DEFAULT_CATEGORY_OPTIONS = ['Kurtis', 'Salwar Sets', 'Co-ord Sets', 'Jewelry', 'Trousers', 'Dresses', 'Accessories']

function AnimatedSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="cms-animated-select" ref={selectRef}>
      <button type="button" className={`cms-select-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(current => !current)}>
        <span>{value || 'Choose category'}</span>
        <ChevronDown size={14} className={open ? 'chevron open' : 'chevron'} />
      </button>
      {open && (
        <div className="shop-dropdown-menu cms-select-menu">
          <div className="dropdown-header">Choose category</div>
          {options.map(option => (
            <button
              type="button"
              key={option}
              className={`dropdown-item ${value === option ? 'selected' : ''}`}
              onClick={() => { onChange(option); setOpen(false) }}
            >
              <span>{option}</span>
              {value === option && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CMSPage({
  products,
  setProducts,
  orders,
  categories,
  setCategories,
  heroContent = {
    eyebrow: 'MONSOON 2026',
    headline: 'Soft power, beautifully worn.',
    subtitle: 'Discover handcrafted drapes, co-ords, and festive couture designed for modern grace.',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2000&q=90',
    buttonText: 'Shop the collection',
    buttonLink: '/shop'
  },
  setHeroContent,
  discounts = [],
  setDiscounts,
  userRole = 'admin',
  userId,
  refreshOrders
}: {
  products: Product[]
  setProducts: Dispatch<SetStateAction<Product[]>>
  orders: Order[]
  categories: string[]
  setCategories: Dispatch<SetStateAction<string[]>>
  heroContent?: HeroContent
  setHeroContent?: Dispatch<SetStateAction<HeroContent>>
  discounts?: DiscountCode[]
  setDiscounts?: Dispatch<SetStateAction<DiscountCode[]>>
  userRole?: 'admin' | 'employee' | 'user'
  userId?: string | null
  refreshOrders?: () => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'hero' | 'discounts' | 'categories' | 'customers' | 'orders'>('inventory')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  
  // Order Edit States
  const [editStatus, setEditStatus] = useState<Order['status']>('Processing')
  const [editShippingId, setEditShippingId] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [isOrderSaving, setIsOrderSaving] = useState(false)
  const [orderSaveSuccess, setOrderSaveSuccess] = useState(false)

  useEffect(() => {
    if (expandedOrderId) {
      const ord = orders.find(o => o.id === expandedOrderId)
      if (ord) {
        setEditStatus(ord.status)
        setEditShippingId(ord.shippingId || '')
        setEditNotes(ord.notes || '')
        setOrderSaveSuccess(false)
      }
    }
  }, [expandedOrderId, orders])

  const handleSaveOrderDetails = async (orderId: string) => {
    setIsOrderSaving(true)
    setOrderSaveSuccess(false)
    try {
      await updateOrder(orderId, editStatus, editShippingId, editNotes)
      setOrderSaveSuccess(true)
      if (refreshOrders) {
        await refreshOrders()
      }
    } catch (err) {
      alert('Error updating order details: ' + (err as Error).message)
    } finally {
      setIsOrderSaving(false)
    }
  }

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Hero Form Fields
  const [heroForm, setHeroForm] = useState<HeroContent>(heroContent)
  const [heroSavedMsg, setHeroSavedMsg] = useState(false)

  // Discount Form Fields
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(10)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [fixedAmount, setFixedAmount] = useState(500)
  const [minSpend, setMinSpend] = useState(1999)
  const [scope, setScope] = useState<'storewide' | 'category' | 'products'>('storewide')
  const [categoryTarget, setCategoryTarget] = useState('Kurtis')
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  // Orders Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString())

  // Category State
  const [newCatInput, setNewCatInput] = useState('')

  // Product Form Fields
  const [name, setName] = useState('')
  const [type, setType] = useState('Kurtis')
  const [price, setPrice] = useState<number | ''>(2490)
  const [tag, setTag] = useState('')
  const [image, setImage] = useState('')
  const [hover, setHover] = useState('')
  const [description, setDescription] = useState('')
  const [hasColors, setHasColors] = useState(false)
  const [selectedColors, setSelectedColors] = useState<string[]>(['#842952'])
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['S', 'M', 'L', 'XL'])

  const isAdmin = userRole === 'admin'

  const availableCategories = useMemo(() => {
    return Array.from(new Set([
      ...DEFAULT_CATEGORY_OPTIONS,
      ...categories,
      ...products.map(product => product.type),
      type,
      categoryTarget
    ].filter(Boolean)))
  }, [categories, products, type, categoryTarget])

  // Image Upload Helper Function (FileReader)
  const handleImageUpload = async (file: File, setter: (url: string) => void) => {
    if (!userId) {
      alert('Please sign in again before uploading an image.')
      return
    }
    try {
      setter(await uploadProductImage(file, userId))
    } catch (error: any) {
      alert(error?.message || 'Image upload failed.')
    }
  }

  // Derive Real Customer Data from Orders
  const customerList = useMemo(() => {
    const map: Record<
      string,
      { name: string; email: string; phone: string; address: string; ordersCount: number; spent: number }
    > = {}

    orders.forEach(o => {
      const key = o.customerEmail || o.id
      const namePart = o.customerEmail?.split('@')[0] || 'Customer'

      if (!map[key]) {
        map[key] = {
          name: namePart,
          email: o.customerEmail || 'Not provided',
          phone: o.customerPhone || 'Not provided',
          address: o.deliveryAddress,
          ordersCount: 0,
          spent: 0
        }
      }
      map[key].ordersCount += 1
      map[key].spent += o.total
    })

    return Object.values(map)
  }, [orders])

  // Calculate Monthly Sales Analytics
  const currentMonthStr = new Date().toISOString().substring(0, 7)
  const monthlyOrders = orders.filter(o => o.date.startsWith(currentMonthStr))
  const monthlySalesTotal = monthlyOrders.reduce((sum, o) => sum + o.total, 0)
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

  // Download CSV helper function
  const downloadOrdersCSV = () => {
    if (!isAdmin) {
      alert('Access Restricted: Only Administrators can export sales data.')
      return
    }
    if (orders.length === 0) {
      alert('No orders available to export.')
      return
    }

    const headers = ['Order ID', 'Date', 'Delivery Address', 'Status', 'Total (INR)']
    const rows = orders.map(o => [
      o.id,
      o.date,
      `"${o.deliveryAddress.replace(/"/g, '""')}"`,
      o.status,
      o.total
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Femiro_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openForm = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod)
      setName(prod.name)
      setType(prod.type)
      setPrice(prod.price)
      setTag(prod.tag || '')
      setImage(prod.image)
      setHover(prod.hover)
      setDescription(prod.description)
      setHasColors(prod.hasColors || false)
      setSelectedColors(prod.colors || ['#842952'])
      setSelectedSizes(prod.sizes || ['S', 'M', 'L', 'XL'])
    } else {
      setEditingProduct(null)
      setName('')
      setType(categories[0] || 'Kurtis')
      setPrice(2990)
      setTag('NEW')
      setImage('')
      setHover('')
      setDescription('')
      setHasColors(false)
      setSelectedColors(['#842952'])
      setSelectedSizes(['S', 'M', 'L', 'XL'])
    }
    setIsFormOpen(true)
  }

  const handleAutoGenerateDesc = () => {
    const title = name.trim() || 'item'
    const cat = type.toLowerCase()

    let desc = ''
    if (cat.includes('jewel') || cat.includes('necklace') || cat.includes('earring')) {
      desc = `An exquisite statement ${title} handcrafted with luminous finishing, designed to elevate any evening attire.`
    } else if (cat.includes('kurti')) {
      desc = `A fluid ${title} featuring elegant drapes and subtle hand-finished embroidery, tailored for effortless grace.`
    } else if (cat.includes('salwar')) {
      desc = `A timeless ${title} with intricate embroidery and a graceful silhouette, crafted for grand occasions.`
    } else if (cat.includes('co-ord')) {
      desc = `A modern luxury ${title} designed with clean tailored lines and breathable premium fabric.`
    } else if (cat.includes('trouser') || cat.includes('pant')) {
      desc = `A sophisticated wide-leg ${title} featuring clean waist detailing and flexible movement.`
    } else {
      desc = `A premium ${title} combining refined craftsmanship and timeless elegance for the modern wardrobe.`
    }

    setDescription(desc)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const product: Product = editingProduct
      ? {
          ...editingProduct,
          name,
          type,
          price: Number(price),
          oldPrice: editingProduct.oldPrice,
          tag: tag || undefined,
          image,
          hover,
          description,
          hasColors,
          colors: hasColors ? selectedColors : undefined,
          sizes: selectedSizes
        }
      : {
          id: Date.now(),
          name,
          type,
          price: Number(price),
          tag: tag || undefined,
          image,
          hover,
          description,
          hasColors,
          colors: hasColors ? selectedColors : undefined,
          sizes: selectedSizes,
          inStock: true
        }

    try {
      await saveProduct(product)
      setProducts(prev => editingProduct ? prev.map(item => item.id === product.id ? product : item) : [product, ...prev])
      setIsFormOpen(false)
    } catch (error: any) {
      alert(error?.message || 'Could not save product to Supabase.')
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!isAdmin) {
      alert('Access Restricted: Only Administrators can delete catalog products.')
      return
    }
    if (confirm('Delete this product from catalog?')) {
      try {
        await deleteProduct(id)
        setProducts(prev => prev.filter(p => p.id !== id))
      } catch (error: any) {
        alert(error?.message || 'Could not delete product.')
      }
    }
  }

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault()
    if (setHeroContent) {
      setHeroContent(heroForm)
    }
    setHeroSavedMsg(true)
    setTimeout(() => setHeroSavedMsg(false), 3000)
  }

  const handleAddDiscount = (e: React.FormEvent) => {
    e.preventDefault()
    if (!setDiscounts) return
    if (scope === 'products' && selectedProductIds.length === 0) {
      alert('Select at least one product for this discount.')
      return
    }
    const newDisc: DiscountCode = {
      id: `disc-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      fixedAmount: discountType === 'fixed' ? Number(fixedAmount) : undefined,
      type: discountType,
      minSpend: Number(minSpend),
      scope,
      categoryTarget: scope === 'category' ? categoryTarget : undefined,
      productIds: scope === 'products' ? selectedProductIds : undefined,
      active: true
    }
    setDiscounts(prev => [newDisc, ...prev])
    setIsDiscountModalOpen(false)
    setCode('')
    setSelectedProductIds([])
  }

  const toggleDiscountActive = (id: string) => {
    if (!setDiscounts) return
    setDiscounts(prev => prev.map(d => (d.id === id ? { ...d, active: !d.active } : d)))
  }

  const handleDeleteDiscount = (id: string) => {
    if (!setDiscounts) return
    if (confirm('Delete this discount code?')) {
      setDiscounts(prev => prev.filter(d => d.id !== id))
    }
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      alert('Access Restricted: Only Administrators can modify categories.')
      return
    }
    const cat = newCatInput.trim()
    if (cat && !categories.includes(cat)) {
      setCategories(prev => [...prev, cat])
      setNewCatInput('')
    }
  }

  const handleDeleteCategory = (catToDelete: string) => {
    if (!isAdmin) {
      alert('Access Restricted: Only Administrators can delete categories.')
      return
    }
    if (confirm(`Remove category "${catToDelete}"?`)) {
      setCategories(prev => prev.filter(c => c !== catToDelete))
    }
  }

  const handleRefreshOrders = async () => {
    setIsRefreshing(true)
    try {
      await refreshOrders?.()
      setLastRefreshed(new Date().toLocaleTimeString())
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleSize = (sz: string) => {
    setSelectedSizes(prev => (prev.includes(sz) ? prev.filter(s => s !== sz) : [...prev, sz]))
  }

  const toggleColor = (hex: string) => {
    setSelectedColors(prev => (prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]))
  }

  return (
    <main className="page-shell cms-page">
      {/* Header Banner */}
      <div className="cms-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isAdmin ? <Shield size={14} color="#842952" /> : <Briefcase size={14} color="#1565c0" />}
              {isAdmin ? 'ADMINISTRATOR ACCESS' : 'EMPLOYEE ACCESS'}
            </span>
          </div>
          <h1>Store Management CMS</h1>
        </div>
        <button className="button dark" style={{ width: 'auto' }} onClick={() => openForm()}>
          <Plus size={16} /> Add New Product
        </button>
      </div>

      {/* Touch-Friendly Responsive Navigation Tabs */}
      <div className="cms-nav-tabs">
        <button
          className={`cms-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <LayoutDashboard size={16} /> Inventory ({products.length})
        </button>

        {isAdmin && (
          <>
            <button
              className={`cms-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} /> Sales & Analytics
            </button>

            <button
              className={`cms-tab-btn ${activeTab === 'hero' ? 'active' : ''}`}
              onClick={() => setActiveTab('hero')}
            >
              <ImageIcon size={16} /> Hero Banner
            </button>

            <button
              className={`cms-tab-btn ${activeTab === 'discounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('discounts')}
            >
              <Percent size={16} /> Discounts ({discounts.length})
            </button>

            <button
              className={`cms-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <Tag size={16} /> Categories ({categories.length})
            </button>

            <button
              className={`cms-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <UserCheck size={16} /> Customers ({customerList.length})
            </button>

            <button
              className={`cms-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <PackageCheck size={16} /> Orders ({orders.length})
            </button>
          </>
        )}
      </div>

      {/* Responsive Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <LayoutDashboard size={24} />
          </div>
          <div className="stat-info">
            <h4>Total Products</h4>
            <span>{products.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <PackageCheck size={24} />
          </div>
          <div className="stat-info">
            <h4>Total Orders</h4>
            <span>{orders.length}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="stat-card">
            <div className="stat-icon">
              <Sparkles size={24} />
            </div>
            <div className="stat-info">
              <h4>Store Revenue</h4>
              <span>{money(totalRevenue)}</span>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Catalog Inventory</span>
          </div>
          <div className="cms-table-wrapper">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type / Category</th>
                  <th>Price</th>
                  <th>Sizes</th>
                  <th>Colors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.image} alt={p.name} />
                    </td>
                    <td>
                      <b>{p.name}</b>
                      <br />
                      <small style={{ color: '#888' }}>ID: #{p.id}</small>
                    </td>
                    <td>{p.type}</td>
                    <td>
                      {money(p.price)} {p.oldPrice && <del style={{ color: '#888', marginLeft: '4px' }}>{money(p.oldPrice)}</del>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(p.sizes || ['S', 'M', 'L', 'XL']).map(s => (
                          <span
                            key={s}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              background: '#f1f3f4',
                              fontWeight: 600
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          background: p.hasColors ? '#e6f4ea' : '#f1f3f4',
                          color: p.hasColors ? '#137333' : '#5f6368',
                          fontWeight: 600
                        }}
                      >
                        {p.hasColors ? 'Swatches ON' : 'Swatches OFF'}
                      </span>
                    </td>
                    <td>
                      <div className="cms-actions">
                        <button onClick={() => openForm(p)}>
                          <Edit size={14} /> Edit
                        </button>
                        {isAdmin && (
                          <button className="delete" onClick={() => handleDeleteProduct(p.id)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: ANALYTICS & SALES DASHBOARD (Admin Only) */}
      {isAdmin && activeTab === 'analytics' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Sales Analytics & Financial Performance</span>
            <button
              type="button"
              className="button dark"
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={downloadOrdersCSV}
            >
              <Download size={16} /> Download Sales Report (CSV)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ padding: '20px', borderRadius: '12px', background: '#faf8f9', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--wine)', marginBottom: '8px' }}>
                <TrendingUp size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>This Month Sales</span>
              </div>
              <h2 style={{ fontSize: '26px', margin: 0, color: 'var(--ink)' }}>{money(monthlySalesTotal)}</h2>
              <small style={{ color: '#7a6a70', fontSize: '12px' }}>{monthlyOrders.length} orders placed this month</small>
            </div>

            <div style={{ padding: '20px', borderRadius: '12px', background: '#faf8f9', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--wine)', marginBottom: '8px' }}>
                <DollarSign size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>All-Time Revenue</span>
              </div>
              <h2 style={{ fontSize: '26px', margin: 0, color: 'var(--ink)' }}>{money(totalRevenue)}</h2>
              <small style={{ color: '#7a6a70', fontSize: '12px' }}>From {orders.length} total orders</small>
            </div>

            <div style={{ padding: '20px', borderRadius: '12px', background: '#faf8f9', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--wine)', marginBottom: '8px' }}>
                <Calendar size={20} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Average Order Value</span>
              </div>
              <h2 style={{ fontSize: '26px', margin: 0, color: 'var(--ink)' }}>{money(averageOrderValue)}</h2>
              <small style={{ color: '#7a6a70', fontSize: '12px' }}>AOV per order</small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--wine)' }}>Recent Transactions & Sales Ledger</h3>
          </div>

          <div className="cms-table-wrapper">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer Address</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <tr key={ord.id}>
                    <td>
                      <b>{ord.id}</b>
                    </td>
                    <td>{ord.date}</td>
                    <td style={{ maxWidth: '240px' }}>{ord.deliveryAddress}</td>
                    <td>
                      <b style={{ color: '#137333' }}>{money(ord.total)}</b>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: ord.status === 'Processing' ? '#fff3e0' : '#e8f5e9',
                          color: ord.status === 'Processing' ? '#e65100' : '#2e7d32'
                        }}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: HERO SECTION EDITOR WITH DIRECT FILE UPLOAD (Admin Only) */}
      {isAdmin && activeTab === 'hero' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Customize Homepage Hero Banner</span>
          </div>

          {heroSavedMsg && (
            <div style={{ padding: '10px 14px', marginBottom: '16px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              🎉 Hero section updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveHero} className="form-grid" style={{ maxWidth: '680px' }}>
            <div className="input-field full">
              <label>Main Headline</label>
              <input
                value={heroForm.headline}
                onChange={e => setHeroForm(prev => ({ ...prev, headline: e.target.value }))}
                placeholder="e.g. Soft power, beautifully worn."
              />
            </div>

            <div className="input-field full">
              <label>Subtitle / Description</label>
              <textarea
                rows={2}
                value={heroForm.subtitle}
                onChange={e => setHeroForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="e.g. Discover handcrafted drapes and co-ords..."
              />
            </div>

            {/* DIRECT FILE UPLOAD FOR HERO IMAGE */}
            <div className="input-field full">
              <label>Hero Background Image</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={heroForm.imageUrl}
                  onChange={e => setHeroForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Image URL or upload local file"
                  style={{ flex: 1 }}
                />
                <label
                  htmlFor="hero-file-upload"
                  className="button secondary"
                  style={{ width: 'auto', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Upload size={14} /> Upload Image File
                </label>
                <input
                  id="hero-file-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) void handleImageUpload(file, url => setHeroForm(prev => ({ ...prev, imageUrl: url })))
                  }}
                />
              </div>

              {heroForm.imageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={heroForm.imageUrl}
                    alt="Hero Preview"
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>
              )}
            </div>

            <div className="input-field">
              <label>CTA Button Text</label>
              <input
                value={heroForm.buttonText}
                onChange={e => setHeroForm(prev => ({ ...prev, buttonText: e.target.value }))}
              />
            </div>

            <div className="input-field">
              <label>CTA Button Link</label>
              <input
                value={heroForm.buttonLink}
                onChange={e => setHeroForm(prev => ({ ...prev, buttonLink: e.target.value }))}
              />
            </div>

            <div className="full" style={{ marginTop: '12px' }}>
              <button type="submit" className="button dark" style={{ width: 'auto' }}>
                Save Hero Settings
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 4: DISCOUNTS & PROMOTIONS (Admin Only) */}
      {isAdmin && activeTab === 'discounts' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Discount Codes & Store Promotions</span>
            <button
              type="button"
              className="button dark"
              style={{ width: 'auto' }}
              onClick={() => setIsDiscountModalOpen(true)}
            >
              <Plus size={16} /> Create Discount Code
            </button>
          </div>

          <div className="cms-table-wrapper">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Promo Code</th>
                  <th>Discount</th>
                  <th>Scope</th>
                  <th>Min Spend</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id}>
                    <td>
                      <b style={{ color: 'var(--wine)', letterSpacing: '0.05em' }}>{d.code}</b>
                    </td>
                    <td>{d.type === 'percent' ? `${d.discountPercent}% OFF` : money(d.fixedAmount || 0)}</td>
                    <td>
                      <span style={{ textTransform: 'capitalize' }}>
                        {d.scope === 'category'
                          ? `Category: ${d.categoryTarget}`
                          : d.scope === 'products'
                            ? `${d.productIds?.length || 0} selected products`
                            : 'Storewide'}
                      </span>
                    </td>
                    <td>{money(d.minSpend)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleDiscountActive(d.id)}
                        style={{
                          background: 'none',
                          border: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: d.active ? '#2e7d32' : '#757575',
                          fontWeight: 600
                        }}
                      >
                        {d.active ? <ToggleRight size={22} color="#2e7d32" /> : <ToggleLeft size={22} color="#757575" />}
                        {d.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td>
                      <div className="cms-actions">
                        <button className="delete" onClick={() => handleDeleteDiscount(d.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: CATEGORIES TAB (Admin Only) */}
      {isAdmin && activeTab === 'categories' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Manage Product Categories</span>
          </div>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px', marginBottom: '24px', maxWidth: '500px' }}>
            <input
              type="text"
              placeholder="Enter new category (e.g. Jewelry, Footwear)"
              value={newCatInput}
              onChange={e => setNewCatInput(e.target.value)}
              className="custom-address-field"
              style={{ margin: 0 }}
            />
            <button type="submit" className="button dark" style={{ width: 'auto' }}>
              <FolderPlus size={16} /> Add Category
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {categories.map(cat => {
              const count = products.filter(p => p.type === cat).length
              return (
                <div
                  key={cat}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--line)',
                    background: '#faf8f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <b style={{ fontSize: '15px', color: 'var(--wine)' }}>{cat}</b>
                    <div style={{ fontSize: '12px', color: '#7a6a70', marginTop: '2px' }}>{count} products</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    style={{
                      background: '#fce8e6',
                      color: '#c5221f',
                      border: 0,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* TAB 6: CUSTOMERS TAB (REAL DYNAMIC CUSTOMER DATA ONLY - NO MOCK DATA) */}
      {isAdmin && activeTab === 'customers' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Real Customer Directory & Accounts</span>
          </div>

          {customerList.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7a6a70' }}>
              No real customer orders placed yet. As customers place orders, their phone number, email, and address will automatically register here.
            </div>
          ) : (
            <div className="cms-table-wrapper">
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Delivery Address</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customerList.map((cust, idx) => (
                    <tr key={idx}>
                      <td>
                        <b>{cust.name}</b>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} color="#842952" /> {cust.email}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="#2e7d32" /> {cust.phone}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#1565c0" /> {cust.address}
                        </span>
                      </td>
                      <td>{cust.ordersCount} order(s)</td>
                      <td>
                        <b>{money(cust.spent)}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 7: ORDERS TAB (Admin Only) */}
      {isAdmin && activeTab === 'orders' && (
        <section className="cms-section">
          <div className="cms-section-title">
            <span>Customer Orders</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <small style={{ fontSize: '12px', color: '#7a6a70' }}>Last updated: {lastRefreshed}</small>
              <button
                type="button"
                onClick={handleRefreshOrders}
                className="button secondary"
                style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                Refresh Orders
              </button>
            </div>
          </div>
          <div className="cms-table-wrapper">
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Delivery Destination</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <React.Fragment key={ord.id}>
                    <tr
                      onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                      style={{ cursor: 'pointer', background: expandedOrderId === ord.id ? '#fdf5f8' : 'none' }}
                      className="cms-order-row"
                    >
                      <td>
                        <b>{ord.id.slice(0, 8)}...</b>
                      </td>
                      <td>{ord.date}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ord.deliveryAddress}</td>
                      <td>
                        <b>{money(ord.total)}</b>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: ord.status === 'Processing' ? '#fff3e0' : ord.status === 'Cancelled' ? '#ffebee' : '#e8f5e9',
                            color: ord.status === 'Processing' ? '#e65100' : ord.status === 'Cancelled' ? '#c62828' : '#2e7d32'
                          }}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                    {expandedOrderId === ord.id && (
                      <tr style={{ background: '#fdfbfe' }}>
                        <td colSpan={5} style={{ padding: '24px 30px', borderTop: 'none', borderBottom: '1px solid #ded5d8' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '36px', fontSize: '13px', color: '#2c2c2c' }}>
                            <div>
                              <p style={{ margin: '0 0 12px 0', fontWeight: 700, color: 'var(--wine)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>Customer Details</p>
                              <p style={{ margin: '6px 0' }}><strong>Order ID:</strong> {ord.id}</p>
                              <p style={{ margin: '6px 0' }}><strong>Email:</strong> {ord.customerEmail || 'Not provided'}</p>
                              <p style={{ margin: '6px 0' }}><strong>Phone:</strong> {ord.customerPhone || 'Not provided'}</p>
                              <p style={{ margin: '6px 0', lineHeight: 1.4 }}><strong>Ship To:</strong> {ord.deliveryAddress}</p>
                            </div>
                            <div>
                              <p style={{ margin: '0 0 12px 0', fontWeight: 700, color: 'var(--wine)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>Items Ordered</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {ord.items.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <img src={item.image} alt={item.name} style={{ width: '45px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0d5d8' }} />
                                    <div>
                                      <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>Size: {item.size} · Qty: {item.qty} · {money(item.price)} each</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Order Update Form */}
                            <div style={{ background: '#fff', padding: '18px', borderRadius: '8px', border: '1px solid #e2d5d8' }}>
                              <p style={{ margin: '0 0 14px 0', fontWeight: 700, color: 'var(--wine)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>Update Status & Tracking</p>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '12px' }}>
                                  Order Status
                                  <select
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value as any)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', fontSize: '12px' }}
                                  >
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Payment Pending">Payment Pending</option>
                                  </select>
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '12px' }}>
                                  Shipping Tracking ID
                                  <input
                                    type="text"
                                    placeholder="e.g. DTDC12345678"
                                    value={editShippingId}
                                    onChange={e => setEditShippingId(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
                                  />
                                </label>

                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600, fontSize: '12px' }}>
                                  Notes to Customer
                                  <textarea
                                    placeholder="Add notes about packaging, delivery, delays..."
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px', minHeight: '60px', resize: 'vertical' }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  className="button dark"
                                  disabled={isOrderSaving}
                                  onClick={() => handleSaveOrderDetails(ord.id)}
                                  style={{ width: '100%', padding: '8px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', marginTop: '4px' }}
                                >
                                  {isOrderSaving ? 'Saving...' : 'Save Order Details'}
                                </button>

                                {orderSaveSuccess && (
                                  <p style={{ margin: 0, color: '#137333', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>✓ Saved successfully!</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CREATE DISCOUNT MODAL */}
      {isDiscountModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDiscountModalOpen(false)}>
          <div className="modal-card cms-discount-modal" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <h3>Create New Discount Code</h3>
            <form onSubmit={handleAddDiscount} className="form-grid cms-discount-form">
              <div className="input-field full">
                <label>Promo Code</label>
                <input
                  required
                  placeholder="e.g. FEMIRO20 / FESTIVE1000"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>

              <div className="input-field">
                <label>Discount Type</label>
                <select value={discountType} onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (INR)</option>
                </select>
              </div>

              <div className="input-field">
                <label>{discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (INR)'}</label>
                <input
                  type="number"
                  required
                  min="0"
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discountType === 'percent' ? discountPercent : fixedAmount}
                  onChange={e => discountType === 'percent' ? setDiscountPercent(Number(e.target.value)) : setFixedAmount(Number(e.target.value))}
                />
              </div>

              <div className="input-field">
                <label>Minimum Order Spend (INR)</label>
                <input
                  type="number"
                  required
                  value={minSpend}
                  onChange={e => setMinSpend(Number(e.target.value))}
                />
              </div>

              <div className="input-field full">
                <label>Applicability Scope</label>
                <select value={scope} onChange={e => setScope(e.target.value as any)}>
                  <option value="storewide">Storewide (All Products)</option>
                  <option value="category">Specific Category</option>
                  <option value="products">Selected Products</option>
                </select>
              </div>

              {scope === 'category' && (
                <div className="input-field full">
                  <label>Target Category</label>
                    <AnimatedSelect value={categoryTarget} options={availableCategories} onChange={setCategoryTarget} />
                </div>
              )}

              {scope === 'products' && (
                <div className="input-field full discount-product-picker">
                  <label>Select Products</label>
                  <div className="discount-product-list">
                    {products.length === 0 ? <span>No products available.</span> : products.map(product => (
                      <label className="discount-product-option" key={product.id}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={e => setSelectedProductIds(current => e.target.checked ? [...current, product.id] : current.filter(id => id !== product.id))}
                        />
                        <span>{product.name}</span>
                        <b>{money(product.price)}</b>
                      </label>
                    ))}
                  </div>
                  {selectedProductIds.length === 0 && <small className="form-error">Select at least one product.</small>}
                </div>
              )}

              <div className="full" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="button dark" style={{ flex: 1 }}>
                  Create Code
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ width: 'auto' }}
                  onClick={() => setIsDiscountModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CMS Add/Edit Product Modal WITH DIRECT FILE UPLOADS */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-card cms-product-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="form-grid cms-product-form">
              <div className="input-field full">
                <label>Product Title</label>
                <input required placeholder="e.g. Amara Draped Kurti" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="input-field">
                <label>Category / Type</label>
                <AnimatedSelect value={type} options={availableCategories} onChange={setType} />
              </div>

              <div className="input-field">
                <label>Badge Tag (Optional)</label>
                <input placeholder="NEW / BESTSELLER" value={tag} onChange={e => setTag(e.target.value)} />
              </div>

              <div className="input-field">
                <label>Price (INR)</label>
                <input type="number" required min="0" value={price} onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

              {/* AUTO-GENERATE DESCRIPTION BUTTON */}
              <div className="input-field full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Product Description</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateDesc}
                    style={{
                      background: 'none',
                      border: 0,
                      color: 'var(--wine)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Wand2 size={13} /> Auto-Generate Description
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter product description or click Auto-Generate above"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* SIZE SELECTION PILLS */}
              <div className="input-field full">
                <label style={{ marginBottom: '8px', display: 'block' }}>Available Sizes</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ALL_SIZES.map(sz => {
                    const isSelected = selectedSizes.includes(sz)
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleSize(sz)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: `1.5px solid ${isSelected ? 'var(--wine)' : 'var(--line)'}`,
                          background: isSelected ? 'var(--wine)' : '#fff',
                          color: isSelected ? '#fff' : 'var(--ink)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {sz}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* COLOR SWATCHES TOGGLE OPTION */}
              <div className="input-field full toggle-switch-field">
                <input
                  type="checkbox"
                  id="colorToggle"
                  checked={hasColors}
                  onChange={e => setHasColors(e.target.checked)}
                />
                <label htmlFor="colorToggle" style={{ cursor: 'pointer', textTransform: 'none', fontSize: '13px' }}>
                  <b>Enable Color Swatches</b> for this product
                </label>
              </div>

              {/* COLOR PALETTE PICKER IF COLORS ENABLED */}
              {hasColors && (
                <div className="input-field full" style={{ background: '#faf8f9', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <label style={{ marginBottom: '8px', display: 'block' }}>Select Swatch Palette</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {AVAILABLE_COLORS.map(col => {
                      const isSelected = selectedColors.includes(col.hex)
                      return (
                        <div
                          key={col.hex}
                          onClick={() => toggleColor(col.hex)}
                          title={col.name}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: col.hex,
                            border: `2px solid ${isSelected ? 'var(--wine)' : '#ddd'}`,
                            boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px var(--wine)' : 'none',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          {isSelected && <Check size={14} color={['#ece2d6', '#f2d8d6', '#d4c1ad', '#ffffff', '#e6b4bb'].includes(col.hex) ? '#000' : '#fff'} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* DIRECT FILE UPLOAD FOR PRIMARY PRODUCT IMAGE */}
              <div className="input-field full">
                <label>Primary Product Image</label>
                <div className="cms-image-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    required
                    value={image}
                    onChange={e => setImage(e.target.value)}
                    placeholder="Image URL or upload local file"
                    style={{ flex: 1 }}
                  />
                  <label
                    htmlFor="prod-primary-upload"
                    className="button secondary"
                    style={{ width: 'auto', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Upload size={14} /> Upload Image
                  </label>
                  <input
                    id="prod-primary-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) void handleImageUpload(file, setImage)
                    }}
                  />
                </div>
              </div>

              {/* DIRECT FILE UPLOAD FOR HOVER IMAGE */}
              <div className="input-field full">
                <label>Hover Secondary Product Image</label>
                <div className="cms-image-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    required
                    value={hover}
                    onChange={e => setHover(e.target.value)}
                    placeholder="Image URL or upload local file"
                    style={{ flex: 1 }}
                  />
                  <label
                    htmlFor="prod-hover-upload"
                    className="button secondary"
                    style={{ width: 'auto', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Upload size={14} /> Upload Hover Image
                  </label>
                  <input
                    id="prod-hover-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) void handleImageUpload(file, setHover)
                    }}
                  />
                </div>
              </div>

              <div className="full cms-form-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="button dark" style={{ flex: 1 }}>
                  Save to Catalog
                </button>
                <button
                  type="button"
                  className="button secondary"
                  style={{ width: 'auto' }}
                  onClick={() => setIsFormOpen(false)}
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
