import { AdoptionPetCard } from '@/components/adoption/adoption-pet-card'
import { getPublicAdoptionPets } from '@/lib/server/adoption'

type AdoptamePageSearchParams = Promise<{
  provincia?: string | string[]
  ciudad?: string | string[]
  tipo?: string | string[]
}>

function getSingleSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeFilterValue(value?: string) {
  return value?.trim().toLocaleLowerCase('es-AR') ?? ''
}

function getAnimalTypeLabel(type: string) {
  return type === 'CAT' ? 'Gato' : 'Perro'
}

export default async function AdoptamePage({
  searchParams,
}: {
  searchParams: AdoptamePageSearchParams
}) {
  const pets = await getPublicAdoptionPets()
  const params = await searchParams

  const selectedProvince = getSingleSearchParam(params.provincia)?.trim() ?? ''
  const selectedCity = getSingleSearchParam(params.ciudad)?.trim() ?? ''
  const selectedTypeRaw = getSingleSearchParam(params.tipo)?.trim().toUpperCase() ?? ''
  const selectedType = selectedTypeRaw === 'CAT' || selectedTypeRaw === 'DOG' ? selectedTypeRaw : ''

  const provinces = Array.from(new Set(pets.map((pet) => pet.province.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'es-AR'),
  )
  const cities = Array.from(
    new Set(
      pets
        .filter((pet) => !selectedProvince || normalizeFilterValue(pet.province) === normalizeFilterValue(selectedProvince))
        .map((pet) => pet.city.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, 'es-AR'))

  const filteredPets = pets.filter((pet) => {
    const matchesProvince =
      !selectedProvince || normalizeFilterValue(pet.province) === normalizeFilterValue(selectedProvince)
    const matchesCity = !selectedCity || normalizeFilterValue(pet.city) === normalizeFilterValue(selectedCity)
    const matchesType = !selectedType || pet.animalType === selectedType

    return matchesProvince && matchesCity && matchesType
  })

  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <div className="card-surface p-7 md:p-9">
        <p className="eyebrow">Adoptame</p>
        <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Mascotas que hoy están buscando hogar</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
          Acá vas a encontrar las mascotas que hoy están disponibles para adopción, con nombre, edad, ubicación y contacto directo.
        </p>
      </div>

      <form className="card-surface mt-8 p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Buscador</p>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.05em]">Filtrar mascotas en adopción</h2>
          </div>
          <a href="/adoptame" className="text-sm font-medium text-black/58 underline-offset-4 hover:text-black hover:underline">
            Limpiar filtros
          </a>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/46">Provincia</span>
            <select name="provincia" defaultValue={selectedProvince} className="mt-3 w-full bg-transparent text-sm outline-none">
              <option value="">Todas</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/46">Ciudad</span>
            <select name="ciudad" defaultValue={selectedCity} className="mt-3 w-full bg-transparent text-sm outline-none">
              <option value="">Todas</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/46">Tipo de mascota</span>
            <select name="tipo" defaultValue={selectedType} className="mt-3 w-full bg-transparent text-sm outline-none">
              <option value="">Todos</option>
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" className="button-primary">
            Buscar
          </button>
          <p className="text-sm leading-6 text-black/58">
            {filteredPets.length} {filteredPets.length === 1 ? 'resultado' : 'resultados'}
            {selectedType ? ` · ${getAnimalTypeLabel(selectedType)}` : ''}
          </p>
        </div>
      </form>

      {filteredPets.length === 0 ? (
        <div className="card-surface mt-8 p-7 text-sm leading-7 text-black/62">
          No encontramos mascotas con esos filtros. Probá con otra provincia, ciudad o tipo.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPets.map((pet) => (
            <AdoptionPetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </section>
  )
}
