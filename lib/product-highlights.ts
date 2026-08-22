import type { Product } from '@/types/store'

export const PROMO_FREE_SHIPPING_THRESHOLD = 120000

export function isDogfaceProduct(product: Pick<Product, 'name' | 'slug'>) {
  return /dogface/i.test(product.name) || /dogface/i.test(product.slug)
}

export function qualifiesForFreeShippingBadge(product: Pick<Product, 'price'>) {
  return product.price >= PROMO_FREE_SHIPPING_THRESHOLD
}

export function isBestSellerHighlight(product: Pick<Product, 'name' | 'slug' | 'salesCount'>) {
  return isDogfaceProduct(product) || (product.salesCount ?? 0) > 0
}
