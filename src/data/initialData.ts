import type { Product, Address, Order } from '../types'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Amara Draped Kurti',
    type: 'Kurtis',
    price: 2490,
    oldPrice: 2990,
    tag: 'NEW',
    description: 'A fluid drape with a softly structured shoulder, made for slow mornings and late dinners.',
    image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85',
    hover: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=85',
    colors: ['#842952', '#e6b4bb', '#2c2c2c'],
    hasColors: false,
    inStock: true
  },
  {
    id: 2,
    name: 'Sia Linen Co-Ord',
    type: 'Co-Ord Sets',
    price: 3890,
    tag: 'POPULAR',
    description: 'A breathable linen set with an easy, elegant line through the body.',
    image: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=900&q=85',
    hover: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85',
    colors: ['#ece2d6', '#2c2c2c'],
    hasColors: false,
    inStock: true
  },
  {
    id: 3,
    name: 'Noor Embroidered Set',
    type: 'Salwar Sets',
    price: 4590,
    tag: 'BESTSELLER',
    description: 'Hand-finished details and a graceful silhouette for occasions worth keeping.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85',
    hover: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?auto=format&fit=crop&w=900&q=85',
    colors: ['#f2d8d6', '#8d284c'],
    hasColors: true,
    inStock: true
  },
  {
    id: 4,
    name: 'Leona Wide Leg Trouser',
    type: 'Trousers',
    price: 2190,
    description: 'A considered wide leg with a clean waist and a little room to move.',
    image: 'https://images.unsplash.com/photo-1506629905607-d9c297d33b0d?auto=format&fit=crop&w=900&q=85',
    hover: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=85',
    colors: ['#d4c1ad', '#191919'],
    hasColors: false,
    inStock: true
  }
]

export const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    name: 'Aisha Sharma',
    mobile: '+91 98765 43210',
    street: 'Flat 402, Lotus Heights, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    landmark: 'Near Turner Road',
    tag: 'Home',
    isDefault: true
  },
  {
    id: 'addr-2',
    name: 'Aisha Sharma',
    mobile: '+91 98765 43210',
    street: 'Studio 12, Design District, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400013',
    tag: 'Office',
    isDefault: false
  }
]

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-9421',
    date: '2026-08-01',
    items: [
      {
        id: 1,
        name: 'Amara Draped Kurti',
        price: 2490,
        image: 'https://images.unsplash.com/photo-1605763240000-7e93b172d754?auto=format&fit=crop&w=900&q=85',
        qty: 1,
        size: 'M'
      }
    ],
    total: 2490,
    status: 'Delivered',
    deliveryAddress: 'Flat 402, Lotus Heights, Bandra West, Mumbai 400050'
  }
]

export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export const stored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}
