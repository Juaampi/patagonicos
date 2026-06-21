import Link from 'next/link'
import { Check, Compass, Mountain, Package, ShieldCheck, Snowflake, Sparkles, Truck } from 'lucide-react'
import { getSiteWhatsAppHref } from '@/lib/site-contact'

export const metadata = {
  title: 'Patagónicos Mayorista 2026',
  description:
    'Condiciones comerciales y línea otoño invierno mayorista de Patagónicos para indumentaria de mascotas.',
}

const wholesaleConditions = [
  'Pedido mínimo: 30 unidades.',
  'Se pueden combinar modelos, colores y talles.',
  'Descuento mayorista: 40% sobre precio de venta al público.',
  'Pedido mínimo por modelo/color: 10 unidades.',
  'Envíos a todo el país.',
  'Precios sujetos a actualización sin previo aviso.',
]

const wholesaleProducts = [
  {
    name: 'Capa Impermeable Térmica',
    retailPrice: 'PVP: $79.999',
    wholesalePrice: 'Mayorista (+10 unidades): $47.999',
    accent: 'border-[#cfe5d9] bg-[linear-gradient(135deg,#f5fbf7_0%,#edf7f1_52%,#e2f3ea_100%)]',
  },
  {
    name: 'Chaleco Polar Térmico',
    retailPrice: 'PVP: Consultar web',
    wholesalePrice: 'Mayorista: 40% OFF',
    accent: 'border-black/8 bg-[#fafaf8]',
  },
  {
    name: 'Buzo Polar Premium',
    retailPrice: 'PVP: Consultar web',
    wholesalePrice: 'Mayorista: 40% OFF',
    accent: 'border-black/8 bg-[#fafaf8]',
  },
  {
    name: 'Enterito Polar Térmico',
    retailPrice: 'PVP: Consultar web',
    wholesalePrice: 'Mayorista: 40% OFF',
    accent: 'border-black/8 bg-[#fafaf8]',
  },
  {
    name: 'Campera Impermeable con Interior Térmico',
    retailPrice: 'PVP: Consultar web',
    wholesalePrice: 'Mayorista: 40% OFF',
    accent: 'border-black/8 bg-[#fafaf8]',
  },
  {
    name: 'Chaleco Polar con Arnés Integrado',
    retailPrice: 'PVP: Consultar web',
    wholesalePrice: 'Mayorista: 40% OFF',
    accent: 'border-black/8 bg-[#fafaf8]',
  },
  {
    name: 'Buzo Térmico 4 Patas',
    retailPrice: 'PVP: Consultar web',
    wholesalePrice: 'Mayorista: 40% OFF',
    accent: 'border-black/8 bg-[#fafaf8]',
  },
] as const

const benefits = [
  'Diseños exclusivos inspirados en la Patagonia.',
  'Indumentaria para perros pequeños, medianos y grandes.',
  'Materiales térmicos seleccionados para otoño e invierno.',
  'Marca en crecimiento con fuerte presencia online.',
  'Donamos el 5% de cada compra a refugios de animales.',
]

const wholesaleIcons = [Package, Snowflake, ShieldCheck, Mountain, Truck, Sparkles] as const

export default function WholesalePage() {
  const wholesaleMessage =
    'Hola Patagónicos, quiero consultar por compras mayoristas de indumentaria para mascotas.'

  return (
    <section className="shell pb-12 pt-32 md:pt-40">
      <div className="space-y-8">
        <div className="card-surface overflow-hidden border border-[#dbe7df] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef4f1_38%,#f7f7f3_100%)]">
          <div className="grid gap-8 px-7 py-8 md:px-9 md:py-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="eyebrow">Canal exclusivo</p>
              <h1 className="mt-4 max-w-5xl font-display text-5xl tracking-[-0.06em] text-black/92 md:text-6xl">
                PATAGÓNICOS MAYORISTA 2026
              </h1>
              <p className="mt-4 text-xl font-medium tracking-[-0.03em] text-black/72">
                Indumentaria para mascotas
              </p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-black/62">
                Una propuesta mayorista clara, flexible y alineada con el universo Patagónicos: abrigo técnico, imagen
                premium y una identidad visual inspirada en el clima y el paisaje patagónico.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: 'Pedido mínimo',
                  value: '30 unidades',
                  icon: Package,
                },
                {
                  label: 'Descuento mayorista',
                  value: '40% OFF',
                  icon: ShieldCheck,
                },
                {
                  label: 'Cobertura',
                  value: 'Todo el país',
                  icon: Truck,
                },
                {
                  label: 'Espíritu de marca',
                  value: 'Hecho para explorar',
                  icon: Compass,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[26px] border border-black/8 bg-white/80 p-5 backdrop-blur-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#f6f6f2] text-black/80">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">{item.label}</p>
                  <p className="mt-2 text-2xl font-medium tracking-[-0.04em] text-black/88">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface p-7 md:p-9">
          <p className="eyebrow">Condiciones comerciales</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wholesaleConditions.map((condition, index) => {
              const Icon = wholesaleIcons[index]

              return (
                <article
                  key={condition}
                  className="rounded-[26px] border border-black/8 bg-[#fafaf8] p-5 transition duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-black/72">{condition}</p>
                </article>
              )
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-7 md:p-9">
            <p className="eyebrow">Línea Otoño · Invierno</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] text-black md:text-5xl">
              Catálogo mayorista para una temporada pensada en abrigo real
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
              Productos con identidad premium, lectura visual limpia y un foco comercial claro para tiendas que quieren
              sumar indumentaria para mascotas con lenguaje outdoor.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {wholesaleProducts.map((product) => (
              <article
                key={product.name}
                className={`card-surface overflow-hidden border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] ${product.accent}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Patagónicos mayorista</p>
                <h3 className="mt-4 font-display text-3xl tracking-[-0.05em] text-black/90">{product.name}</h3>
                <div className="mt-6 space-y-3">
                  <div className="rounded-[20px] border border-black/8 bg-white/84 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-black/44">Venta al público</p>
                    <p className="mt-2 text-base font-medium text-black/82">{product.retailPrice}</p>
                  </div>
                  <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/90 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700/80">Condición mayorista</p>
                    <p className="mt-2 text-base font-semibold text-emerald-900">{product.wholesalePrice}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="card-surface p-7 md:p-9">
            <p className="eyebrow">Beneficios Patagónicos</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] text-black md:text-5xl">
              Una marca con propuesta clara para crecer en tiendas y puntos de venta
            </h2>
            <div className="mt-6 space-y-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-[22px] border border-black/8 bg-[#fafaf8] px-4 py-4 text-sm leading-7 text-black/72"
                >
                  <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface overflow-hidden border border-[#cfe5d9] bg-[linear-gradient(135deg,#0f1720_0%,#18332b_45%,#2b5c46_100%)] p-7 text-white md:p-9">
            <p className="eyebrow text-white/60">Pedido mínimo</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] md:text-5xl">30 unidades combinadas.</h2>
            <p className="mt-5 text-base leading-8 text-white/76">
              Combiná modelos, colores y talles para armar una propuesta comercial flexible, manteniendo una lectura de
              colección sólida para otoño e invierno.
            </p>

            <div className="mt-8 rounded-[28px] border border-white/16 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/64">Contacto mayorista</p>
              <Link
                href={getSiteWhatsAppHref(wholesaleMessage)}
                target="_blank"
                rel="noreferrer"
                className="button-primary mt-4 inline-flex bg-white text-black hover:bg-[#f0f4ee]"
              >
                Consultar por pedido mayorista
              </Link>
              <p className="mt-5 text-sm leading-7 text-white/72">patagonicostienda.com.ar</p>
            </div>

            <div className="mt-8 border-t border-white/12 pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">PATAGÓNICOS</p>
              <p className="mt-2 font-display text-3xl tracking-[-0.05em] text-white">Hecho para explorar.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
