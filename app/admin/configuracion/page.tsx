import { AdminSettingsPanel } from '@/components/admin/admin-settings-panel'
import { ensureStoreSettings } from '@/lib/server/fulfillment'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await ensureStoreSettings()

  return <AdminSettingsPanel settings={settings} />
}
