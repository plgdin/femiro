import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Plus, LayoutDashboard, PackageCheck, Sparkles, Edit, Trash2 } from 'lucide-react'
import type { Product, Order } from '../types'
import { money } from '../data/initialData'

export function CMSPage({
  products,
  setProducts,
  orders
}: {
  products: Product[]
  setProducts: Dispatch<SetStateAction<Product[]>>
  orders: Order[]
}) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [type, setType] = useState('Kurtis')
  const [price, setPrice] = useState(2490)
  const [oldPrice, setOldPrice] = useState(2990)
  const [tag, setTag] = useState('')
  const [image, setImage] = useState('')
  const [hover, setHover] = useState('')
  const [description, setDescription] = useState('')
  const [hasColors, setHasColors] = useState(false)

  const openForm = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod)
      setName(prod.name)
      setType(prod.type)
      setPrice(prod.price)
      setOldPrice(prod.oldPrice || 0)
      setTag(prod.tag || '')
      setImage(prod.image)
      setHover(prod.hover)
      setDescription(prod.description)
      setHasColors(prod.hasColors || false)
    } else {
      setEditingProduct(null)
      setName('')
      setType('Kurtis')
      setPrice(2990)
      setOldPrice(3490)
      setTag('NEW')
      setImage('https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85')
      setHover('https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=85')
      setDescription('Handcrafted premium design for the modern wardrobe.')
      setHasColors(false)
    }
    setIsFormOpen(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProduct) {
      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? {
                ...p,
                name,
                type,
                price: Number(price),
                oldPrice: Number(oldPrice) || undefined,
                tag: tag || undefined,
                image,
                hover,
                description,
                hasColors
              }
            : p
        )
      )
    } else {
      const newProd: Product = {
        id: Date.now(),
        name,
        type,
        price: Number(price),
        oldPrice: Number(oldPrice) || undefined,
        tag: tag || undefined,
        image,
        hover,
        description,
        hasColors,
        inStock: true
      }
      setProducts(prev => [newProd, ...prev])
    }
    setIsFormOpen(false)
  }

  const handleDeleteProduct = (id: number) => {
    if (confirm('Delete this product from catalog?')) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <main className="page-shell cms-page">
      <div className="cms-header">
        <div>
          <span className="eyebrow">ADMINISTRATOR CONTROL</span>
          <h1>Store Management CMS</h1>
        </div>
        <button className="button dark" style={{ width: 'auto' }} onClick={() => openForm()}>
          <Plus size={16} /> Add New Product
        </button>
      </div>

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
        <div className="stat-card">
          <div className="stat-icon">
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <h4>Store Revenue</h4>
            <span>{money(totalRevenue)}</span>
          </div>
        </div>
      </div>

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
                <th>Type</th>
                <th>Price</th>
                <th>Color Toggle</th>
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
                    {money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: p.hasColors ? '#e6f4ea' : '#f1f3f4',
                        color: p.hasColors ? '#137333' : '#5f6368'
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
                      <button className="delete" onClick={() => handleDeleteProduct(p.id)}>
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

      {/* CMS Add/Edit Product Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="form-grid">
              <div className="input-field full">
                <label>Product Title</label>
                <input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="input-field">
                <label>Category / Type</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="Kurtis">Kurtis</option>
                  <option value="Co-Ord Sets">Co-Ord Sets</option>
                  <option value="Salwar Sets">Salwar Sets</option>
                  <option value="Trousers">Trousers</option>
                </select>
              </div>
              <div className="input-field">
                <label>Badge Tag (Optional)</label>
                <input placeholder="NEW / BESTSELLER" value={tag} onChange={e => setTag(e.target.value)} />
              </div>
              <div className="input-field">
                <label>Price (INR)</label>
                <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} />
              </div>
              <div className="input-field">
                <label>Original Price (Strike-through)</label>
                <input type="number" value={oldPrice} onChange={e => setOldPrice(Number(e.target.value))} />
              </div>
              <div className="input-field full">
                <label>Image URL</label>
                <input required value={image} onChange={e => setImage(e.target.value)} />
              </div>
              <div className="input-field full">
                <label>Hover Secondary Image URL</label>
                <input required value={hover} onChange={e => setHover(e.target.value)} />
              </div>
              <div className="input-field full">
                <label>Product Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
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
                  <b>Enable Color Swatches</b> for this product (usually disabled)
                </label>
              </div>

              <div className="full" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
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
