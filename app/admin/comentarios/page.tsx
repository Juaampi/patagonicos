import { AdminReviewsPanel } from '@/components/admin/admin-reviews-panel'
import { getAdminSnapshot } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export default async function AdminCommentsPage() {
  const snapshot = await getAdminSnapshot()

  return (
    <AdminReviewsPanel
      reviews={snapshot.reviews.map((review) => ({
        id: review.id,
        productId: review.productId,
        productName: review.product.name,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        imageUrl: review.imageUrl ?? undefined,
      }))}
    />
  )
}
