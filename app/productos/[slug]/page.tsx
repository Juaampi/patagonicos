import { notFound } from 'next/navigation'
import { SectionHeading } from '@/components/marketing/section-heading'
import { ProductDetail } from '@/components/products/product-detail'
import { ProductCard } from '@/components/products/product-card'
import { ensureStoreSettings } from '@/lib/server/fulfillment'
import { getProductBySlug, getRelatedProducts } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const related = await getRelatedProducts(slug)
  const settings = await ensureStoreSettings()

  return (
    <section className="shell pb-12 pt-6 md:pt-8">
      <ProductDetail product={product} settings={settings} />
      <div className="mt-20">
        <SectionHeading
          eyebrow="Relacionados"
          title="Más producto técnico para sumar a la salida"
          description="Selección complementaria con la misma lógica de protección y estética de marca."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
