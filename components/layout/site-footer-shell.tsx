import { SiteFooter } from '@/components/layout/site-footer'
import { ensureStoreSettings } from '@/lib/server/fulfillment'

export async function SiteFooterShell() {
  const settings = await ensureStoreSettings()

  return <SiteFooter settings={settings} />
}
