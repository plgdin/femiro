import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { House, Store, ShoppingCart, UserRound, CheckCircle2, X, Heart, ShieldCheck, Layers, ChevronRight } from 'lucide-react'
import type { Product, Address, Order, CartItem, Page, HeroContent, DiscountCode } from './types'
import { stored } from './data/initialData'

import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { CartDrawer } from './components/CartDrawer'
import { SearchOverlay } from './components/SearchOverlay'
import { Logo } from './components/Logo'

import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { WishlistPage } from './pages/WishlistPage'
import { NewArrivalsPage } from './pages/NewArrivalsPage'
import { supabase } from './lib/supabase'
import { loadAddresses, loadCategories, loadDiscounts, loadHero, loadOrders, loadProducts, saveHero, syncCategories, syncDiscounts } from './services/storeService'

const CMSPage = lazy(() => import('./pages/CMSPage').then(m => ({ default: m.CMSPage })))
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))

const DEFAULT_HERO: HeroContent = {
  eyebrow: 'MONSOON 2026',
  headline: 'Soft power, beautifully worn.',
  subtitle: 'Discover handcrafted drapes, co-ords, and festive couture designed for modern grace.',
  imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&fm=webp&q=80',
  buttonText: 'Shop the collection',
  buttonLink: '/shop'
}

const DEFAULT_DISCOUNTS: DiscountCode[] = []

const pathPage = (): Page => {
  const path = window.location.pathname
  if (path.startsWith('/shop')) return 'shop'
  if (path.startsWith('/account')) return 'account'
  if (path.startsWith('/wishlist')) return 'wishlist'
  if (path.startsWith('/product')) return 'product'
  if (path.startsWith('/cart')) return 'cart'
  if (path.startsWith('/cms')) return 'cms'
  if (path.startsWith('/new-arrivals')) return 'new-arrivals'
  if (path.startsWith('/terms')) return 'terms'
  if (path.startsWith('/refund')) return 'refund'
  if (path.startsWith('/privacy')) return 'privacy'
  return 'home'
}

const getCategoryFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('category') || 'All'
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('femiro-cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [wished, setWished] = useState<number[]>([])

  // Admin and Auth State
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'employee' | 'user'>('user')
  const [categories, setCategories] = useState<string[]>([])
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO)
  const [discounts, setDiscounts] = useState<DiscountCode[]>(DEFAULT_DISCOUNTS)
  const [userId, setUserId] = useState<string | null>(null)
  const [storeLoaded, setStoreLoaded] = useState(false)

  // Persist cart to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem('femiro-cart', JSON.stringify(cart)) } catch {}
  }, [cart])

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
    let active = true

    const applySession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!active) return
      const user = session?.user
      setUserId(user?.id || null)
      let role = user?.app_metadata?.role === 'admin' || user?.app_metadata?.role === 'employee'
        ? user.app_metadata.role
        : 'user'
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (profile?.role === 'admin' || profile?.role === 'employee') role = profile.role
      }
      if (!active) return
      setUserEmail(user?.email || null)
      setUserRole(role)
      setIsAdmin(role !== 'user')
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))

    const onPop = () => {
      setPage(pathPage())
      setCurrentCategory(getCategoryFromUrl())
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('popstate', onPop)
    window.addEventListener('scroll', onScroll)
    return () => {
      active = false
      authListener.subscription.unsubscribe()
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    let title = 'Femiro Designs | Elegant womenswear'
    if (page === 'shop') title = 'Shop Collection | Femiro Designs'
    else if (page === 'account') title = 'Account | Femiro Designs'
    else if (page === 'wishlist') title = 'Saved Items | Femiro Designs'
    else if (page === 'cart') title = 'Shopping Bag | Femiro Designs'
    else if (page === 'cms') title = 'Store Management CMS | Femiro Designs'
    else if (page === 'new-arrivals') title = 'New Arrivals | Femiro Designs'
    else if (page === 'terms') title = 'Terms of Service | Femiro Designs'
    else if (page === 'refund') title = 'Refund & Return Policy | Femiro Designs'
    else if (page === 'privacy') title = 'Privacy Policy | Femiro Designs'
    else if (page === 'product' && selected) title = `${selected.name} | Femiro Designs`
    document.title = title
  }, [page, selected])

  useEffect(() => {
    let active = true
    const loadStore = async () => {
      try {
        const results = await Promise.allSettled([
          loadProducts(),
          loadCategories(),
          loadHero(),
          loadDiscounts()
        ])
        if (!active) return
        const nextProducts = results[0].status === 'fulfilled' ? results[0].value : []
        const nextCategories = results[1].status === 'fulfilled' ? results[1].value : []
        const nextHero = results[2].status === 'fulfilled' ? results[2].value : null
        const nextDiscounts = results[3].status === 'fulfilled' ? results[3].value : []
        results.forEach(result => {
          if (result.status === 'rejected') console.error('Store resource load failed', result.reason)
        })
        setProducts(nextProducts)
        setCategories(nextCategories)
        if (nextHero) setHeroContent(nextHero)
        setDiscounts(nextDiscounts)

        // Filter out stale cart items that no longer exist in the database
        if (nextProducts.length > 0) {
          setCart(currentCart => {
            const validIds = new Set(nextProducts.map(p => p.id))
            const filtered = currentCart.filter(item => validIds.has(item.product.id))
            return filtered.length !== currentCart.length ? filtered : currentCart
          })
        }
        setStoreLoaded(true)

        if (userId) {
          const staff = userRole === 'admin' || userRole === 'employee'
          const [nextAddresses, nextOrders] = await Promise.all([
            loadAddresses(userId),
            loadOrders(userId, staff)
          ])
          if (!active) return
          setAddresses(nextAddresses)
          setOrders(nextOrders)
        } else {
          setAddresses([])
          setOrders([])
        }
      } catch (error) {
        console.error('Store data load failed', error)
      }
    }
    void loadStore()
    return () => { active = false }
  }, [userId, userRole])

  useEffect(() => {
    if (!storeLoaded || userRole !== 'admin') return
    void syncCategories(categories).catch(error => console.error('Category sync failed', error))
  }, [categories, storeLoaded, userRole])

  useEffect(() => {
    if (!storeLoaded || userRole !== 'admin') return
    void saveHero(heroContent).catch(error => console.error('Hero sync failed', error))
  }, [heroContent, storeLoaded, userRole])

  useEffect(() => {
    if (!storeLoaded || userRole !== 'admin') return
    void syncDiscounts(discounts).catch(error => console.error('Discount sync failed', error))
  }, [discounts, storeLoaded, userRole])

  useEffect(() => {
    const metadata: Record<Page, { title: string; description: string }> = {
      home: { title: 'Femiro Designs | Elegant womenswear', description: 'Small-batch kurtis, co-ords, salwar sets, and occasionwear for modern women.' },
      shop: { title: 'Shop All | Femiro Designs', description: 'Explore Femiro small-batch womenswear and occasion pieces.' },
      account: { title: 'Account | Femiro Designs', description: 'Manage your Femiro account, addresses, and orders.' },
      wishlist: { title: 'Wishlist | Femiro Designs', description: 'Your saved Femiro pieces.' },
      product: { title: 'Product | Femiro Designs', description: 'Discover details for this Femiro piece.' },
      cart: { title: 'Shopping Bag | Femiro Designs', description: 'Review your Femiro shopping bag and checkout.' },
      cms: { title: 'Store Management | Femiro', description: 'Femiro store management.' },
      'new-arrivals': { title: 'New Arrivals | Femiro Designs', description: 'Shop the newest Femiro designs.' },
      terms: { title: 'Terms of Service | Femiro Designs', description: 'Terms for using the Femiro Designs website.' },
      refund: { title: 'Refund Policy | Femiro Designs', description: 'Femiro returns and refund policy.' },
      privacy: { title: 'Privacy Policy | Femiro Designs', description: 'How Femiro handles customer information.' }
    }
    const current = metadata[page]
    document.title = current.title
    let description = document.querySelector('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.setAttribute('name', 'description')
      document.head.appendChild(description)
    }
    description.setAttribute('content', current.description)
  }, [page])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    const target = pathPage()

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

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
  }

  const addToCart = (product: Product, size = 'M') => {
    if (!userEmail) {
      setToast('Please sign in to add items to your cart')
      setTimeout(() => setToast(null), 3000)
      navigate('/account')
      return
    }

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

  const handlePlaceOrder = async (_deliveryAddress: string, _total: number) => {
    setCart([])
    if (userId) {
      try {
        setOrders(await loadOrders(userId, userRole === 'admin' || userRole === 'employee'))
      } catch (error) {
        console.error('Order refresh failed', error)
      }
    }
    setToast('🎉 Order placed successfully! View in Account.')
    setTimeout(() => setToast(null), 4000)
    navigate('/account')
  }

  const refreshOrders = async () => {
    if (!userId) return
    setOrders(await loadOrders(userId, userRole === 'admin' || userRole === 'employee'))
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
          userRole={userRole}
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
          heroContent={heroContent}
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
          categories={categories}
          initialCategory={currentCategory}
          onCategoryChange={cat => navigate(cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`)}
        />
      )}

      {page === 'account' && (
        <Suspense fallback={<div className="page-shell" style={{ padding: '60px 20px', textAlign: 'center' }}>Loading account...</div>}>
          <AccountPage
            navigate={navigate}
            addresses={addresses}
            setAddresses={setAddresses}
            orders={orders}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            userId={userId}
            userRole={userRole}
            setUserRole={setUserRole}
          />
        </Suspense>
      )}

      {page === 'cart' && (
        <CartPage
          cart={cart}
          setCart={setCart}
          addresses={userEmail ? addresses : []}
          discounts={discounts}
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

      {page === 'cms' &&
        (isAdmin ? (
          <Suspense fallback={<div className="page-shell" style={{ padding: '60px 20px', textAlign: 'center' }}>Loading CMS...</div>}>
            <CMSPage
              products={products}
              setProducts={setProducts}
              orders={orders}
              categories={categories}
              setCategories={setCategories}
              heroContent={heroContent}
              setHeroContent={setHeroContent}
              discounts={discounts}
              setDiscounts={setDiscounts}
              userId={userId}
              refreshOrders={refreshOrders}
              userRole={userRole}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<div className="page-shell" style={{ padding: '60px 20px', textAlign: 'center' }}>Loading...</div>}>
            <AccountPage
              navigate={navigate}
              addresses={addresses}
              setAddresses={setAddresses}
              orders={orders}
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              userId={userId}
              userRole={userRole}
              setUserRole={setUserRole}
            />
          </Suspense>
        ))}

      {page === 'new-arrivals' && (
        <NewArrivalsPage
          products={products}
          wished={wished}
          onWish={toggleWish}
          onAdd={p => addToCart(p, 'M')}
          onOpen={product => navigate(`/product/${product.id}`)}
        />
      )}

      {page === 'terms' && (
        <Suspense fallback={null}>
          <LegalPage kind="terms" />
        </Suspense>
      )}
      {page === 'refund' && (
        <Suspense fallback={null}>
          <LegalPage kind="refund" />
        </Suspense>
      )}
      {page === 'privacy' && (
        <Suspense fallback={null}>
          <LegalPage kind="privacy" />
        </Suspense>
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


      <nav className="bottom-nav">
        <button onClick={() => navigate('/')}>
          <House size={18} strokeWidth={1.8} />
          <span>Home</span>
        </button>
        <button onClick={() => navigate('/shop')}>
          <Store size={18} strokeWidth={1.8} />
          <span>Shop</span>
        </button>
        <button onClick={() => navigate('/cart')}>
          <span className="bottom-cart-icon">
            <ShoppingCart size={18} strokeWidth={1.8} />
            {cart.reduce((sum, i) => sum + i.qty, 0) > 0 && (
              <b className="bottom-cart-count">{cart.reduce((sum, i) => sum + i.qty, 0)}</b>
            )}
          </span>
          <span>Cart</span>
        </button>
        <button onClick={() => navigate('/account')}>
          <UserRound size={18} />
          <span>Account</span>
        </button>
      </nav>
    </>
  )
}
