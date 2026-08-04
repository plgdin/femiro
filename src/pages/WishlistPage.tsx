import { Heart } from 'lucide-react'
import type { Product } from '../types'
import { ProductCard } from '../components/ProductCard'

export function WishlistPage({
  navigate,
  products,
  wished,
  onWish,
  onAdd
}: {
  navigate: (path: string) => void
  products: Product[]
  wished: number[]
  onWish: (id: number) => void
  onAdd: (product: Product) => void
}) {
  const items = products.filter(product => wished.includes(product.id))
  return (
    <main className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">SAVED FOR LATER</p>
        <h1>Your wishlist</h1>
        <p>{items.length ? 'The pieces you are thinking about.' : 'Save pieces you love and find them here.'}</p>
      </div>
      {items.length ? (
        <div className="product-grid">
          {items.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              wished
              onWish={() => onWish(product.id)}
              onAdd={() => onAdd(product)}
              onOpen={() => navigate(`/product/${product.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-page">
          <Heart size={32} color="var(--wine)" />
          <p style={{ font: "500 24px 'Playfair Display', serif" }}>Your wishlist is empty.</p>
          <button className="button dark" style={{ width: 'auto' }} onClick={() => navigate('/shop')}>
            Browse the collection
          </button>
        </div>
      )}
    </main>
  )
}
