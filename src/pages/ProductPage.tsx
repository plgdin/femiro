import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowLeft, Heart, ShoppingBag, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { Product } from '../types'
import { money } from '../data/initialData'
import { ProductCard } from '../components/ProductCard'
import { trackProductView, getPersonalizedRecommendations } from '../services/recommendationService'
import { optimizeWebpUrl } from '../lib/imageUtils'

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
  const [activeSlide, setActiveSlide] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL']

  useEffect(() => {
    if (product && product.id) {
      trackProductView(product.id)
    }
  }, [product.id])

  const recommendedProducts = useMemo(() => {
    const recs = getPersonalizedRecommendations(products, [], wished ? [product.id] : [], 4)
    return recs.filter(p => p.id !== product.id).slice(0, 4)
  }, [products, product.id, wished])

  const images = [
    optimizeWebpUrl(product.image, 1000),
    optimizeWebpUrl(product.hover || product.image, 1000)
  ].filter(Boolean)

  const scrollToSlide = (index: number) => {
    setActiveSlide(index)
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.clientWidth
      sliderRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      })
    }
  }

  const handleScroll = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.clientWidth
      const index = Math.round(sliderRef.current.scrollLeft / slideWidth)
      setActiveSlide(index)
    }
  }

  return (
    <main className="product-page page-shell">
      <div className="product-page-top">
        <button className="back-link" onClick={() => navigate('/shop')} type="button">
          <ArrowLeft size={16} />
          <span>Back to collection</span>
        </button>
      </div>

      <div className="product-detail-layout">
        {/* Interactive Image Slider / Carousel */}
        <div className="product-image-carousel-container">
          <div className="carousel-wrapper" ref={sliderRef} onScroll={handleScroll}>
            {images.map((imgUrl, idx) => (
              <div className="carousel-slide" key={idx}>
                <img
                  src={imgUrl}
                  alt={`${product.name} View ${idx + 1}`}
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85'
                  }}
                />
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="carousel-arrow prev"
                onClick={() => scrollToSlide((activeSlide - 1 + images.length) % images.length)}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="carousel-arrow next"
                onClick={() => scrollToSlide((activeSlide + 1) % images.length)}
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>

              <div className="carousel-dots">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`carousel-dot ${activeSlide === idx ? 'active' : ''}`}
                    onClick={() => scrollToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={18} color="var(--wine)" />
          <h3 className="related-heading" style={{ margin: 0 }}>Recommended for You</h3>
        </div>
        <div className="product-grid">
          {recommendedProducts.map(item => (
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

      {/* Floating Sticky Add-to-Cart Action Bar */}
      <div className="floating-add-to-cart-bar">
        <div className="floating-cart-info">
          <img src={product.image} alt={product.name} />
          <div>
            <span className="floating-title">{product.name}</span>
            <span className="floating-price">{money(product.price)} · Size {selectedSize}</span>
          </div>
        </div>
        <button className="button dark floating-btn" onClick={() => onAdd(product, selectedSize)} type="button">
          Add to Bag <ShoppingBag size={15} />
        </button>
      </div>
    </main>
  )
}
