import { CartPageClient } from '@/components/cart/cart-page-client'
import { ensureStoreSettings } from '@/lib/server/fulfillment'

export default async function CartPage() {
  const settings = await ensureStoreSettings()

  return <CartPageClient settings={settings} />
}
