import { CartPageClient } from '@/components/cart/cart-page-client'
import { ensureStoreSettings } from '@/lib/server/fulfillment'
import { getFreeShippingUpsellProduct } from '@/lib/server/catalog'

export default async function CartPage() {
  const [settings, freeShippingUpsellProduct] = await Promise.all([
    ensureStoreSettings(),
    getFreeShippingUpsellProduct(),
  ])

  return <CartPageClient settings={settings} freeShippingUpsellProduct={freeShippingUpsellProduct} />
}
