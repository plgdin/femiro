import { useEffect, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Product, HeroContent } from '../types'
import { ProductCard } from '../components/ProductCard'

import { getPersonalizedRecommendations } from '../services/recommendationService'

export function HomePage({
  navigate,
  products,
  wished,
  onWish,
  onAdd,
  onOpen,
  heroContent
}: {
  navigate: (path: string) => void
  products: Product[]
  wished: number[]
  onWish: (id: number) => void
  onAdd: (product: Product) => void
  onOpen: (product: Product) => void
  heroContent?: HeroContent
}) {
  const [recommended, setRecommended] = useState<Product[]>([])

  useEffect(() => {
    const recs = getPersonalizedRecommendations(products, [], wished, 4)
    setRecommended(recs)
  }, [products, wished])

  return (
    <main id="top">

      <section className="hero">
        <img
          src={heroContent?.imageUrl || 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2000&q=90'}
          alt="Woman wearing Femiro collection"
        />
        <div className="hero-shade" />
        <div className="hero-copy">
          <h1>{heroContent?.headline || 'Soft power, beautifully worn.'}</h1>
          {heroContent?.subtitle && (
            <p>
              {heroContent.subtitle}
            </p>
          )}
          <div>
            <button className="button light" onClick={() => navigate(heroContent?.buttonLink || '/shop')}>
              {heroContent?.buttonText || 'Shop the collection'} <ArrowRight size={16} />
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
