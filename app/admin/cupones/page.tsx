import { AdminCouponsPanel } from '@/components/admin/admin-coupons-panel'
import { getAdminCouponsSnapshot } from '@/lib/server/coupons'

export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>
}) {
  const coupons = await getAdminCouponsSnapshot()
  const resolvedSearchParams = searchParams ? await searchParams : undefined

  return (
    <AdminCouponsPanel
      coupons={coupons}
      savedMessage={resolvedSearchParams?.saved ? 'Cupón guardado correctamente.' : undefined}
      errorMessage={resolvedSearchParams?.error}
    />
  )
}
