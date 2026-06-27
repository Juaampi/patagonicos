import type { Product } from '@/types/store'

const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/'
const PRODUCT_IMAGE_TRANSFORMATION = 'f_auto,q_auto:good,c_limit,w_1600'

export function optimizeCloudinaryImageUrl(url?: string | null, transformation = PRODUCT_IMAGE_TRANSFORMATION) {
  const normalized = url?.trim() ?? ''
  if (!normalized || !normalized.includes('res.cloudinary.com') || !normalized.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return normalized
  }

  const [baseUrl, query = ''] = normalized.split('?')
  const marker = `${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/`

  if (baseUrl.includes(marker)) {
    return normalized
  }

  const optimizedBaseUrl = baseUrl.replace(CLOUDINARY_UPLOAD_SEGMENT, `${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/`)
  return query ? `${optimizedBaseUrl}?${query}` : optimizedBaseUrl
}

export function optimizeStoreProductImages(product: Product): Product {
  return {
    ...product,
    mainImageUrl: optimizeCloudinaryImageUrl(product.mainImageUrl) || product.mainImageUrl,
    images: product.images.map((image) => ({
      ...image,
      url: optimizeCloudinaryImageUrl(image.url) || image.url,
    })),
    reviews: product.reviews.map((review) => ({
      ...review,
      imageUrl: optimizeCloudinaryImageUrl(review.imageUrl) || review.imageUrl,
    })),
  }
}

export function optimizeStoreProductsImages(products: Product[]) {
  return products.map(optimizeStoreProductImages)
}
