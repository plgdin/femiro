import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, Sparkles, UserRound, CheckCircle2, X } from 'lucide-react'
import type { Product, Address, Order, CartItem, Page } from './types'
import { INITIAL_PRODUCTS, INITIAL_ADDRESSES, INITIAL_ORDERS, stored } from './data/initialData'

import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'
import { SearchOverlay } from './components/SearchOverlay'

import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { AccountPage } from './pages/AccountPage'
import { CartPage } from './pages/CartPage'
import { WishlistPage } from './pages/WishlistPage'
import { CMSPage } from './pages/CMSPage'
import { NewArrivalsPage } from './pages/NewArrivalsPage'

const pathPage = (): Page => {
  const path = window.location.pathname
  if (path.startsWith('/shop')) return 'shop'
  if (path.startsWith('/account')) return 'account'
  if (path.startsWith('/wishlist')) return 'wishlist'
  if (path.startsWith('/product')) return 'product'
  if (path.startsWith('/cart')) return 'cart'
  if (path.startsWith('/cms')) return 'cms'
  if (path.startsWith('/new-arrivals')) return 'new-arrivals'
  return 'home'
}

const getCategoryFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('category') || 'All'
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => stored('femiro-products', INITIAL_PRODUCTS))
  const [addresses, setAddresses] = useState<Address[]>(() => stored('femiro-addresses', INITIAL_ADDRESSES))
  const [orders, setOrders] = useState<Order[]>(() => stored('femiro-orders', INITIAL_ORDERS))
  const [cart, setCart] = useState<CartItem[]>(() => stored('femiro-cart', []))
  const [wished, setWished] = useState<number[]>(() => stored('femiro-wishlist', []))

  // Admin and Auth State
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('femiro-user-email'))
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('femiro-is-admin') === 'true')

  const [page, setPage] = useState<Page>(pathPage)
  const [currentCategory, setCurrentCategory] = useState<string>(getCategoryFromUrl)
  const [selected, setSelected] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const onPop = () => {
      setPage(pathPage())
      setCurrentCategory(getCategoryFromUrl())
    }
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('popstate', onPop)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('femiro-products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('femiro-addresses', JSON.stringify(addresses))
  }, [addresses])

  useEffect(() => {
    localStorage.setItem('femiro-orders', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem('femiro-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('femiro-wishlist', JSON.stringify(wished))
  }, [wished])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    const target = pathPage()

    if (path.includes('category=')) {
      const cat = new URLSearchParams(path.split('?')[1]).get('category')
      setCurrentCategory(cat || 'All')
    } else if (path === '/shop') {
      setCurrentCategory('All')
    }

    // Admin Route Protection
    if (target === 'cms' && !isAdmin) {
      setPage('account')
      window.history.pushState({}, '', '/account')
    } else {
      setPage(target)
    }

    if (path.startsWith('/product/')) {
      const pId = Number(path.split('/').pop())
      setSelected(products.find(item => item.id === pId) ?? products[0])
      
      try {
        const viewed = JSON.parse(localStorage.getItem('femiro-viewed-products') || '[]') as number[]
        if (!viewed.includes(pId)) {
          viewed.push(pId)
          localStorage.setItem('femiro-viewed-products', JSON.stringify(viewed))
        }
      } catch (e) {}
    } else {
      setSelected(null)
    }
    setSearchOpen(false)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addToCart = (product: Product, size = 'M') => {
    setCart(items => {
      const existing = items.find(i => i.product.id === product.id && i.size === size)
      if (existing) {
        return items.map(i => (i.product.id === product.id && i.size === size ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...items, { product, size, qty: 1 }]
    })

    try {
      const viewed = JSON.parse(localStorage.getItem('femiro-viewed-products') || '[]') as number[]
      if (!viewed.includes(product.id)) {
        viewed.push(product.id)
        localStorage.setItem('femiro-viewed-products', JSON.stringify(viewed))
      }
    } catch (e) {}

    // Open cart drawer immediately
    setCartOpen(true)

    setToast(`Added ${product.name} (${size}) to bag`)
    setTimeout(() => setToast(null), 3000)
  }



  const toggleWish = (id: number) => {
    const product = products.find(p => p.id === id)
    const isAlreadyWished = wished.includes(id)
    setWished(items => (isAlreadyWished ? items.filter(item => item !== id) : [...items, id]))
    if (product) {
      setToast(isAlreadyWished ? `Removed ${product.name} from wishlist` : `Added ${product.name} to wishlist ❤️`)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handlePlaceOrder = (deliveryAddress: string, total: number) => {
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        qty: item.qty,
        size: item.size
      })),
      total,
      status: 'Processing',
      deliveryAddress
    }
    setOrders(prev => [newOrder, ...prev])
    setCart([])
    setToast('🎉 Order placed successfully! View in Account.')
    setTimeout(() => setToast(null), 4000)
    navigate('/account')
  }

  const result = useMemo(
    () => products.filter(product => `${product.name} ${product.type}`.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  )

  const activeProduct = selected || products[0]

  return (
    <>
      {!(page === 'account' && !userEmail) && (
        <Header
          scrollY={scrollY}
          page={page}
          navigate={navigate}
          wishedCount={wished.length}
          cartCount={cart.reduce((s, i) => s + i.qty, 0)}
          setMenuOpen={setMenuOpen}
          isAdmin={isAdmin}
          search={search}
          setSearch={setSearch}
          searchResult={result}
          activeCategory={currentCategory}
        />
      )}


      {page === 'home' && (
        <HomePage
          navigate={navigate}
          products={products}
          wished={wished}
          onWish={toggleWish}
          onAdd={p => addToCart(p, 'M')}
          onOpen={product => navigate(`/product/${product.id}`)}
        />
      )}

      {page === 'shop' && (
        <ShopPage
          navigate={navigate}
          products={products}
          wished={wished}
          onWish={toggleWish}
          onAdd={p => addToCart(p, 'M')}
          onOpen={product => navigate(`/product/${product.id}`)}
          initialCategory={currentCategory}
          onCategoryChange={cat => navigate(cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`)}
        />
      )}

      {page === 'account' && (
        <AccountPage
          navigate={navigate}
          addresses={addresses}
          setAddresses={setAddresses}
          orders={orders}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
          userEmail={userEmail}
          setUserEmail={setUserEmail}
        />
      )}

      {page === 'cart' && (
        <CartPage
          cart={cart}
          setCart={setCart}
          addresses={addresses}
          navigate={navigate}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {page === 'wishlist' && (
        <WishlistPage
          navigate={navigate}
          products={products}
          wished={wished}
          onWish={toggleWish}
          onAdd={p => addToCart(p, 'M')}
        />
      )}

      {page === 'product' && (
        <ProductPage
          product={activeProduct}
          navigate={navigate}
          onAdd={addToCart}
          wished={wished.includes(activeProduct.id)}
          onWish={() => toggleWish(activeProduct.id)}
          products={products}
        />
      )}

      {page === 'cms' && (isAdmin ? <CMSPage products={products} setProducts={setProducts} orders={orders} /> : <AccountPage navigate={navigate} addresses={addresses} setAddresses={setAddresses} orders={orders} isAdmin={isAdmin} setIsAdmin={setIsAdmin} userEmail={userEmail} setUserEmail={setUserEmail} />)}

      {page === 'new-arrivals' && (
        <NewArrivalsPage
          products={products}
          wished={wished}
          onWish={toggleWish}
          onAdd={p => addToCart(p, 'M')}
          onOpen={product => navigate(`/product/${product.id}`)}
        />
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div
          className="toast-pill-notification"
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 1000,
            background: 'var(--wine)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '50px',
            boxShadow: '0 10px 30px rgba(132, 41, 82, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13.5px',
            fontWeight: 600,
            animation: 'toastSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <CheckCircle2 size={19} color="#ffd1e3" />
          <span>{toast}</span>
        </div>
      )}

      <Footer navigate={navigate} isAdmin={isAdmin} />

      <CartDrawer open={cartOpen} cart={cart} setCart={setCart} close={() => setCartOpen(false)} navigate={navigate} />

      <SearchOverlay
        open={searchOpen}
        search={search}
        setSearch={setSearch}
        result={result}
        close={() => setSearchOpen(false)}
        navigate={navigate}
      />

      <aside className={menuOpen ? 'mobile-menu open' : 'mobile-menu'}>
        <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <X size={24} />
        </button>
        <button onClick={() => navigate('/shop')}>Shop All</button>
        <button onClick={() => navigate('/cart')}>Cart Bag</button>
        <button onClick={() => navigate('/account')}>Account & Saved Locations</button>
        <button onClick={() => navigate('/wishlist')}>Wishlist</button>
        {isAdmin && (
          <button onClick={() => navigate('/cms')} style={{ color: 'var(--wine)' }}>
            CMS Dashboard
          </button>
        )}
      </aside>

      <nav className="bottom-nav">
        <button onClick={() => navigate('/')}>
          <ShoppingBag size={18} />
          <span>Home</span>
        </button>
        <button onClick={() => navigate('/shop')}>
          <Sparkles size={18} />
          <span>Shop</span>
        </button>
        <button onClick={() => navigate('/cart')}>
          <ShoppingBag size={18} />
          <span>Cart ({cart.reduce((sum, i) => sum + i.qty, 0)})</span>
        </button>
        <button onClick={() => navigate('/account')}>
          <UserRound size={18} />
          <span>Account</span>
        </button>
      </nav>
    </>
  )
}
