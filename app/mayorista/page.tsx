import type { Metadata } from 'next'
import { WholesalePageClient } from '@/components/wholesale/wholesale-page-client'
import { getAllProducts } from '@/lib/store'

export const metadata: Metadata = {
  title: 'Patagónicos Mayorista 2026',
  description:
    'Armá tu pedido mayorista con productos reales de Patagónicos, precio especial y cierre por WhatsApp.',
}

export const dynamic = 'force-dynamic'

export default async function WholesalePage() {
  const products = await getAllProducts()

  const availableProducts = products.filter((product) =>
    product.variants.some((variant) => variant.stock > 0),
  )

  return <WholesalePageClient products={availableProducts} />
}
