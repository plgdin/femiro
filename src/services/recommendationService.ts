import type { Product, CartItem, Order } from '../types'

// 1. Track Search Queries
export function trackSearch(query: string) {
  if (!query || query.trim().length < 2) return
  try {
    const searches: string[] = JSON.parse(localStorage.getItem('femiro-user-searches') || '[]')
    const updated = [query.trim().toLowerCase(), ...searches.filter(s => s !== query.trim().toLowerCase())].slice(0, 10)
    localStorage.setItem('femiro-user-searches', JSON.stringify(updated))
  } catch (e) {}
}

// 2. Track Product Views
export function trackProductView(productId: number) {
  try {
    const views: number[] = JSON.parse(localStorage.getItem('femiro-viewed-products') || '[]')
    const updated = [productId, ...views.filter(id => id !== productId)].slice(0, 20)
    localStorage.setItem('femiro-viewed-products', JSON.stringify(updated))
  } catch (e) {}
}

// 3. Compute Multi-Signal Personalized Product Recommendations
export function getPersonalizedRecommendations(
  allProducts: Product[],
  cart: CartItem[] = [],
  wishedIds: number[] = [],
  limit = 4
): Product[] {
  if (allProducts.length === 0) return []

  // Gather behavioral signals
  let viewedIds: number[] = []
  let searchQueries: string[] = []
  let orderIds: number[] = []

  try {
    viewedIds = JSON.parse(localStorage.getItem('femiro-viewed-products') || '[]')
  } catch (e) {}

  try {
    searchQueries = JSON.parse(localStorage.getItem('femiro-user-searches') || '[]')
  } catch (e) {}

  try {
    const orders: Order[] = JSON.parse(localStorage.getItem('femiro-orders') || '[]')
    orderIds = orders.flatMap(o => o.items?.map((i: any) => i.id) || [])
  } catch (e) {}

  const cartIds = cart.map(c => c.product?.id || (c as any).id)

  // Score each category & product based on weighted user signals
  const categoryScores: Record<string, number> = {}
  const productScores: Record<number, number> = {}

  allProducts.forEach(p => {
    let score = 0

    // Purchases: Weight 6
    if (orderIds.includes(p.id)) {
      score += 6
      categoryScores[p.type] = (categoryScores[p.type] || 0) + 6
    }

    // Cart Additions: Weight 5
    if (cartIds.includes(p.id)) {
      score += 5
      categoryScores[p.type] = (categoryScores[p.type] || 0) + 5
    }

    // Wishlist: Weight 4
    if (wishedIds.includes(p.id)) {
      score += 4
      categoryScores[p.type] = (categoryScores[p.type] || 0) + 4
    }

    // Product Views: Weight 3
    if (viewedIds.includes(p.id)) {
      score += 3
      categoryScores[p.type] = (categoryScores[p.type] || 0) + 3
    }

    // Search Query Matches: Weight 3
    searchQueries.forEach(q => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      ) {
        score += 3
        categoryScores[p.type] = (categoryScores[p.type] || 0) + 3
      }
    })

    productScores[p.id] = score
  })

  // Add category boost to products in high-scoring categories
  const scoredProducts = allProducts.map(p => {
    const categoryBoost = categoryScores[p.type] || 0
    const totalScore = (productScores[p.id] || 0) + categoryBoost * 0.5
    return { product: p, score: totalScore }
  })

  // Sort products by score descending
  scoredProducts.sort((a, b) => b.score - a.score)

  const topPicks = scoredProducts
    .filter(item => item.score > 0)
    .map(item => item.product)

  if (topPicks.length >= limit) {
    return topPicks.slice(0, limit)
  }

  // Fallback: fill remaining slots with popular/new products
  const remaining = allProducts.filter(p => !topPicks.find(x => x.id === p.id))
  return [...topPicks, ...remaining].slice(0, limit)
}
