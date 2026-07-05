import { HeroSlider } from '@/components/marketing/hero-slider'
import { AdoptionShowcase } from '@/components/adoption/adoption-showcase'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { BrandStory } from '@/components/marketing/brand-story'
import { ShoppingBenefits } from '@/components/marketing/shopping-benefits'
import { SectionHeading } from '@/components/marketing/section-heading'
import { ProductFeature } from '@/components/products/product-feature'
import { ProductCard } from '@/components/products/product-card'
import { faqItems } from '@/lib/store-data'
import { getPublicAdoptionPets } from '@/lib/server/adoption'
import { ensureStoreSettings } from '@/lib/server/fulfillment'
import { getProductsByAnimal, getStarProduct, groupProductsByCategory } from '@/lib/store'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const speciesMeta = {
  DOG: {
    eyebrow: 'Perros',
    title: 'Indumentaria pensada en los días frescos',
    description:
      'Camperas térmicas, parkas, buzos, botas y accesorios pensados para nieve, viento y caminatas de invierno real.',
  },
  CAT: {
    eyebrow: 'Gatos',
    title: 'Abrigo premium para gatos sensibles al frío',
    description:
      'Piezas más livianas, cómodas y térmicas para interior frío, traslados y mascotas que necesitan cobertura extra.',
  },
} as const

function renderCategoryBlocks(animalProducts: Awaited<ReturnType<typeof getProductsByAnimal>>) {
  const grouped = Array.from(groupProductsByCategory(animalProducts).entries())

  return grouped.map(([category, items]) => (
    <section key={category} className="mt-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-black/44">Categoría</p>
          <h3 className="mt-2 font-display text-3xl tracking-[-0.05em] md:text-4xl">{category}</h3>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-black/58">
          {items.length} producto{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''} en esta línea.
        </p>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  ))
}

export default async function HomePage() {
  const settings = await ensureStoreSettings()
  const starProduct = await getStarProduct('DOG')
  const dogProducts = await getProductsByAnimal('DOG')
  const catProducts = await getProductsByAnimal('CAT')
  const adoptionPets = await getPublicAdoptionPets()
  const hasCatProducts = catProducts.length > 0

  return (
    <>
      <HeroSlider />

      <ProductFeature product={starProduct} />

      <section className="shell mt-20">
        <SectionHeading
          eyebrow={speciesMeta.DOG.eyebrow}
          title={speciesMeta.DOG.title}
          description={speciesMeta.DOG.description}
        />
        {renderCategoryBlocks(dogProducts)}
      </section>

      {hasCatProducts ? (
        <section className="shell mt-24">
          <SectionHeading
            eyebrow={speciesMeta.CAT.eyebrow}
            title={speciesMeta.CAT.title}
            description={speciesMeta.CAT.description}
          />
          {renderCategoryBlocks(catProducts)}
        </section>
      ) : null}

      <BrandStory />

      <ShoppingBenefits
        localDeliveryFreeThreshold={settings.localDeliveryFreeThreshold}
        barilocheEnabled={settings.barilocheEnabled}
      />

      <section className="shell mt-20">
        <div className="changes-highlight overflow-hidden rounded-[36px] border border-[#cfe5d9] bg-[linear-gradient(135deg,#f5fbf7_0%,#edf7f1_52%,#e2f3ea_100%)] p-7 md:p-10">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div>
              <p className="eyebrow">Cambios de talle</p>
              <h2 className="changes-highlight__title mt-4 max-w-4xl font-display text-4xl tracking-[-0.05em] md:text-5xl">
                Si no le quedó perfecto, armamos un flujo claro para cambiar la prenda sin vueltas.
              </h2>
              <p className="changes-highlight__copy mt-5 max-w-3xl text-base leading-8 text-black/62">
                Entendemos que no todas las mascotas tienen el mismo porte, aun dentro del mismo peso o raza. Por eso explicamos paso a paso cómo funciona el cambio por talle, qué condiciones tiene y cómo se sigue desde el panel.
              </p>
            </div>
            <div className="changes-highlight__panel rounded-[28px] border border-black/8 bg-white/88 p-6 backdrop-blur-sm">
              <p className="changes-highlight__panel-copy text-sm leading-7 text-black/64">
                El sistema te permite pedir el cambio para la misma prenda en un talle mayor o menor, confirmar cuando despachaste la original y seguir todo desde tu cuenta.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/cambios"
                  className="inline-flex rounded-full bg-emerald-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black"
                >
                  Ir a cambios
                </Link>
                <Link
                  href="/guia-de-talles"
                  className="inline-flex rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/78 transition hover:bg-black hover:text-white"
                >
                  Ver guía de talles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdoptionShowcase pets={adoptionPets.slice(0, 6)} />

      {settings.barilocheEnabled ? (
        <section className="shell mt-20">
          <div className="rounded-[36px] bg-black px-8 py-14 text-white md:px-12">
            <p className="eyebrow text-white/58">Bariloche</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] md:text-6xl">
              Una operación pensada para clima real, con ventana comercial viva.
            </h2>
            <div className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              <BarilocheDeliveryCountdown variant="block" light />
            </div>
          </div>
        </section>
      ) : null}

      <section className="shell mt-20 mb-4 grid gap-6 xl:grid-cols-2">
        <div className="card-surface p-7 md:p-9">
          <SectionHeading
            eyebrow="Preguntas frecuentes"
            title="Envíos, uso y talles sin ruido visual"
            description="Información clara, técnica y alineada con una marca outdoor, no con un petshop clásico."
          />
        </div>
        <div className="space-y-4">
          {faqItems.map((faq) => (
            <article key={faq.question} className="card-surface p-6">
              <h3 className="font-display text-2xl tracking-[-0.04em]">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-black/62">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
