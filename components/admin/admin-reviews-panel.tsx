import Image from 'next/image'
import Link from 'next/link'

type AdminReviewsPanelProps = {
  reviews: Array<{
    id: string
    productId: string
    productName: string
    authorName: string
    rating: number
    comment: string
    createdAt: string
    imageUrl?: string
  }>
}

export function AdminReviewsPanel({ reviews }: AdminReviewsPanelProps) {
  return (
    <div id="comentarios" className="card-surface overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-black/10 px-7 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Comentarios</p>
          <h2 className="mt-4 font-display text-3xl tracking-[-0.05em]">Prueba social cargada manualmente</h2>
        </div>
        <Link
          href="/admin/comentarios/nuevo"
          className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/82"
        >
          Cargar comentario
        </Link>
      </div>

      <div className="space-y-4 p-7">
        {reviews.length === 0 ? (
          <p className="text-sm text-black/58">Todavía no hay comentarios cargados.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-[24px] border border-black/10 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-black/45">{review.productName}</p>
                  <h3 className="mt-2 text-lg font-medium text-black/84">{review.authorName}</h3>
                  <p className="mt-1 text-sm text-black/58">{review.comment}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-black/40">
                    {review.rating}/5 · {new Date(review.createdAt).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {review.imageUrl ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-[18px] bg-[#f3f3ef]">
                      <Image src={review.imageUrl} alt={review.authorName} fill className="object-cover" />
                    </div>
                  ) : null}
                  <Link
                    href={`/admin/comentarios/${review.id}/editar`}
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
