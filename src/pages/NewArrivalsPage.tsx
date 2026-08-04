import { Heart } from 'lucide-react'
import type { Product } from '../types'

export function NewArrivalsPage({
  products,
  wished,
  onWish,
  onAdd,
  onOpen
}: {
  products: Product[]
  wished: number[]
  onWish: (id: number) => void
  onAdd: (p: Product) => void
  onOpen: (p: Product) => void
}) {
  // Show the 8 most recent products (highest ID = newest)
  const newArrivals = [...products]
    .sort((a, b) => b.id - a.id)
    .slice(0, 8)

  return (
    <main className="new-arrivals-page">
      <section className="new-arrivals-hero">
        <h1>New Arrivals</h1>
        <p>Discover the latest additions to our collection</p>
      </section>

      <section className="new-arrivals-grid-section">
        <div className="product-grid">
          {newArrivals.map(p => (
            <article key={p.id} className="product-card" onClick={() => onOpen(p)}>
              <div className="card-image-wrap">
                <img src={p.image} alt={p.name} loading="lazy" />
                <button
                  className={`wish-btn ${wished.includes(p.id) ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); onWish(p.id) }}
                  aria-label="Toggle wishlist"
                >
                  <Heart size={18} />
                </button>
              </div>
              <div className="card-info">
                <p className="card-name">{p.name}</p>
                <p className="card-price">
                  ₹{p.price.toLocaleString()}
                </p>
              </div>
              <button
                className="button dark product-add-btn"
                onClick={e => { e.stopPropagation(); onAdd(p) }}
              >
                Add to Bag
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
