import { useState, useRef, useEffect } from 'react'
import { Menu, Search, UserRound, Heart, ShoppingCart, X } from 'lucide-react'
import { Logo } from './Logo'
import { trackSearch } from '../services/recommendationService'
import type { Page, Product } from '../types'

export function Header({
  scrollY,
  page,
  navigate,
  wishedCount,
  cartCount,
  setMenuOpen,
  isAdmin,
  userRole = 'user',
  search = '',
  setSearch,
  searchResult = [],
  activeCategory = 'All'
}: {
  scrollY: number
  page: Page
  navigate: (path: string) => void
  wishedCount: number
  cartCount: number
  setMenuOpen: (val: boolean) => void
  isAdmin: boolean
  userRole?: 'admin' | 'employee' | 'user'
  search?: string
  setSearch?: (val: string) => void
  searchResult?: Product[]
  activeCategory?: string
}) {
  const scrolled = page !== 'home' || scrollY > 20
  const [searchExpanded, setSearchExpanded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Click outside to collapse search bar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isCategoryActive = (cat: string) => {
    if (page !== 'shop') return false
    const current = activeCategory.toLowerCase()
    const target = cat.toLowerCase()
    return current === target || current.includes(target) || target.includes(current)
  }

  return (
    <header className={`${scrolled ? 'site-header scrolled' : 'site-header'} ${page === 'cms' ? 'cms-site-header' : ''} ${isAdmin ? 'staff-site-header' : ''}`}>
      <button className="brand-button" onClick={() => navigate('/')} aria-label="Femiro home">
        <Logo />
      </button>

      <nav>
        <button
          className={page === 'shop' && isCategoryActive('All') ? 'active' : ''}
          onClick={() => navigate('/shop')}
        >
          Shop
        </button>

        <button
          className={page === 'shop' && isCategoryActive('Kurtis') ? 'active' : ''}
          onClick={() => navigate('/shop?category=Kurtis')}
        >
          Kurtis
        </button>

        <button
          className={page === 'shop' && isCategoryActive('Co-ords') ? 'active' : ''}
          onClick={() => navigate('/shop?category=Co-ords')}
        >
          Co-ords
        </button>

        <button
          className={page === 'shop' && isCategoryActive('Salwar sets') ? 'active' : ''}
          onClick={() => navigate('/shop?category=Salwar sets')}
        >
          Salwar sets
        </button>

        <button
          className={page === 'shop' && isCategoryActive('Jewelry') ? 'active' : ''}
          onClick={() => navigate('/shop?category=Jewelry')}
        >
          Jewelry
        </button>

        <button
          className={page === 'new-arrivals' ? 'active nav-highlight' : 'nav-highlight'}
          onClick={() => navigate('/new-arrivals')}
        >
          New Arrivals
        </button>

        {isAdmin && (
          <button
            className={page === 'cms' ? 'active nav-highlight' : 'nav-highlight'}
            onClick={() => navigate('/cms')}
            style={{ color: 'var(--wine)', fontWeight: 700 }}
          >
            CMS
          </button>
        )}
      </nav>

      <div className="actions">
        {/* Expanding Search Bar */}
        <div className="expanding-search-container" ref={searchRef}>
          {!searchExpanded ? (
            <button className="icon-button" onClick={() => setSearchExpanded(true)} aria-label="Search">
              <Search size={22} />
            </button>
          ) : (
            <div className="expanding-search-bar">
              <Search size={18} className="search-bar-icon" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => {
                  if (setSearch) setSearch(e.target.value)
                  trackSearch(e.target.value)
                }}
                placeholder="Search kurtis, co-ords, sets..."
                className="expanding-search-input"
              />
              <button
                className="search-clear-btn"
                onClick={() => {
                  setSearchExpanded(false)
                  if (setSearch) setSearch('')
                }}
                aria-label="Close search"
              >
                <X size={16} />
              </button>

              {/* Inline Search Dropdown */}
              {search && search.trim().length > 0 && (
                <div className="inline-search-dropdown">
                  {searchResult.length > 0 ? (
                    searchResult.slice(0, 5).map(item => (
                      <div
                        key={item.id}
                        className="inline-search-item"
                        onClick={() => {
                          setSearchExpanded(false)
                          if (setSearch) setSearch('')
                          navigate(`/product/${item.id}`)
                        }}
                      >
                        <img src={item.image} alt={item.name} />
                        <div className="search-item-info">
                          <p className="search-item-name">{item.name}</p>
                          <p className="search-item-meta">{item.type} · ₹{item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-search-results">
                      No pieces found for "{search}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="icon-button desktop-only" onClick={() => navigate('/account')} aria-label="Account">
          <UserRound size={24} />
        </button>

        <button className="icon-button desktop-only" onClick={() => navigate('/wishlist')} aria-label="Wishlist">
          <Heart size={24} />
          {wishedCount > 0 && <b>{wishedCount}</b>}
        </button>

        <button className="icon-button bag-button" onClick={() => navigate('/cart')} aria-label="Shopping cart">
          <ShoppingCart size={24} />
          {cartCount > 0 && <b>{cartCount}</b>}
        </button>

        {/* CMS Button ONLY shown if logged in as Admin */}
        {isAdmin && (
          <button className="admin-badge-btn" onClick={() => navigate('/cms')} title="Admin CMS Panel">
            {userRole === 'employee' ? 'Employee CMS' : 'Admin CMS'}
          </button>
        )}
      </div>
    </header>
  )
}
