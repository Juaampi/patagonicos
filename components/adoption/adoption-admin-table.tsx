'use client'

import Image from 'next/image'
import Link from 'next/link'
import { deleteAdoptionPetAction } from '@/lib/server/adoption'
import type { AdoptionPet } from '@/types/store'

function getStatusLabel(status: AdoptionPet['status']) {
  if (status === 'ADOPTADO') return 'Adoptado'
  if (status === 'EN_TRANSITO') return 'En tránsito'
  return 'En adopción'
}

export function AdoptionAdminTable({ pets }: { pets: AdoptionPet[] }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-5">
        <h3 className="font-display text-3xl tracking-[-0.05em]">Animales cargados</h3>
      </div>

      {pets.length === 0 ? (
        <div className="px-6 py-8 text-sm text-black/58">Todavía no hay animales cargados.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Animal</th>
                <th className="px-5 py-3 text-left font-medium">Ubicación</th>
                <th className="px-5 py-3 text-left font-medium">Estado</th>
                <th className="px-5 py-3 text-left font-medium">Imágenes</th>
                <th className="px-5 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pets.map((pet) => (
                <tr key={pet.id} className="border-t border-black/8 align-top">
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-[#f3f3ef]">
                        {pet.images[0] ? <Image src={pet.images[0].url} alt={pet.images[0].alt} fill className="object-cover" /> : null}
                      </div>
                      <div>
                        <p className="font-medium text-black/84">{pet.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-black/46">{pet.ageLabel}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-black/66">
                    {pet.city}
                    <p className="mt-1 text-xs text-black/48">{pet.province}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-black/68">
                      {getStatusLabel(pet.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-black/66">{pet.images.length}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/transito/${pet.id}/editar`}
                        className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
                      >
                        Editar
                      </Link>
                      <form action={deleteAdoptionPetAction}>
                        <input type="hidden" name="petId" value={pet.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-black/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
