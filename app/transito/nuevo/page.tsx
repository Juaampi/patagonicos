import { AdoptionPetForm } from '@/components/adoption/adoption-pet-form'

export const dynamic = 'force-dynamic'

export default function NuevoTransitoPage() {
  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <AdoptionPetForm mode="create" />
    </section>
  )
}
