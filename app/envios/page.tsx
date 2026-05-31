import Link from 'next/link'
import { CheckCircle2, CreditCard, PackageCheck, ShieldCheck, Truck, UserRound } from 'lucide-react'
import { ensureStoreSettings } from '@/lib/server/fulfillment'

export default async function ShippingPage() {
  const settings = await ensureStoreSettings()
  const freeShippingLabel = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(settings.localDeliveryFreeThreshold)
  const shippingCostLabel = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(settings.nationalShippingCost)

  return (
    <section className="shell pb-12 pt-40">
      <div className="space-y-8">
        <div className="card-surface overflow-hidden p-7 md:p-9">
          <p className="eyebrow">Envíos</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl tracking-[-0.05em]">
            Desde la compra hasta la entrega, todo pensado para que el proceso sea claro, rápido y fácil de seguir.
          </h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-black/62">
            Comprando antes de las 17 hs, el pedido se despacha en el día. Si la compra entra después de ese horario, sale al día siguiente. Trabajamos con una logística ágil para sostener despachos rápidos, pago seguro con Mercado Pago y seguimiento claro desde tu panel.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Cobertura</p>
              <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-black/86">Envíos a todo el país</p>
              <p className="mt-3 text-sm leading-7 text-black/62">
                Operamos con despacho nacional y actualización del pedido para que el cliente sepa en qué etapa está su compra.
              </p>
            </div>
            <div className="rounded-[26px] border border-emerald-200/80 bg-emerald-50/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">Beneficio</p>
              <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-emerald-800">Envío gratis desde {freeShippingLabel}</p>
              <p className="mt-3 text-sm leading-7 text-emerald-900/75">
                Cuando el pedido supera ese monto, el resumen lo muestra automáticamente como envío gratis.
              </p>
            </div>
            <div className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Referencia</p>
              <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-black/86">Envío nacional {shippingCostLabel}</p>
              <p className="mt-3 text-sm leading-7 text-black/62">
                Si no alcanza el mínimo para envío gratis, el costo se informa en el checkout y en el ticket final antes de pagar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="card-surface p-7 md:p-9">
            <p className="eyebrow">Cómo funciona</p>
            <div className="mt-6 space-y-4">
              {[
                {
                  icon: PackageCheck,
                  title: '1. Elegís el producto y ves promos claras',
                  copy:
                    'Las cards muestran precio, cuotas y mensajes como “mismo precio en cuotas” para que entiendas rápido cómo podés comprar antes de entrar al checkout.',
                },
                {
                  icon: CreditCard,
                  title: '2. Pagás con Mercado Pago',
                  copy:
                    'El checkout trabaja con Mercado Pago para que el pago online sea directo, seguro y familiar. Una vez aprobado, el pedido se confirma y pasa a preparación.',
                },
                {
                  icon: Truck,
                  title: '3. Despacho rápido',
                  copy:
                    'Si comprás antes de las 17 hs, el pedido sale en el día. Si comprás después, se despacha al día siguiente. Esa promesa aparece clara para que el cliente sepa qué esperar.',
                },
                {
                  icon: UserRound,
                  title: '4. El pedido entra a tu panel',
                  copy:
                    'Después de comprar, la orden queda guardada en tu cuenta. Desde ahí podés ver tus compras, el estado del pedido y el avance del envío.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-black/8 bg-[#fafaf8] p-5">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-0.03em] text-black/88">{item.title}</h2>
                      <p className="mt-2 text-sm leading-7 text-black/62">{item.copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface p-7">
              <p className="eyebrow">Lo que ve el cliente</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-black/62">
                <div className="rounded-[22px] border border-black/8 bg-[#fafaf8] p-4">
                  <p className="font-medium text-black/84">Seguimiento desde la cuenta</p>
                  <p className="mt-2">
                    El pedido no desaparece después del pago. Queda visible en el panel para revisar compras, estado y progreso del envío.
                  </p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-[#fafaf8] p-4">
                  <p className="font-medium text-black/84">Ticket claro antes de pagar</p>
                  <p className="mt-2">
                    El checkout muestra subtotal, descuentos, envío y total final para que no haya sorpresas.
                  </p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-[#fafaf8] p-4">
                  <p className="font-medium text-black/84">Promos fáciles de entender</p>
                  <p className="mt-2">
                    Si un producto dice “mismo precio en cuotas” o muestra cuotas, la idea es que el cliente entienda la financiación sin tener que interpretarla.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-surface p-7">
              <p className="eyebrow">Confianza</p>
              <div className="mt-5 space-y-3">
                {[
                  'Pago online con Mercado Pago.',
                  'Despacho en el día antes de las 17 hs.',
                  'Seguimiento del pedido desde el panel del cliente.',
                  'Resumen final claro con envío y descuentos.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[18px] bg-[#f7f7f4] px-4 py-3 text-sm text-black/72">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-black/70" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-7">
              <p className="eyebrow">Accesos rápidos</p>
              <div className="mt-5 grid gap-3">
                <Link href="/productos" className="flex items-center justify-between rounded-[20px] border border-black/8 bg-[#fafaf8] px-4 py-3 text-sm font-medium text-black/78 transition hover:bg-white hover:text-black">
                  Ver productos
                  <ShieldCheck className="h-4.5 w-4.5" />
                </Link>
                <Link href="/perfil" className="flex items-center justify-between rounded-[20px] border border-black/8 bg-[#fafaf8] px-4 py-3 text-sm font-medium text-black/78 transition hover:bg-white hover:text-black">
                  Ir a mi panel
                  <UserRound className="h-4.5 w-4.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
