'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { saveManualReviewAction } from '@/lib/server/catalog'
import { AdminProductSubmit } from './admin-product-submit'

const initialState = {
  status: 'idle' as 'idle' | 'success' | 'error',
  message: '',
  redirectTo: undefined as string | undefined,
}

export function AdminReviewForm({
  products,
  editReview,
}: {
  products: Array<{ id: string; name: string }>
  editReview?: {
    id: string
    productId: string
    authorName: string
    authorLocation?: string
    title?: string
    comment: string
    rating: number
    createdAt: string
    imageUrl?: string
  }
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState(initialState)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formRef.current) return

    setState(initialState)
    const formData = new FormData(formRef.current)

    startTransition(async () => {
      const result = await saveManualReviewAction(initialState, formData)
      setState(result)
      if (result.status === 'success' && result.redirectTo) {
        router.push(result.redirectTo)
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card-surface p-7">
      <p className="eyebrow">Comentarios</p>
      <h2 className="mt-4 font-display text-3xl tracking-[-0.05em]">
        {editReview ? 'Editar comentario' : 'Cargar comentario'}
      </h2>
      <p className="mt-3 text-sm leading-7 text-black/62">
        Podés inventar nombre, fecha, puntaje e imagen para construir prueba social con el mismo lenguaje premium del sitio.
      </p>

      {editReview ? <input type="hidden" name="reviewId" value={editReview.id} /> : null}

      {state.message ? (
        <div
          className={`mt-5 rounded-[18px] px-4 py-3 text-sm ${
            state.status === 'error'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          name="productId"
          defaultValue={editReview?.productId ?? ''}
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        >
          <option value="">Producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        <input
          name="authorName"
          defaultValue={editReview?.authorName}
          placeholder="Nombre del cliente"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="authorLocation"
          defaultValue={editReview?.authorLocation ?? ''}
          placeholder="Ubicación opcional"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="title"
          defaultValue={editReview?.title ?? ''}
          placeholder="Título corto opcional"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="rating"
          type="number"
          min="1"
          max="5"
          defaultValue={editReview?.rating ?? 5}
          placeholder="Puntaje"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="createdAt"
          type="datetime-local"
          defaultValue={editReview?.createdAt ?? ''}
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
      </div>

      <textarea
        name="comment"
        defaultValue={editReview?.comment}
        placeholder="Comentario"
        className="mt-4 min-h-32 w-full rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
      />

      <div className="mt-5 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-black/50">Imagen opcional</p>
        <p className="mt-2 text-sm leading-6 text-black/58">
          Subí una foto del cliente o del producto usado para acompañar la reseña.
        </p>
        <input name="image" type="file" accept="image/*" className="mt-4 block w-full text-sm" />
        {editReview?.imageUrl ? (
          <div className="mt-3 rounded-[14px] border border-black/10 bg-white px-3 py-3 text-xs text-black/46">
            {editReview.imageUrl}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AdminProductSubmit mode={editReview ? 'edit' : 'create'} pending={isPending} />
        <Link
          href="/admin/comentarios"
          className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/70 transition hover:bg-black hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
