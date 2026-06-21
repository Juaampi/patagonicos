export type ProductColor = {
  name: string
  hex: string
}

export type ProductSize = {
  label: string
  chest: string
  length: string
}

export type ProductImage = {
  id?: string
  type: 'MAIN' | 'COLOR' | 'INFO' | 'LIFESTYLE'
  colorName?: string
  url: string
  alt: string
  sortOrder: number
}

export type ProductVariant = {
  id: string
  colorName: string
  colorHex: string
  size: string
  stock: number
  sku: string
}

export type ProductReview = {
  id: string
  authorName: string
  authorLocation?: string
  rating: number
  title?: string
  comment: string
  imageUrl?: string
  imageAlt?: string
  createdAt: string
}

export type Product = {
  id: string
  slug: string
  name: string
  animalType: 'DOG' | 'CAT'
  salesCount?: number
  category: string
  price: number
  compareAtPrice?: number
  mainImageUrl?: string
  videoUrl?: string
  shortDescription: string
  description: string
  useTags: string[]
  featureTags: string[]
  materials: string[]
  careInstructions: string[]
  freeShippingUpsell?: boolean
  colors: ProductColor[]
  sizes: ProductSize[]
  variants: ProductVariant[]
  images: ProductImage[]
  reviews: ProductReview[]
}

export type SalesChannel = 'RETAIL' | 'WHOLESALE'

export type OrderSummary = {
  id: string
  status: string
  createdAt: string
  total: number
  items: Array<{ name: string; quantity: number; color: string; size: string }>
  shipping: string
}

export type CartItem = {
  id: string
  productId: string
  slug: string
  name: string
  category: string
  price: number
  salesChannel?: SalesChannel
  compareAtPrice?: number
  imageUrl?: string
  imageAlt?: string
  colorName: string
  colorHex: string
  size: string
  sku: string
  quantity: number
  maxStock: number
}

export type AdoptionPetImage = {
  id: string
  url: string
  alt: string
  sortOrder: number
}

export type AdoptionPet = {
  id: string
  name: string
  animalType: 'DOG' | 'CAT'
  ageLabel: string
  city: string
  province: string
  contactPhone?: string
  status: 'EN_ADOPCION' | 'ADOPTADO' | 'EN_TRANSITO'
  summary?: string
  images: AdoptionPetImage[]
}
