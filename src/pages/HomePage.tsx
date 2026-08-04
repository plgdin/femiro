import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Product } from '../types'
import { ProductCard } from '../components/ProductCard'

export function HomePage({
  navigate,
  products,
  wished,
  onWish,
  onAdd,
  onOpen
}: {
  navigate: (path: string) => void
  products: Product[]
  wished: number[]
  onWish: (id: number) => void
  onAdd: (product: Product) => void
  onOpen: (product: Product) => void
}) {
  const [recommended, setRecommended] = useState<Product[]>([])

  useEffect(() => {
    // 1. Get viewed products from localStorage
    let viewedIds: number[] = []
    try {
      viewedIds = JSON.parse(localStorage.getItem('femiro-viewed-products') || '[]')
    } catch (e) {}

    // 2. Get purchased products from orders
    let purchasedIds: number[] = []
    try {
      const orders = JSON.parse(localStorage.getItem('femiro-orders') || '[]')
      purchasedIds = orders.flatMap((ord: any) => ord.items?.map((item: any) => item.id) || [])
    } catch (e) {}

    // Combine all interaction IDs
    const interactedIds = Array.from(new Set([...viewedIds, ...purchasedIds]))

    // Find the products corresponding to interacted IDs
    const interactedProducts = products.filter(p => interactedIds.includes(p.id))

    // Count favorite product categories (types)
    const typeCounts: Record<string, number> = {}
    interactedProducts.forEach(p => {
      if (p.type) {
        typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
      }
    })

    // Find top favorite type
    let favoriteType = ''
    let maxCount = 0
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count
        favoriteType = type
      }
    })

    let picks: Product[] = []
    if (favoriteType) {
      // Prioritize items of favorite type
      const preferred = products.filter(p => p.type === favoriteType)
      const others = products.filter(p => p.type !== favoriteType)
      
      // Shuffle them slightly to make it look premium
      const shuffledPreferred = [...preferred].sort(() => 0.5 - Math.random())
      const shuffledOthers = [...others].sort(() => 0.5 - Math.random())
      
      picks = [...shuffledPreferred, ...shuffledOthers].slice(0, 4)
    }

    // Fallback: if no favorite type or not enough recommendations, pick random
    if (picks.length < 4) {
      const remaining = products.filter(p => !picks.find(x => x.id === p.id))
      const randomPicks = [...remaining].sort(() => 0.5 - Math.random()).slice(0, 4 - picks.length)
      picks = [...picks, ...randomPicks]
    }

    setRecommended(picks)
  }, [products])

  return (
    <main id="top">

      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2000&q=90"
          alt="Woman wearing Femiro collection"
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">MONSOON 2026</p>
          <h1>
            Soft power,
            <br />
            beautifully worn.
          </h1>
          <div>
            <button className="button light" onClick={() => navigate('/shop')}>
              Shop the collection <ArrowRight size={16} />
            </button>
            <button
              className="text-link"
              onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Discover our story
            </button>
          </div>
        </div>

        <button
          className="scroll-note"
          onClick={() => document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Scroll to discover <ChevronDown size={16} />
        </button>
      </section>

      <section className="intro" id="story">

        <h2>
          Pieces made for the
          <br />
          <em>life you are building.</em>
        </h2>
        <p className="intro-copy">
          A considered wardrobe for every version of you. Tailored in small batches, with thoughtful details that invite a second look.
        </p>

        {/* Curated Recommendations */}
        {recommended.length > 0 && (
          <div style={{ marginTop: '70px', textAlign: 'left' }}>
            <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '32px' }}>Curated Picks For You</p>
            <div className="product-grid">
              {recommended.map(product => (
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
          </div>
        )}
      </section>


      <section className="products" id="new">
        <div className="section-head">
          <div>
            <p className="eyebrow" style={{ marginBottom: '8px' }}>Just Arrived</p>
            <h2>New Arrivals</h2>
          </div>
          <button onClick={() => navigate('/shop')} className="under-link">
            View all arrivals <ArrowRight size={15} />
          </button>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map(product => (
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
      </section>

      <section className="campaign">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=85"
          alt="Femiro evening collection"
        />
        <div>
          <p className="eyebrow">EVENING / 26</p>
          <h2>
            After
            <br />
            <em>hours</em>
          </h2>
          <button className="button light" onClick={() => navigate('/shop')}>
            Explore salwar sets <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </main>
  )
}
