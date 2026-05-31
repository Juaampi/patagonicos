import Link from 'next/link'
import type { AdoptionPet } from '@/types/store'
import { AdoptionPetCard } from './adoption-pet-card'

export function AdoptionShowcase({ pets }: { pets: AdoptionPet[] }) {
  if (pets.length === 0) {
    return null
  }

  return (
    <section className="shell mt-24">
      <div className="card-surface overflow-hidden p-7 md:p-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Adoptame</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] md:text-5xl">
              Perritos que hoy están buscando hogar
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62 md:text-base md:leading-8">
              Algunos de los perros que hoy están en adopción. Vas a ver nombre, edad y de qué ciudad y provincia vienen.
            </p>
          </div>
          <Link href="/adoptame" className="button-secondary">
            Ver todos
          </Link>
        </div>

        <div className="mt-8 -mx-2 flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 pb-2">
          {pets.map((pet) => (
            <div key={pet.id} className="min-w-[290px] snap-start md:min-w-[360px] xl:min-w-[390px]">
              <AdoptionPetCard pet={pet} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
