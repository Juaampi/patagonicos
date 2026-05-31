import Link from 'next/link'
import { AdoptionAdminTable } from '@/components/adoption/adoption-admin-table'
import { getAdoptionPets } from '@/lib/server/adoption'

export const dynamic = 'force-dynamic'

function getSavedMessage(saved?: string) {
  if (saved === 'created') return 'Animal agregado correctamente.'
  if (saved === 'updated') return 'Animal actualizado correctamente.'
  return undefined
}

export default async function TransitoPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>
}) {
  const pets = await getAdoptionPets()
  const params = searchParams ? await searchParams : undefined
  const savedMessage = getSavedMessage(params?.saved)

  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <div className="space-y-8">
        <div className="card-surface p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Tránsito</p>
              <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Panel simple de adopciones</h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
                Alta, edición y control básico de animales en adopción, adoptados o en tránsito.
              </p>
            </div>
            <Link href="/transito/nuevo" className="button-primary">
              Agregar perrito
            </Link>
          </div>

          {savedMessage ? (
            <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              {savedMessage}
            </div>
          ) : null}
        </div>

        <AdoptionAdminTable pets={pets} />
      </div>
    </section>
  )
}
