export function optimizeWebpUrl(url: string, defaultWidth = 800): string {
  if (!url) return url
  if (url.includes('images.unsplash.com')) {
    let result = url
    if (!result.includes('fm=')) {
      result += (result.includes('?') ? '&' : '?') + 'fm=webp'
    }
    if (!result.includes('q=')) {
      result += '&q=80'
    }
    if (!result.includes('w=')) {
      result += `&w=${defaultWidth}`
    }
    return result
  }
  return url
}
