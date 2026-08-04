import { Search, X, ArrowRight } from 'lucide-react'
import type { Product } from '../types'
import { money } from '../data/initialData'

export function SearchOverlay({
  open,
  search,
  setSearch,
  result,
  close,
  navigate
}: {
  open: boolean
  search: string
  setSearch: (value: string) => void
  result: Product[]
  close: () => void
  navigate: (path: string) => void
}) {
  return (
    <div className={open ? 'search-overlay open' : 'search-overlay'}>
      <button className="icon-button search-close" onClick={close} aria-label="Close search">
        <X />
      </button>
      <p className="eyebrow">SEARCH FEMIRO</p>
      <div className="search-field">
        <Search size={22} />
        <input
          autoFocus={open}
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search kurtis, co-ords, trousers..."
        />
      </div>
      {search && (
        <div className="search-results">
          {result.length ? (
            result.map(product => (
              <button
                key={product.id}
                onClick={() => {
                  close()
                  navigate(`/product/${product.id}`)
                }}
              >
                <img src={product.image} alt="" />
                <span>
                  <b>{product.name}</b>
                  <small>
                    {product.type} · {money(product.price)}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))
          ) : (
            <p>No pieces match “{search}”. Try kurti, co-ord, or trouser.</p>
          )}
        </div>
      )}
      {!search && <p className="suggestion">Popular: Kurti sets, occasion wear, trousers</p>}
    </div>
  )
}
