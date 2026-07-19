'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, CircleCheckBig, Palette, PhoneCall, Ruler, Sparkles, Store, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getGalleryForColor, getMainImage, getProductColors, getSizesForColor } from '@/lib/variant-utils'
import { WHOLESALE_MIN_UNITS, WHOLESALE_MIN_UNITS_PER_MODEL_COLOR, getWholesalePrice } from '@/lib/wholesale'
import { getSiteWhatsAppHref } from '@/lib/site-contact'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types/store'

type InquiryFormState = {
  name: string
  businessName: string
  city: string
  phone: string
  notes: string
}

const BENEFITS = [
  {
    title: 'Más moderno que un PDF',
    description: 'Tus clientes mayoristas pueden ver la colección desde el celular con fotos grandes, colores y talles claros.',
    icon: Sparkles,
  },
  {
    title: 'Productos siempre actualizados',
    description: 'Cada cambio que hagas en los productos se refleja en esta página sin reenviar catálogos una y otra vez.',
    icon: CircleCheckBig,
  },
  {
    title: 'Consulta simple, sin carrito',
    description: 'La página muestra el catálogo y permite dejar un pedido o consulta, sin pasar por una compra online.',
    icon: PhoneCall,
  },
]

const BUYING_STEPS = [
  'Explorá los productos y revisá fotos, colores, talles y detalles de cada modelo.',
  'Marcá los productos que te interesan para incluirlos en el formulario.',
  'Completá tus datos y envianos la consulta por WhatsApp para confirmar stock, cantidades y envío.',
]

function getInitialColor(product: Product) {
  return getProductColors(product)[0]?.name ?? ''
}

function ProductGallery({
  product,
  colorName,
}: {
  product: Product
  colorName: string
}) {
  const gallery = useMemo(() => {
    const items = getGalleryForColor(product, colorName)
    return items.filter((item) => item.kind === 'image')
  }, [colorName, product])
  const [activeIndex, setActiveIndex] = useState(0)

  const safeIndex = gallery[activeIndex] ? activeIndex : 0
  const activeItem = gallery[safeIndex]
  const activeImage = activeItem?.image ?? getMainImage(product)

  if (!activeImage) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[28px] bg-[#f2ede6] text-sm text-black/45">
        Sin imagen disponible
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-black/8 bg-[radial-gradient(circle_at_top,#fff8ef_0%,#f4ede5_45%,#efe7dd_100%)]">
        <Image
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          sizes="(max-width: 768px) 100vw, 40vw"
          className="object-contain"
        />

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1))}
              className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_14px_30px_rgba(0,0,0,0.12)] transition hover:bg-white"
              aria-label={`Imagen anterior de ${product.name}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((current) => (current + 1) % gallery.length)}
              className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-[0_14px_30px_rgba(0,0,0,0.12)] transition hover:bg-white"
              aria-label={`Siguiente imagen de ${product.name}`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-18 w-16 shrink-0 overflow-hidden rounded-[18px] border transition ${
                index === safeIndex ? 'border-black bg-white' : 'border-black/10 bg-[#f4eee8]'
              }`}
              aria-label={`Ver foto ${index + 1} de ${product.name}`}
            >
              <Image
                src={item.image.url}
                alt={item.image.alt}
                fill
                sizes="64px"
                className="object-contain"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function WholesalePageClient({
  products,
}: {
  products: Product[]
}) {
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(products.map((product) => [product.id, getInitialColor(product)])),
  )
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [form, setForm] = useState<InquiryFormState>({
    name: '',
    businessName: '',
    city: '',
    phone: '',
    notes: '',
  })

  const selectedProductCards = useMemo(
    () =>
      products.filter((product) => selectedProducts.includes(product.id)).map((product) => ({
        id: product.id,
        name: product.name,
        colorName: selectedColors[product.id] ?? getInitialColor(product),
      })),
    [products, selectedColors, selectedProducts],
  )

  const whatsappHref = useMemo(() => {
    const lines = [
      'Hola Patagónicos, quiero hacer una consulta mayorista.',
      '',
      `Nombre: ${form.name || '-'}`,
      `Local o emprendimiento: ${form.businessName || '-'}`,
      `Ciudad / zona: ${form.city || '-'}`,
      `Teléfono: ${form.phone || '-'}`,
      '',
      'Productos de interés:',
      ...(
        selectedProductCards.length > 0
          ? selectedProductCards.map((product) => `- ${product.name} | color de referencia: ${product.colorName}`)
          : ['- Todavía no marqué productos, pero quiero recibir información mayorista.']
      ),
      '',
      `Comentario: ${form.notes || 'Quiero conocer stock, condiciones y cómo avanzar con el pedido.'}`,
    ]

    return getSiteWhatsAppHref(lines.join('\n'))
  }, [form, selectedProductCards])

  function toggleProduct(productId: string) {
    setSelectedProducts((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  return (
    <section className="shell pb-14 pt-28 md:pt-36">
      <div className="space-y-8 md:space-y-10">
        <section className="overflow-hidden rounded-[34px] border border-[#dccfc1] bg-[linear-gradient(135deg,#f7ecdc_0%,#ead7bf_40%,#d7e3d1_100%)]">
          <div className="grid gap-8 px-6 py-7 md:px-10 md:py-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-black/62 shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
                Catálogo mayorista online
              </p>
              <h1 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.07em] text-black/90 md:text-7xl">
                Mayorista con portada, catálogo y formulario en una sola experiencia.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-black/68 md:text-lg">
                En vez de mandar un PDF, esta página muestra la colección con fotos grandes, colores, talles y una forma
                simple de pedir información desde el celular.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#catalogo" className="button-primary">
                  Ver productos
                </a>
                <a href="#pedido" className="button-secondary bg-white/55 backdrop-blur-sm">
                  Ir al formulario
                </a>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] border border-black/8 bg-white/72 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/48">Pedido mínimo</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black/88">{WHOLESALE_MIN_UNITS} unidades</p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white/72 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/48">Modelo + color</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black/88">{WHOLESALE_MIN_UNITS_PER_MODEL_COLOR} unidades</p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white/72 p-4 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/48">Canal</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-black/88">Sin carrito</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-[28px] border border-white/40 bg-[#f4ebe0] p-3 shadow-[0_24px_50px_rgba(94,72,35,0.15)] sm:col-span-2">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[22px]">
                  <Image
                    src="/hero-header-otono.webp"
                    alt="Colección mayorista Patagónicos"
                    fill
                    priority
                    sizes="(max-width: 1280px) 100vw, 42vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="rounded-[26px] border border-black/8 bg-white/74 p-5 backdrop-blur-sm">
                <Palette className="h-5 w-5 text-black/72" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Colores</p>
                <p className="mt-2 text-lg font-medium tracking-[-0.04em] text-black/84">
                  Cada producto muestra sus variantes de color de forma visual.
                </p>
              </div>
              <div className="rounded-[26px] border border-black/8 bg-white/74 p-5 backdrop-blur-sm">
                <Ruler className="h-5 w-5 text-black/72" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Talles</p>
                <p className="mt-2 text-lg font-medium tracking-[-0.04em] text-black/84">
                  Los talles disponibles quedan claros sin depender de una planilla adjunta.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <article key={benefit.title} className="card-surface border-[#ddd7ce] bg-[linear-gradient(180deg,#fffdfa_0%,#f7f3ee_100%)] p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#efe2d2] text-black/80">
                <benefit.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-display text-3xl tracking-[-0.05em] text-black/88">{benefit.title}</h2>
              <p className="mt-3 text-sm leading-7 text-black/62">{benefit.description}</p>
            </article>
          ))}
        </section>

        <section id="catalogo" className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div className="space-y-6">
            <div className="card-surface overflow-hidden border-[#d8d7d0] bg-[linear-gradient(135deg,#fffaf3_0%,#f4efe9_48%,#eef3ea_100%)] p-7 md:p-9">
              <p className="eyebrow">Productos</p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.06em] text-black md:text-5xl">
                Colección mayorista para mostrar, no para comprar online.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
                Este espacio funciona como un catálogo vivo: podés actualizar productos e imágenes desde el admin y la
                página queda lista para compartir sin volver a armar un PDF.
              </p>
            </div>

            <div className="space-y-6">
              {products.map((product) => {
                const colors = getProductColors(product)
                const selectedColor = selectedColors[product.id] ?? colors[0]?.name ?? ''
                const sizes = getSizesForColor(product, selectedColor)
                const isSelected = selectedProducts.includes(product.id)

                return (
                  <article
                    key={product.id}
                    className="grid gap-6 rounded-[32px] border border-[#ddd6cc] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f3ec_100%)] p-5 shadow-[0_24px_70px_rgba(32,24,17,0.06)] md:p-6 xl:grid-cols-[0.92fr_1.08fr]"
                  >
                    <ProductGallery product={product} colorName={selectedColor} />

                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">{product.category}</p>
                            <h3 className="mt-2 font-display text-4xl tracking-[-0.06em] text-black/90 md:text-5xl">
                              {product.name}
                            </h3>
                          </div>
                          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/75">Referencia mayorista</p>
                            <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-emerald-950">
                              {formatPrice(getWholesalePrice(product.price))}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 text-base leading-8 text-black/64">{product.shortDescription || product.description}</p>

                        <div className="mt-6 grid gap-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4 text-black/55" />
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Colores</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {colors.map((color) => {
                                const isActive = color.name === selectedColor
                                return (
                                  <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setSelectedColors((current) => ({ ...current, [product.id]: color.name }))}
                                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                                      isActive ? 'border-black bg-black text-white' : 'border-black/12 bg-white text-black/72 hover:bg-black/4'
                                    }`}
                                    aria-pressed={isActive}
                                  >
                                    <span
                                      className="h-3 w-3 rounded-full border border-black/10"
                                      style={{ backgroundColor: color.hex || '#d6d3d1' }}
                                    />
                                    {color.name}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-black/55" />
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Talles</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {sizes.map((size) => (
                                <span
                                  key={`${product.id}-${selectedColor}-${size.label}`}
                                  className={`inline-flex rounded-full border px-3 py-2 text-sm ${
                                    size.inStock
                                      ? 'border-black/12 bg-white text-black/78'
                                      : 'border-black/8 bg-black/4 text-black/36 line-through'
                                  }`}
                                >
                                  {size.label}
                                </span>
                              ))}
                            </div>
                          </div>

                          {product.featureTags.length > 0 ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/45">Beneficios del producto</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {product.featureTags.slice(0, 6).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex rounded-full border border-black/10 bg-[#f1ece5] px-3 py-2 text-sm text-black/70"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className={isSelected ? 'button-primary' : 'button-secondary bg-white'}
                        >
                          {isSelected ? 'Producto agregado al formulario' : 'Sumar al formulario'}
                        </button>
                        <Link href={whatsappHref} target="_blank" rel="noreferrer" className="button-secondary">
                          Consultar este modelo
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="card-surface border-[#d7d6cf] bg-[linear-gradient(180deg,#ffffff_0%,#f6f3ee_100%)] p-6 md:p-7">
              <p className="eyebrow">Cómo comprar</p>
              <h2 className="mt-4 font-display text-3xl tracking-[-0.05em] text-black">Una dinámica simple para mayoristas</h2>
              <div className="mt-6 space-y-3">
                {BUYING_STEPS.map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-black/8 bg-white/75 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/42">Paso {index + 1}</p>
                    <p className="mt-2 text-sm leading-7 text-black/66">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface border-[#cbded1] bg-[linear-gradient(180deg,#eef8f1_0%,#dfeee3_100%)] p-6 md:p-7">
              <p className="eyebrow">Beneficios</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-black/68">
                <div className="flex items-start gap-3 rounded-[20px] bg-white/72 p-4">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                  <p>Ideal para compartir por link y mostrar desde cualquier celular.</p>
                </div>
                <div className="flex items-start gap-3 rounded-[20px] bg-white/72 p-4">
                  <Store className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                  <p>Los productos se actualizan desde la tienda, sin rehacer catálogos externos.</p>
                </div>
                <div className="flex items-start gap-3 rounded-[20px] bg-white/72 p-4">
                  <Truck className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                  <p>La confirmación final de stock, cantidades y envío se cierra por WhatsApp.</p>
                </div>
              </div>
            </div>

            <div id="pedido" className="card-surface overflow-hidden border-[#17231d] bg-[linear-gradient(145deg,#0f1714_0%,#1d3026_44%,#2d4a3d_100%)] p-6 text-white md:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/58">Formulario de pedido</p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.06em] text-white">Armá la consulta y enviala.</h2>
              <p className="mt-4 text-sm leading-7 text-white/72">
                Este formulario no cobra ni agrega al carrito. Solo prepara un mensaje mayorista claro para continuar la conversación.
              </p>

              <div className="mt-6 space-y-3">
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nombre y apellido"
                  className="w-full rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                />
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
                  placeholder="Local / emprendimiento"
                  className="w-full rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                />
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Ciudad o zona"
                  className="w-full rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Teléfono"
                  className="w-full rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                />
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Contanos qué necesitás, cantidades estimadas o dudas."
                  rows={4}
                  className="w-full rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/42"
                />
              </div>

              <div className="mt-6 rounded-[22px] border border-white/12 bg-white/8 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Productos marcados</p>
                <div className="mt-3 space-y-2">
                  {selectedProductCards.length > 0 ? (
                    selectedProductCards.map((product) => (
                      <div key={product.id} className="rounded-[16px] bg-white/8 px-3 py-3 text-sm text-white/82">
                        {product.name} · {product.colorName}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-white/64">
                      Podés enviar una consulta general aunque todavía no hayas marcado productos.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-[#edf3ee]"
                >
                  Enviar consulta por WhatsApp
                </Link>
                <p className="text-xs leading-6 text-white/56">
                  El mensaje incluye tus datos y los productos que marcaste como referencia.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </section>
  )
}
