import { AdoptionPetCard } from '@/components/adoption/adoption-pet-card'
import { getPublicAdoptionPets } from '@/lib/server/adoption'

export const dynamic = 'force-dynamic'

export default async function AdoptamePage() {
  const pets = await getPublicAdoptionPets()

  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <div className="card-surface p-7 md:p-9">
        <p className="eyebrow">Adoptame</p>
        <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Mascotas que hoy están buscando hogar</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
          Acá vas a encontrar las mascotas que hoy están disponibles para adopción, con nombre, edad, ubicación y contacto directo.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {pets.map((pet) => (
          <AdoptionPetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </section>
  )
}
