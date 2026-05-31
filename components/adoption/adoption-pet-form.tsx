'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { saveAdoptionPetAction } from '@/lib/server/adoption'
import type { AdoptionPet } from '@/types/store'

const initialState = {
  status: 'idle' as 'idle' | 'success' | 'error',
  message: '',
  redirectTo: undefined as string | undefined,
}

export function AdoptionPetForm({
  pet,
  mode = 'create',
}: {
  pet?: AdoptionPet
  mode?: 'create' | 'edit'
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState(initialState)
  const [isPending, startTransition] = useTransition()
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])

  const currentImages = (pet?.images ?? []).filter((image) => !removedImageIds.includes(image.id))

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        const form = formRef.current
        if (!form) return

        const formData = new FormData(form)
        removedImageIds.forEach((id) => formData.append('deleteImageIds', id))

        startTransition(async () => {
          const result = await saveAdoptionPetAction(initialState, formData)
          setState(result)
          if (result.status === 'success' && result.redirectTo) {
            router.push(result.redirectTo)
            router.refresh()
          }
        })
      }}
      className="card-surface p-7"
    >
      <input type="hidden" name="petId" value={pet?.id ?? ''} />

      <p className="eyebrow">{mode === 'edit' ? 'Editar' : 'Nueva'} mascota</p>
      <h2 className="mt-4 font-display text-4xl tracking-[-0.05em]">
        {mode === 'edit' ? 'Actualizar ficha de adopción' : 'Cargar animal para adopción'}
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62">
        Nombre, edad, ubicación, contacto, estado e imágenes. La idea es mantenerlo simple para publicar rápido.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          name="name"
          defaultValue={pet?.name ?? ''}
          placeholder="Nombre"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="ageLabel"
          defaultValue={pet?.ageLabel ?? ''}
          placeholder="Edad"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="city"
          defaultValue={pet?.city ?? ''}
          placeholder="Ciudad"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="province"
          defaultValue={pet?.province ?? ''}
          placeholder="Provincia"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input
          name="contactPhone"
          defaultValue={pet?.contactPhone ?? ''}
          placeholder="Comunicarse al"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
        <label className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/46">Estado</span>
          <select
            name="status"
            defaultValue={pet?.status ?? 'EN_ADOPCION'}
            className="mt-3 w-full bg-transparent text-sm outline-none"
          >
            <option value="EN_ADOPCION">En adopción</option>
            <option value="ADOPTADO">Adoptado</option>
            <option value="EN_TRANSITO">En tránsito</option>
          </select>
        </label>

        <textarea
          name="summary"
          defaultValue={pet?.summary ?? ''}
          placeholder="Descripción breve"
          className="min-h-32 rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
      </div>

      <div className="mt-6 rounded-[24px] border border-black/8 bg-[#fafaf8] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-black/46">Imágenes</p>
        <p className="mt-2 text-sm leading-6 text-black/58">
          Podés dejar hasta 3 imágenes por animal.
        </p>

        {currentImages.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {currentImages.map((image) => (
              <div key={image.id} className="rounded-[18px] border border-black/8 bg-white p-3">
                <div className="relative aspect-[1/1] overflow-hidden rounded-[14px] bg-[#f3f3ef]">
                  <Image src={image.url} alt={image.alt} fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setRemovedImageIds((current) => [...current, image.id])}
                  className="mt-3 w-full rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <input
          type="file"
          name="images"
          accept="image/*"
          multiple
          className="mt-4 block w-full text-sm"
        />
      </div>

      {state.status !== 'idle' ? (
        <div
          className={`mt-6 rounded-[22px] px-5 py-4 text-sm ${
            state.status === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/transito')}
          className="button-secondary"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="button-primary"
        >
          {isPending ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Agregar animal'}
        </button>
      </div>
    </form>
  )
}
