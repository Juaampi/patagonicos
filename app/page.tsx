import { HeroSlider } from '@/components/marketing/hero-slider'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { BrandStory } from '@/components/marketing/brand-story'
import { ShoppingBenefits } from '@/components/marketing/shopping-benefits'
import { SectionHeading } from '@/components/marketing/section-heading'
import { ProductFeature } from '@/components/products/product-feature'
import { ProductCard } from '@/components/products/product-card'
import { faqItems } from '@/lib/store-data'
import { ensureStoreSettings } from '@/lib/server/fulfillment'
import { getProductsByAnimal, getStarProduct, groupProductsByCategory } from '@/lib/store'

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

  return (
    <>
      <HeroSlider />

      <BrandStory />

      <ProductFeature product={starProduct} />

      <ShoppingBenefits
        localDeliveryFreeThreshold={settings.localDeliveryFreeThreshold}
        barilocheEnabled={settings.barilocheEnabled}
      />

      <section className="shell mt-20">
        <SectionHeading
          eyebrow={speciesMeta.DOG.eyebrow}
          title={speciesMeta.DOG.title}
          description={speciesMeta.DOG.description}
        />
        {renderCategoryBlocks(dogProducts)}
      </section>

      <section className="shell mt-24">
        <SectionHeading
          eyebrow={speciesMeta.CAT.eyebrow}
          title={speciesMeta.CAT.title}
          description={speciesMeta.CAT.description}
        />
        {catProducts.length > 0 ? (
          renderCategoryBlocks(catProducts)
        ) : (
          <div className="card-surface mt-8 p-7 text-sm leading-7 text-black/58">
            Todavía no hay productos para gatos cargados en la base. El panel ya quedó preparado para asignarlos por separado.
          </div>
        )}
      </section>

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
