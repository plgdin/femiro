import { Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '../types'
import { money } from '../data/initialData'

export function ProductCard({
  product,
  wished,
  onWish,
  onAdd,
  onOpen
}: {
  product: Product
  wished: boolean
  onWish: () => void
  onAdd: () => void
  onOpen: () => void
}) {
  return (
    <article className="product" onClick={onOpen}>
      <div className="product-image">
        <img
          className="first"
          src={product.image}
          alt={product.name}
          onError={e => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85'
          }}
        />
        <img
          className="second"
          src={product.hover || product.image}
          alt=""
          onError={e => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=85'
          }}
        />
        <div className="product-top">
          {product.tag && <span>{product.tag}</span>}
          <button
            onClick={event => {
              event.stopPropagation()
              onWish()
            }}
            aria-label={`Save ${product.name}`}
          >
            <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
          </button>
        </div>
        <button
          className="quick-add"
          onClick={event => {
            event.stopPropagation()
            onAdd()
          }}
        >
          Quick add <ShoppingBag size={16} />
        </button>
      </div>
      <div className="product-details">
        <p>{product.type}</p>
        <div>
          <h3>{product.name}</h3>
          <span>
            {money(product.price)} {product.oldPrice && <del>{money(product.oldPrice)}</del>}
          </span>
        </div>
        {product.hasColors && product.colors && product.colors.length > 0 && (
          <div className="swatches">
            {product.colors.map(color => (
              <i style={{ background: color }} key={color} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
