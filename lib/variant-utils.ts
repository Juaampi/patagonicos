import type { Product, ProductColor, ProductImage, ProductVariant } from '@/types/store'

export const OUT_OF_STOCK_PLACEHOLDER_SIZE = '__OUT_OF_STOCK__'

const SIZE_PRIORITY = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

export type ProductGalleryItem =
  | { kind: 'image'; id: string; image: ProductImage }
  | { kind: 'video'; id: string; url: string }

function normalizeSizeLabel(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function compareProductSizes(left: string, right: string) {
  const normalizedLeft = normalizeSizeLabel(left)
  const normalizedRight = normalizeSizeLabel(right)

  const leftPriority = SIZE_PRIORITY.indexOf(normalizedLeft)
  const rightPriority = SIZE_PRIORITY.indexOf(normalizedRight)

  if (leftPriority >= 0 && rightPriority >= 0) {
    return leftPriority - rightPriority
  }

  if (leftPriority >= 0) {
    return -1
  }

  if (rightPriority >= 0) {
    return 1
  }

  const leftNumeric = Number(normalizedLeft)
  const rightNumeric = Number(normalizedRight)
  const leftIsNumeric = Number.isFinite(leftNumeric)
  const rightIsNumeric = Number.isFinite(rightNumeric)

  if (leftIsNumeric && rightIsNumeric) {
    return leftNumeric - rightNumeric
  }

  if (leftIsNumeric) {
    return -1
  }

  if (rightIsNumeric) {
    return 1
  }

  return normalizedLeft.localeCompare(normalizedRight, 'es')
}

export function getProductColors(product: Product): ProductColor[] {
  if (product.colors.length > 0) {
    return product.colors
  }

  const colorMap = new Map<string, ProductColor>()
  for (const variant of product.variants) {
    if (!colorMap.has(variant.colorName)) {
      colorMap.set(variant.colorName, {
        name: variant.colorName,
        hex: variant.colorHex,
      })
    }
  }

  return Array.from(colorMap.values())
}

export function getMainImage(product: Product): ProductImage | null {
  const explicitMain = product.images.find((image) => image.type === 'MAIN')
  if (explicitMain) {
    return explicitMain
  }

  if (product.mainImageUrl) {
    return {
      id: `${product.id}-main`,
      type: 'MAIN',
      url: product.mainImageUrl,
      alt: product.name,
      sortOrder: -1,
    }
  }

  const firstImage = product.images[0]
  return firstImage ?? null
}

export function getColorImages(product: Product, colorName: string): ProductImage[] {
  return product.images
    .filter((image) => image.type === 'COLOR' && image.colorName === colorName)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getInfoImages(product: Product): ProductImage[] {
  return product.images
    .filter((image) => image.type === 'INFO' || image.type === 'LIFESTYLE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getGalleryForColor(product: Product, colorName: string): ProductGalleryItem[] {
  const mainImage = getMainImage(product)
  const colorImages = getColorImages(product, colorName).filter((image) => image.url !== mainImage?.url)
  const infoImages = getInfoImages(product)
  const gallery: ProductGalleryItem[] = []

  if (mainImage) {
    gallery.push({ kind: 'image', id: mainImage.id ?? `main-${mainImage.url}`, image: mainImage })
  }

  if (colorImages.length > 0) {
    gallery.push(
      ...colorImages.map((image) => ({
        kind: 'image' as const,
        id: image.id ?? `${image.type}-${image.url}`,
        image,
      })),
    )
  }

  gallery.push(
    ...infoImages.map((image) => ({
      kind: 'image' as const,
      id: image.id ?? `${image.type}-${image.url}`,
      image,
    })),
  )

  if (product.videoUrl) {
    gallery.push({ kind: 'video', id: `video-${product.id}`, url: product.videoUrl })
  }

  return gallery
}

export function getVariantsByColor(product: Product, colorName: string): ProductVariant[] {
  return product.variants.filter((variant) => variant.colorName === colorName)
}

export function getAvailableSizes(product: Product, colorName: string) {
  const variants = getVariantsByColor(product, colorName).filter((variant) => variant.size !== OUT_OF_STOCK_PLACEHOLDER_SIZE)
  const sizeSet = new Set(variants.map((variant) => variant.size))
  return [...product.sizes]
    .filter((size) => sizeSet.has(size.label))
    .sort((left, right) => compareProductSizes(left.label, right.label))
}

export function getSizesForColor(product: Product, colorName: string) {
  return getVariantsByColor(product, colorName)
    .filter((variant) => variant.size !== OUT_OF_STOCK_PLACEHOLDER_SIZE)
    .map((variant) => ({
      label: variant.size,
      stock: variant.stock,
      inStock: variant.stock > 0,
    }))
    .sort((a, b) => compareProductSizes(a.label, b.label))
}

export function getVariantForSelection(product: Product, colorName: string, size: string) {
  if (!size) return undefined
  return product.variants.find((variant) => variant.colorName === colorName && variant.size === size)
}

export function getStockForColor(product: Product, colorName: string) {
  return getVariantsByColor(product, colorName).reduce((total, variant) => total + variant.stock, 0)
}

export function isColorOutOfStock(product: Product, colorName: string) {
  return getStockForColor(product, colorName) <= 0
}
