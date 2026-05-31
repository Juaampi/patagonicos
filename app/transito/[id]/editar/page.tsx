import { notFound } from 'next/navigation'
import { AdoptionPetForm } from '@/components/adoption/adoption-pet-form'
import { getAdoptionPetById } from '@/lib/server/adoption'

export const dynamic = 'force-dynamic'

export default async function EditarTransitoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pet = await getAdoptionPetById(id)

  if (!pet) {
    notFound()
  }

  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <AdoptionPetForm pet={pet} mode="edit" />
    </section>
  )
}
