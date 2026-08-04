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
  status: 'Processing' | 'Shipped' | 'Delivered'
  deliveryAddress: string
}

export type CartItem = {
  product: Product
  size: string
  qty: number
}

export type Page = 'home' | 'shop' | 'account' | 'wishlist' | 'product' | 'cart' | 'cms' | 'new-arrivals'
