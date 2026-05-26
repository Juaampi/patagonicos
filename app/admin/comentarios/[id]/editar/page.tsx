import { notFound } from 'next/navigation'
import { AdminReviewForm } from '@/components/admin/admin-review-form'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSnapshot } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export default async function EditAdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const snapshot = await getAdminSnapshot()
  const review = snapshot.reviews.find((item) => item.id === id)

  if (!review) {
    notFound()
  }

  return (
    <AdminShell>
      <AdminReviewForm
        products={snapshot.products.map((product) => ({
          id: product.id,
          name: product.name,
        }))}
        editReview={{
          id: review.id,
          productId: review.productId,
          authorName: review.authorName,
          authorLocation: review.authorLocation ?? undefined,
          title: review.title ?? undefined,
          comment: review.comment,
          rating: review.rating,
          createdAt: review.createdAt.toISOString().slice(0, 16),
          imageUrl: review.imageUrl ?? undefined,
        }}
      />
    </AdminShell>
  )
}
