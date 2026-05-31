import { SiteHeader } from '@/components/layout/site-header'
import { ensureStoreSettings } from '@/lib/server/fulfillment'

export async function SiteHeaderShell() {
  const settings = await ensureStoreSettings()

  return <SiteHeader settings={settings} />
}
