import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { getCatalogProducts } from '@/lib/server/catalog'
import { getGalleryForColor, getMainImage, OUT_OF_STOCK_PLACEHOLDER_SIZE } from '@/lib/variant-utils'

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

export async function GET() {
  const products = await getCatalogProducts()
  const rows: string[] = [FEED_HEADERS.join(',')]

  for (const product of products) {
    const productUrl = new URL(`/productos/${product.slug}`, env.SITE_URL).toString()
    const defaultImage = getMainImage(product)
    const validVariants = product.variants.filter((variant) => variant.size !== OUT_OF_STOCK_PLACEHOLDER_SIZE)

    for (const variant of validVariants) {
      const galleryImages = getGalleryForColor(product, variant.colorName)
        .filter((item) => item.kind === 'image')
        .map((item) => item.image.url)

      const imageLink = galleryImages[0] ?? defaultImage?.url ?? product.mainImageUrl ?? ''
      const additionalImageLink = galleryImages.slice(1, 10).join(',')

      const row = [
        variant.sku,
        product.name,
        toPlainText(product.shortDescription || product.description),
        variant.stock > 0 ? 'in stock' : 'out of stock',
        'new',
        `${(product.price / 100).toFixed(2)} ARS`,
        product.compareAtPrice && product.compareAtPrice > product.price
          ? `${(product.price / 100).toFixed(2)} ARS`
          : '',
        productUrl,
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
