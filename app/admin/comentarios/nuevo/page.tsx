import { notFound } from 'next/navigation'
import { AdminReviewForm } from '@/components/admin/admin-review-form'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSnapshot } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export default async function NewAdminReviewPage() {
  const snapshot = await getAdminSnapshot()

  if (!snapshot.products) {
    notFound()
  }

  return (
    <AdminShell>
      <AdminReviewForm
        products={snapshot.products.map((product) => ({
          id: product.id,
          name: product.name,
        }))}
      />
    </AdminShell>
  )
}
