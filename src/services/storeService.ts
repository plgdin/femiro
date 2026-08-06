import type { Address, DiscountCode, HeroContent, Order, Product } from '../types'
import { supabase } from '../lib/supabase'

const toProduct = (row: any): Product => ({
  id: Number(row.id),
  name: row.name,
  type: row.type,
  price: Number(row.price),
  oldPrice: row.old_price == null ? undefined : Number(row.old_price),
  image: row.image,
  hover: row.hover,
  tag: row.tag || undefined,
  description: row.description,
  colors: row.colors || [],
  sizes: row.sizes || [],
  hasColors: Boolean(row.has_colors),
  inStock: row.in_stock !== false
})

const toAddress = (row: any): Address => ({
  id: row.id,
  name: row.name,
  mobile: row.mobile,
  street: row.street,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
  landmark: row.landmark || undefined,
  tag: row.tag,
  isDefault: Boolean(row.is_default)
})

const toDiscount = (row: any): DiscountCode => ({
  id: row.id,
  code: row.code,
  discountPercent: Number(row.discount_percent || 0),
  fixedAmount: row.fixed_amount == null ? undefined : Number(row.fixed_amount),
  type: row.type,
  minSpend: Number(row.min_spend || 0),
  scope: row.scope,
  categoryTarget: row.category_target || undefined,
  productIds: row.product_ids || [],
  active: Boolean(row.active)
})

export async function loadProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toProduct)
}

export async function loadCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('categories').select('name').order('name')
  if (error) throw error
  return (data || []).map(row => row.name)
}

export async function loadHero(): Promise<HeroContent | null> {
  const { data, error } = await supabase.from('hero_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    eyebrow: data.eyebrow,
    headline: data.headline,
    subtitle: data.subtitle,
    imageUrl: data.image_url,
    buttonText: data.button_text,
    buttonLink: data.button_link
  }
}

export async function loadDiscounts(): Promise<DiscountCode[]> {
  const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toDiscount)
}

export async function loadAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('is_default', { ascending: false })
  if (error) throw error
  return (data || []).map(toAddress)
}

export async function loadOrders(userId: string, staff: boolean): Promise<Order[]> {
  const query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  const { data, error } = staff ? await query : await query.eq('user_id', userId)
  if (error) throw error
  return (data || []).map(row => ({
    id: row.id,
    date: new Date(row.created_at).toISOString().split('T')[0],
    items: row.items,
    total: Number(row.total),
    status: row.status,
    deliveryAddress: row.delivery_address,
    customerEmail: row.customer_email || undefined,
    customerPhone: row.customer_phone || undefined,
    shippingId: row.shipping_id || undefined,
    notes: row.notes || undefined
  }))
}

export async function updateOrder(
  orderId: string,
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Payment Pending',
  shippingId?: string,
  notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      shipping_id: shippingId || null,
      notes: notes || null
    })
    .eq('id', orderId)

  if (error) throw error
}

export async function saveProduct(product: Product) {
  const { error } = await supabase.from('products').upsert({
    id: product.id,
    name: product.name,
    type: product.type,
    price: product.price,
    old_price: product.oldPrice ?? null,
    image: product.image,
    hover: product.hover,
    tag: product.tag ?? null,
    description: product.description,
    colors: product.colors || [],
    sizes: product.sizes || [],
    has_colors: Boolean(product.hasColors),
    in_stock: product.inStock !== false,
    updated_at: new Date().toISOString()
  })
  if (error) throw error
}

export async function deleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function syncProducts(products: Product[]) {
  for (const product of products) await saveProduct(product)
}

export async function syncCategories(categories: string[]) {
  const { data: existing, error: readError } = await supabase.from('categories').select('name')
  if (readError) throw readError
  const wanted = new Set(categories)
  for (const row of existing || []) {
    if (!wanted.has(row.name)) await deleteCategory(row.name)
  }
  for (const name of categories) await saveCategory(name)
}

export async function saveCategory(name: string) {
  const { error } = await supabase.from('categories').upsert({ name })
  if (error) throw error
}

export async function deleteCategory(name: string) {
  const { error } = await supabase.from('categories').delete().eq('name', name)
  if (error) throw error
}

export async function saveHero(hero: HeroContent) {
  // Try to get existing row first
  const { data: existing } = await supabase.from('hero_settings').select('id').limit(1).maybeSingle()
  const row: any = {
    eyebrow: hero.eyebrow,
    headline: hero.headline,
    subtitle: hero.subtitle,
    image_url: hero.imageUrl,
    button_text: hero.buttonText,
    button_link: hero.buttonLink,
    updated_at: new Date().toISOString()
  }
  if (existing) {
    const { error } = await supabase.from('hero_settings').update(row).eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('hero_settings').insert(row)
    if (error) throw error
  }
}

export async function saveDiscount(discount: DiscountCode) {
  const { error } = await supabase.from('discounts').upsert({
    id: discount.id,
    code: discount.code,
    discount_percent: discount.discountPercent,
    fixed_amount: discount.fixedAmount ?? null,
    type: discount.type,
    min_spend: discount.minSpend,
    scope: discount.scope,
    category_target: discount.categoryTarget ?? null,
    product_ids: discount.productIds || [],
    active: discount.active
  })
  if (error) throw error
}

export async function deleteDiscount(id: string) {
  const { error } = await supabase.from('discounts').delete().eq('id', id)
  if (error) throw error
}

export async function syncDiscounts(discounts: DiscountCode[]) {
  const { data: existing, error: readError } = await supabase.from('discounts').select('id')
  if (readError) throw readError
  const wanted = new Set(discounts.map(discount => discount.id))
  for (const row of existing || []) {
    if (!wanted.has(row.id)) await deleteDiscount(row.id)
  }
  for (const discount of discounts) await saveDiscount(discount)
}

export async function saveAddress(userId: string, address: Address) {
  const payload: any = {
    user_id: userId,
    name: address.name,
    mobile: address.mobile,
    street: address.street,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    landmark: address.landmark || null,
    tag: address.tag,
    is_default: address.isDefault
  }
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(address.id)
  if (isUuid) {
    payload.id = address.id
  }
  const { data, error } = await supabase.from('addresses').upsert(payload).select('id').maybeSingle()
  if (error) throw error
  if (data?.id) {
    address.id = data.id
  }
  return address
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id)
  if (error) throw error
}

export async function uploadProductImage(file: File, userId: string) {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
