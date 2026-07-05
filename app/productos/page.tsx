import Link from 'next/link'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { ProductCard } from '@/components/products/product-card'
import { getAllProducts, groupProductsByCategory } from '@/lib/store'
import type { Product } from '@/types/store'

export const dynamic = 'force-dynamic'

const speciesContent: Record<Product['animalType'], { eyebrow: string; title: string; description: string }> = {
  DOG: {
    eyebrow: 'Línea perros',
    title: 'Abrigo técnico para perros',
    description: 'Colección pensada para frío, viento y uso diario, con lectura clara por categoría.',
  },
  CAT: {
    eyebrow: 'Línea gatos',
    title: 'Abrigo liviano para gatos',
    description: 'Piezas térmicas, cómodas y más suaves en lectura visual para encontrar rápido lo que buscás.',
  },
}

const sortOptions = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'name-asc', label: 'A a Z' },
] as const

type SortValue = (typeof sortOptions)[number]['value']

function buildProductsHref(animal: Product['animalType'] | null, category: string | null, sort: SortValue) {
  const params = new URLSearchParams()

  if (animal) {
    params.set('animal', animal)
  }

  if (category) {
    params.set('category', category)
  }

  if (sort !== 'featured') {
    params.set('sort', sort)
  }

  const query = params.toString()
  return query ? `/productos?${query}` : '/productos'
}

function getFilterChipClass(active: boolean) {
  return active
    ? 'border-black bg-black !text-white shadow-[0_10px_26px_rgba(0,0,0,0.14)]'
    : 'border-black/10 bg-white text-black/72 hover:border-black/20 hover:bg-black/[0.03] hover:text-black'
}

function sortProducts(items: Product[], sort: SortValue) {
  const cloned = [...items]

  if (sort === 'price-asc') {
    return cloned.sort((a, b) => a.price - b.price)
  }

  if (sort === 'price-desc') {
    return cloned.sort((a, b) => b.price - a.price)
  }

  if (sort === 'name-asc') {
    return cloned.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }

  return cloned.sort((a, b) => {
    const salesDiff = (b.salesCount ?? 0) - (a.salesCount ?? 0)

    if (salesDiff !== 0) {
      return salesDiff
    }

    return a.name.localeCompare(b.name, 'es')
  })
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ animal?: string; category?: string; sort?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const products = await getAllProducts()
  const hasDogProducts = products.some((product) => product.animalType === 'DOG')
  const hasCatProducts = products.some((product) => product.animalType === 'CAT')
  const availableAnimals = {
    DOG: hasDogProducts,
    CAT: hasCatProducts,
  } as const
  const requestedAnimal = params?.animal === 'CAT' ? 'CAT' : params?.animal === 'DOG' ? 'DOG' : null
  const selectedAnimal = requestedAnimal && availableAnimals[requestedAnimal] ? requestedAnimal : null
  const selectedCategory = params?.category?.trim() ? params.category.trim() : null
  const selectedSort = sortOptions.some((option) => option.value === params?.sort)
    ? (params?.sort as SortValue)
    : 'featured'
  const filteredByAnimal = selectedAnimal ? products.filter((product) => product.animalType === selectedAnimal) : products
  const allCategories = Array.from(new Set(filteredByAnimal.map((product) => product.category)))
  const normalizedCategory = selectedCategory && allCategories.includes(selectedCategory) ? selectedCategory : null
  const filteredProducts = normalizedCategory
    ? filteredByAnimal.filter((product) => product.category === normalizedCategory)
    : filteredByAnimal
  const sortedProducts = sortProducts(filteredProducts, selectedSort)
  const grouped = Array.from(groupProductsByCategory(sortedProducts).entries())

  return (
    <section className="shell pb-12 pt-6 md:pt-12">
      <div className="card-surface overflow-hidden p-7 md:p-9">
        <div className="max-w-3xl">
          <SectionHeading
            eyebrow={selectedAnimal ? speciesContent[selectedAnimal].eyebrow : 'Colección completa'}
            title={selectedAnimal ? speciesContent[selectedAnimal].title : 'Productos ordenados para encontrar más rápido'}
            description={
              selectedAnimal
                ? speciesContent[selectedAnimal].description
                : 'Unificamos la lectura del catálogo para que la navegación sea más clara, sin repetir filtros ni mezclar especies.'
            }
          />
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={buildProductsHref(null, normalizedCategory, selectedSort)}
                className={`rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${getFilterChipClass(selectedAnimal === null)}`}
              >
                Todo
              </Link>
              {hasDogProducts ? (
                <Link
                  href={buildProductsHref('DOG', normalizedCategory, selectedSort)}
                  className={`rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${getFilterChipClass(selectedAnimal === 'DOG')}`}
                >
                  Perros
                </Link>
              ) : null}
              {hasCatProducts ? (
                <Link
                  href={buildProductsHref('CAT', normalizedCategory, selectedSort)}
                  className={`rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${getFilterChipClass(selectedAnimal === 'CAT')}`}
                >
                  Gatos
                </Link>
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48">Categorías</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={buildProductsHref(selectedAnimal, null, selectedSort)}
                className={`rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${getFilterChipClass(normalizedCategory === null)}`}
              >
                Todas
              </Link>
              {allCategories.map((category) => (
                <Link
                  key={category}
                  href={buildProductsHref(selectedAnimal, category, selectedSort)}
                  className={`rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${getFilterChipClass(normalizedCategory === category)}`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48">Ordenar por</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {sortOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildProductsHref(selectedAnimal, normalizedCategory, option.value)}
                  className={`rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${getFilterChipClass(selectedSort === option.value)}`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="card-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48">Cómo recorrer</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-black/62">
              <p>Primero elegí si querés ver todo el catálogo o una sola línea.</p>
              <p>Después filtrá por categoría para acotar la búsqueda sin repetir secciones.</p>
              <p>Las cards mantienen cuotas, precio y variantes para que la decisión sea más rápida.</p>
            </div>
          </div>

          <div className="card-surface p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48">Categorías visibles</p>
            <div className="mt-4 space-y-2">
              {allCategories.map((category) => {
                const count = filteredByAnimal.filter((product) => product.category === category).length

                return (
                  <Link
                    key={category}
                    href={buildProductsHref(selectedAnimal, category, selectedSort)}
                    className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-sm transition ${
                      normalizedCategory === category
                        ? 'border-black bg-black !text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]'
                        : 'border-black/8 bg-[#fafaf8] text-black/74 hover:border-black/16 hover:bg-white'
                    }`}
                  >
                    <span className={`font-medium ${normalizedCategory === category ? '!text-white' : ''}`}>{category}</span>
                    <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] ${normalizedCategory === category ? '!text-white' : ''}`}>
                      {count}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-10">
          {grouped.length > 0 ? (
            grouped.map(([category, items]) => (
              <section key={category}>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Categoría</p>
                    <h2 className="mt-2 font-display text-3xl tracking-[-0.05em]">{category}</h2>
                  </div>
                  <p className="text-sm text-black/52">{items.length} disponibles</p>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="card-surface p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/48">Sin resultados</p>
              <h2 className="mt-3 font-display text-3xl tracking-[-0.05em]">No encontramos productos con ese filtro</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-black/62">
                Probá volver a todas las categorías o cambiar de línea para ver más opciones disponibles.
              </p>
              <div className="mt-6">
                <Link href="/productos" className="button-secondary">
                  Ver todo el catálogo
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
