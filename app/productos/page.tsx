import Link from 'next/link'
import { SectionHeading } from '@/components/marketing/section-heading'
import { ProductCard } from '@/components/products/product-card'
import { getAllProducts, groupProductsByCategory } from '@/lib/store'
import type { Product } from '@/types/store'

export const dynamic = 'force-dynamic'

const speciesContent: Record<Product['animalType'], { eyebrow: string; title: string; description: string }> = {
  DOG: {
    eyebrow: 'Perros',
    title: 'Ropa para perros',
    description: 'Colección técnica para nieve, frío, viento y uso diario en Bariloche y Patagonia.',
  },
  CAT: {
    eyebrow: 'Gatos',
    title: 'Abrigo premium para gatos',
    description: 'Piezas térmicas, livianas y cómodas para interior frío, traslados y mascotas sensibles.',
  },
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ animal?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const selectedAnimal = params?.animal === 'CAT' ? 'CAT' : params?.animal === 'DOG' ? 'DOG' : null
  const products = await getAllProducts()
  const filtered = selectedAnimal ? products.filter((product) => product.animalType === selectedAnimal) : products
  const grouped = Array.from(groupProductsByCategory(filtered).entries())

  return (
    <section className="shell pb-12 pt-6 md:pt-12">
      <div className="card-surface p-7 md:p-9">
        <SectionHeading
          eyebrow={selectedAnimal ? speciesContent[selectedAnimal].eyebrow : 'Colección'}
          title={selectedAnimal ? speciesContent[selectedAnimal].title : 'Colección separada por especie y categoría'}
          description={
            selectedAnimal
              ? speciesContent[selectedAnimal].description
              : 'Explorá perros y gatos por separado. El catálogo mantiene filtros claros para que cada línea tenga su propia lectura de producto.'
          }
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/productos?animal=DOG"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              selectedAnimal === 'DOG'
                ? 'border-black bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                : 'border-black/10 bg-white text-black/70 hover:border-black/20'
            }`}
          >
            Perros
          </Link>
          <Link
            href="/productos?animal=CAT"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              selectedAnimal === 'CAT'
                ? 'border-black bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                : 'border-black/10 bg-white text-black/70 hover:border-black/20'
            }`}
          >
            Gatos
          </Link>
          <Link
            href="/productos"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              selectedAnimal === null
                ? 'border-black bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                : 'border-black/10 bg-white text-black/70 hover:border-black/20'
            }`}
          >
            Ver todo
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="card-surface p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Especie</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/productos?animal=DOG"
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] transition ${
                  selectedAnimal === 'DOG'
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-white text-black/72 hover:border-black/20'
                }`}
              >
                Perros
              </Link>
              <Link
                href="/productos?animal=CAT"
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] transition ${
                  selectedAnimal === 'CAT'
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 bg-white text-black/72 hover:border-black/20'
                }`}
              >
                Gatos
              </Link>
            </div>
          </div>
          <div className="card-surface p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Categorías disponibles</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {grouped.map(([category]) => (
                <span key={category} className="rounded-full border border-black/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-black/72">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-10">
          {grouped.map(([category, items]) => (
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
          ))}
        </div>
      </div>
    </section>
  )
}
