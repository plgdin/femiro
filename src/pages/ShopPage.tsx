import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Filter, ArrowUpDown, Check } from 'lucide-react'
import type { Product } from '../types'
import { ProductCard } from '../components/ProductCard'

export function ShopPage({
  navigate,
  products,
  wished,
  onWish,
  onAdd,
  onOpen,
  initialCategory = 'All',
  onCategoryChange
}: {
  navigate: (path: string) => void
  products: Product[]
  wished: number[]
  onWish: (id: number) => void
  onAdd: (product: Product) => void
  onOpen: (product: Product) => void
  initialCategory?: string
  onCategoryChange?: (cat: string) => void
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedSort, setSelectedSort] = useState<string>('featured')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Sync selectedCategory when initialCategory prop changes (e.g. from nav clicks)
  useEffect(() => {
    setSelectedCategory(initialCategory)
  }, [initialCategory])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const categories = ['All', 'Kurtis', 'Co-ords', 'Salwar sets', 'Jewelry']

  const sortOptions = [
    { label: 'Featured', value: 'featured' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Name: A-Z', value: 'name-asc' }
  ]

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat)
    setFilterOpen(false)
    if (onCategoryChange) {
      onCategoryChange(cat)
    }
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'All') return true
    const catLower = selectedCategory.toLowerCase().trim()
    const typeLower = p.type.toLowerCase().trim()
    return typeLower.includes(catLower) || catLower.includes(typeLower)
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (selectedSort === 'price-asc') return a.price - b.price
    if (selectedSort === 'price-desc') return b.price - a.price
    if (selectedSort === 'name-asc') return a.name.localeCompare(b.name)
    return a.id - b.id // featured
  })

  const currentSortLabel = sortOptions.find(o => o.value === selectedSort)?.label || 'Featured'

  // Dynamic Title & Subtitle based on Category
  const pageTitle = selectedCategory === 'All' ? 'Shop all' : selectedCategory

  const pageSubtitles: Record<string, string> = {
    All: 'Small-batch essentials and occasion pieces, made to be lived in.',
    Kurtis: 'Fluid drapes and refined silhouettes for everyday elegance.',
    'Co-ords': 'Coordinated sets designed for effortless style and movement.',
    'Salwar sets': 'Timeless embroidery and graceful cuts for special occasions.',
    Jewelry: 'Handcrafted accent pieces to complete your look.',
  }

  const pageSubtitle = pageSubtitles[selectedCategory] || 'Explore our curated pieces.'

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">THE FEMIRO COLLECTION</p>
        <h1>{pageTitle}</h1>
        <p>{pageSubtitle}</p>
      </div>

      <div className="shop-toolbar">
        <span className="count-label">{sortedProducts.length} pieces available</span>

        <div className="toolbar-actions">
          {/* Filter Button & Dropdown */}
          <div className="dropdown-container" ref={filterRef}>
            <button
              className={`shop-toolbar-btn ${filterOpen || selectedCategory !== 'All' ? 'active' : ''}`}
              onClick={() => { setFilterOpen(!filterOpen); setSortOpen(false) }}
              type="button"
            >
              <Filter size={15} />
              <span>Category: {selectedCategory}</span>
              <ChevronDown size={14} className={`chevron ${filterOpen ? 'open' : ''}`} />
            </button>

            {filterOpen && (
              <div className="shop-dropdown-menu">
                <div className="dropdown-header">Filter by Category</div>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`dropdown-item ${selectedCategory === cat ? 'selected' : ''}`}
                    onClick={() => handleSelectCategory(cat)}
                    type="button"
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Button & Dropdown */}
          <div className="dropdown-container" ref={sortRef}>
            <button
              className={`shop-toolbar-btn ${sortOpen || selectedSort !== 'featured' ? 'active' : ''}`}
              onClick={() => { setSortOpen(!sortOpen); setFilterOpen(false) }}
              type="button"
            >
              <ArrowUpDown size={15} />
              <span>Sort: {currentSortLabel}</span>
              <ChevronDown size={14} className={`chevron ${sortOpen ? 'open' : ''}`} />
            </button>

            {sortOpen && (
              <div className="shop-dropdown-menu">
                <div className="dropdown-header">Sort Products</div>
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`dropdown-item ${selectedSort === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSort(opt.value)
                      setSortOpen(false)
                    }}
                    type="button"
                  >
                    <span>{opt.label}</span>
                    {selectedSort === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {sortedProducts.length > 0 ? (
        <div className="product-grid">
          {sortedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              wished={wished.includes(product.id)}
              onWish={() => onWish(product.id)}
              onAdd={() => onAdd(product)}
              onOpen={() => onOpen(product)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3>No pieces found in {selectedCategory}</h3>
          <p style={{ color: '#7a6a70', margin: '8px 0 24px' }}>
            We're constantly adding new handcrafted pieces. Check back soon!
          </p>
          <button
            className="empty-cart-btn"
            style={{ width: '220px', height: '48px' }}
            onClick={() => handleSelectCategory('All')}
          >
            View All Pieces
          </button>
        </div>
      )}
    </main>
  )
}
