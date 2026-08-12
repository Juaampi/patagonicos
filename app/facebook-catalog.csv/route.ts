import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { getCatalogProducts } from '@/lib/server/catalog'
import { getColorImages, getInfoImages, getMainImage, OUT_OF_STOCK_PLACEHOLDER_SIZE } from '@/lib/variant-utils'
import type { Product, ProductVariant } from '@/types/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FEED_HEADERS = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'google_product_category',
  'product_type',
  'item_group_id',
  'color',
  'size',
]

function escapeCsv(value: string | number | null | undefined) {
  const normalized = String(value ?? '')
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

function toPlainText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function formatFeedPrice(value: number) {
  return `${value.toFixed(2)} ARS`
}

function dedupeUrls(urls: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      urls
        .map((url) => url?.trim())
        .filter((url): url is string => Boolean(url)),
    ),
  )
}

function buildVariantTitle(product: Product, variant?: ProductVariant | null) {
  if (!variant) {
    return product.name
  }

  const parts = [product.name]

  if (variant.colorName.trim()) {
    parts.push(variant.colorName.trim())
  }

  if (variant.size.trim() && variant.size !== OUT_OF_STOCK_PLACEHOLDER_SIZE) {
    parts.push(variant.size.trim())
  }

  return parts.join(' - ')
}

function buildVariantLink(product: Product, variant?: ProductVariant | null) {
  return new URL(`/productos/${product.slug}`, env.SITE_URL).toString()
}

function getVariantImageSet(product: Product, variant?: ProductVariant | null) {
  const mainImage = getMainImage(product)
  const infoImages = getInfoImages(product)

  if (!variant) {
    const productImages = dedupeUrls([
      mainImage?.url,
      ...infoImages.map((image) => image.url),
    ])

    return {
      imageLink: productImages[0] ?? '',
      additionalImageLink: productImages.slice(1, 10).join(','),
    }
  }

  const colorImages = getColorImages(product, variant.colorName)
  const orderedImages = dedupeUrls([
    ...colorImages.map((image) => image.url),
    mainImage?.url,
    ...infoImages.map((image) => image.url),
  ])

  return {
    imageLink: orderedImages[0] ?? '',
    additionalImageLink: orderedImages.slice(1, 10).join(','),
  }
}

function buildFallbackVariant(product: Product): ProductVariant | null {
  const mainImage = getMainImage(product)
  if (!mainImage && !product.mainImageUrl) {
    return null
  }

  return {
    id: `${product.id}-default`,
    colorName: '',
    colorHex: '#000000',
    size: '',
    stock: 0,
    sku: product.id,
  }
}

function isVariant(value: ProductVariant | null): value is ProductVariant {
  return value !== null
}

export async function GET() {
  const products = await getCatalogProducts()
  const rows: string[] = [FEED_HEADERS.join(',')]

  for (const product of products) {
    const validVariants = product.variants.filter((variant) => variant.size !== OUT_OF_STOCK_PLACEHOLDER_SIZE)
    const feedVariants = validVariants.length > 0 ? validVariants : [buildFallbackVariant(product)].filter(isVariant)
    const hasDiscount = Boolean(product.compareAtPrice && product.compareAtPrice > product.price)
    const price = hasDiscount ? product.compareAtPrice! : product.price
    const salePrice = hasDiscount ? product.price : null

    for (const variant of feedVariants) {
      const { imageLink, additionalImageLink } = getVariantImageSet(product, variant)

      const row = [
        variant.sku?.trim() || `${product.id}-${variant.id}`,
        buildVariantTitle(product, variant),
        toPlainText(product.shortDescription || product.description),
        variant.stock > 0 ? 'in stock' : 'out of stock',
        'new',
        formatFeedPrice(price),
        salePrice ? formatFeedPrice(salePrice) : '',
        buildVariantLink(product, variant),
        imageLink,
        additionalImageLink,
        'Patagonicos',
        'Animals & Pet Supplies > Pet Supplies > Pet Apparel',
        product.category,
        product.id,
        variant.colorName,
        variant.size,
      ]

      rows.push(row.map(escapeCsv).join(','))
    }
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="facebook-catalog.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
