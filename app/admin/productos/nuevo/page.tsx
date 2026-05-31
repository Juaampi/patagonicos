import { notFound } from 'next/navigation'
import { AdminProductEditorPage } from '@/components/admin/admin-product-editor-page'
import { getAdminSnapshot } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export default async function NewAdminProductPage() {
  const snapshot = await getAdminSnapshot()

  if (!snapshot.categories) {
    notFound()
  }

  return <AdminProductEditorPage categories={snapshot.categories} mode="create" />
}
