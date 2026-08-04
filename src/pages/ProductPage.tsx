import { useState } from 'react'
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '../types'
import { money } from '../data/initialData'
import { ProductCard } from '../components/ProductCard'

export function ProductPage({
  product,
  navigate,
  onAdd,
  wished,
  onWish,
  products
}: {
  product: Product
  navigate: (path: string) => void
  onAdd: (product: Product, size: string) => void
  wished: boolean
  onWish: () => void
  products: Product[]
}) {
  const [selectedSize, setSelectedSize] = useState('M')
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

  const image1 = product.image
  const image2 = product.hover || product.image

  return (
    <main className="product-page page-shell">
      <div className="product-page-top">
        <button className="back-link" onClick={() => navigate('/shop')} type="button">
          <ArrowLeft size={16} />
          <span>Back to collection</span>
        </button>
      </div>

      <div className="product-detail-layout">
        {/* Exactly 2 Images Gallery */}
        <div className="detail-gallery-two">
          <div className="gallery-img-wrap">
            <img
              src={image1}
              alt={`${product.name} Main View`}
              onError={e => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85'
              }}
            />
          </div>
          <div className="gallery-img-wrap">
            <img
              src={image2}
              alt={`${product.name} Detail View`}
              onError={e => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=85'
              }}
            />
          </div>
        </div>

        {/* Product Information Column */}
        <div className="detail-copy-container">
          <div className="detail-header-block">
            <p className="eyebrow">{product.type}</p>
            <h1 className="product-title">{product.name}</h1>
            <div className="detail-price">
              <span className="current-price">{money(product.price)}</span>
              {product.oldPrice && <del className="old-price">{money(product.oldPrice)}</del>}
            </div>
            <p className="detail-description">{product.description}</p>
          </div>

          {/* Color shades if enabled */}
          {product.hasColors && product.colors && product.colors.length > 0 && (
            <div className="detail-option">
              <span className="option-label">Available Shades</span>
              <div className="swatches">
                {product.colors.map(color => (
                  <i style={{ background: color }} key={color} />
                ))}
              </div>
            </div>
          )}

          {/* Size Picker */}
          <div className="detail-option">
            <span className="option-label">Select Size</span>
            <div className="size-picker">
              {sizes.map(size => (
                <button
                  key={size}
                  className={selectedSize === size ? 'size-pill selected' : 'size-pill'}
                  onClick={() => setSelectedSize(size)}
                  type="button"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Buy & Wishlist Actions */}
          <div className="detail-actions">
            <button className="button dark product-add-btn" onClick={() => onAdd(product, selectedSize)} type="button">
              Add to bag ({selectedSize}) <ShoppingBag size={16} />
            </button>
            <button className={`save-button ${wished ? 'wished' : ''}`} onClick={onWish} aria-label="Save to wishlist" type="button">
              <Heart fill={wished ? 'var(--pink)' : 'none'} stroke={wished ? 'var(--pink)' : 'currentColor'} size={20} />
            </button>
          </div>

          {/* Information Cards */}
          <div className="product-info-cards">
            <div className="info-card">
              <div className="info-card-header">
                <span className="info-card-icon">✨</span>
                <h3>Fabric & Care</h3>
              </div>
              <p>Crafted in small batches in India. Dry clean recommended. Handle with delicate love.</p>
            </div>
            <div className="info-card">
              <div className="info-card-header">
                <span className="info-card-icon">📦</span>
                <h3>Delivery & Returns</h3>
              </div>
              <p>Complimentary express shipping across India. Standard 7-day hassle-free returns.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Products Section */}
      <div className="related-products-section">
        <h3 className="related-heading">You may also like</h3>
        <div className="product-grid">
          {products
            .filter(p => p.id !== product.id)
            .slice(0, 4)
            .map(item => (
              <ProductCard
                key={item.id}
                product={item}
                wished={false}
                onWish={() => {}}
                onAdd={() => onAdd(item, 'M')}
                onOpen={() => navigate(`/product/${item.id}`)}
              />
            ))}
        </div>
      </div>
    </main>
  )
}
