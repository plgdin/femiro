export type Product = {
  id: number
  name: string
  type: string
  price: number
  oldPrice?: number
  image: string
  hover: string
  tag?: string
  description: string
  colors?: string[]
  sizes?: string[]
  hasColors?: boolean
  inStock?: boolean
}

export type Address = {
  id: string
  name: string
  mobile: string
  street: string
  city: string
  state: string
  pincode: string
  landmark?: string
  tag: 'Home' | 'Office' | 'Other'
  isDefault: boolean
}

export type Order = {
  id: string
  date: string
  items: { id: number; name: string; price: number; image: string; qty: number; size: string }[]
  total: number
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Payment Pending'
  deliveryAddress: string
  customerEmail?: string
  customerPhone?: string
  shippingId?: string
  notes?: string
}

export type CartItem = {
  product: Product
  size: string
  qty: number
}

export type Page = 'home' | 'shop' | 'account' | 'wishlist' | 'product' | 'cart' | 'cms' | 'new-arrivals' | 'terms' | 'refund' | 'privacy'

export type HeroContent = {
  eyebrow: string
  headline: string
  subtitle: string
  imageUrl: string
  buttonText: string
  buttonLink: string
  announcementText?: string
}

export type DiscountCode = {
  id: string
  code: string
  discountPercent: number
  fixedAmount?: number
  type: 'percent' | 'fixed'
  minSpend: number
  scope: 'storewide' | 'category' | 'products'
  categoryTarget?: string
  productIds?: number[]
  active: boolean
}
