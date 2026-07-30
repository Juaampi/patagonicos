import { CartPageClient } from '@/components/cart/cart-page-client'
import { ensureStoreSettings } from '@/lib/server/fulfillment'
import { getFreeShippingUpsellProduct } from '@/lib/server/catalog'
import { getAllProducts } from '@/lib/store'

export default async function CartPage() {
  const [settings, freeShippingUpsellProduct, products] = await Promise.all([
    ensureStoreSettings(),
    getFreeShippingUpsellProduct(),
    getAllProducts(),
  ])

  return <CartPageClient settings={settings} freeShippingUpsellProduct={freeShippingUpsellProduct} products={products} />
}
