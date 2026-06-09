import Link from 'next/link'
import { CheckCheck, CircleDashed, CreditCard, Package, PackageCheck, Truck } from 'lucide-react'
import { findMockTrackingOrder } from '@/lib/mock-order-tracking'
import { findTrackedOrder, getAndreaniTrackingUrl } from '@/lib/server/andreani'
import { getOrderStateLabel, getShippingMethodLabel } from '@/lib/server/fulfillment'

export const dynamic = 'force-dynamic'

function getTrackedOrderTimeline(order: NonNullable<Awaited<ReturnType<typeof findTrackedOrder>>>) {
  const paymentConfirmed = order.paymentStatus === 'PAID'
  const prepared = paymentConfirmed || ['EN_PREPARACION', 'DESPACHADO', 'EN_TRANSITO', 'EN_SUCURSAL', 'ENTREGADO'].includes(order.shippingStatus)
  const dispatched = ['DESPACHADO', 'EN_TRANSITO', 'EN_SUCURSAL', 'ENTREGADO'].includes(order.shippingStatus)
  const inTransit = ['EN_TRANSITO', 'EN_SUCURSAL', 'ENTREGADO'].includes(order.shippingStatus)
  const delivered = order.shippingStatus === 'ENTREGADO'

  return [
    {
      key: 'confirmed',
      label: 'Pedido confirmado',
      description: paymentConfirmed ? 'El pago ya fue acreditado y el pedido quedó validado.' : 'Estamos esperando la confirmación del pago.',
      done: paymentConfirmed,
      icon: CreditCard,
    },
    {
      key: 'prepared',
      label: 'Preparando paquete',
      description: prepared ? 'El pedido ya entró a preparación y embalaje.' : 'Todavía no empezó el armado del paquete.',
      done: prepared,
      icon: Package,
    },
    {
      key: 'dispatched',
      label: 'Despachado',
      description: dispatched ? 'Ya lo entregamos a Andreani con tu código de seguimiento.' : 'Todavía no fue despachado al correo.',
      done: dispatched,
      icon: PackageCheck,
    },
    {
      key: 'transit',
      label: 'En viaje',
      description: inTransit ? 'El paquete ya está en movimiento hacia tu zona.' : 'Aún no figura en tránsito.',
      done: inTransit,
      icon: Truck,
    },
    {
      key: 'delivered',
      label: 'Entregado',
      description: delivered ? 'El pedido figura como entregado.' : 'Todavía no aparece como entregado.',
      done: delivered,
      icon: CheckCheck,
    },
  ]
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const code = params?.code?.trim() ?? ''
  const trackedOrder = code ? await findTrackedOrder(code) : null
  const mockOrder = trackedOrder ? null : code ? findMockTrackingOrder(code) : null
  const andreaniTrackerUrl = getAndreaniTrackingUrl()

  return (
    <section className="shell pb-12 pt-40">
      <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="card-surface p-7 md:p-9">
          <p className="eyebrow">Seguimiento de pedidos</p>
          <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Buscá tu envío con el código de seguimiento</h1>
          <p className="mt-5 text-base leading-8 text-black/62">
            Si tu pedido ya fue despachado, podés verlo acá con el tracking y también abrir el buscador oficial de Andreani.
          </p>

          <form action="/seguimiento" className="mt-8 space-y-4">
            <input
              name="code"
              defaultValue={code}
              placeholder="Ej: 360000000000000"
              className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button className="button-primary">Buscar pedido</button>
              <Link href={andreaniTrackerUrl} target="_blank" className="button-secondary">
                Abrir Andreani
              </Link>
            </div>
          </form>

          {!trackedOrder ? (
            <div className="mt-8 rounded-[22px] border border-black/8 bg-[#f7f7f4] px-5 py-5 text-sm text-black/60">
              <p className="font-medium text-black/82">Códigos demo para probar</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['AND-PA-24001', 'AND-PA-24002', 'AND-PA-24003'].map((sample) => (
                  <Link
                    key={sample}
                    href={`/seguimiento?code=${sample}`}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/74 transition hover:bg-black hover:text-white"
                  >
                    {sample}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="card-surface p-7 md:p-9">
          {!code ? (
            <div className="rounded-[24px] bg-[#f7f7f4] px-6 py-8 text-sm leading-7 text-black/58">
              Ingresá tu código de seguimiento para ver por dónde va el pedido.
            </div>
          ) : trackedOrder ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-black/46">{trackedOrder.trackingNumber ?? trackedOrder.shortCode ?? trackedOrder.orderNumber}</p>
                <h2 className="mt-3 font-display text-4xl tracking-[-0.05em] text-black">{getOrderStateLabel(trackedOrder.shippingStatus)}</h2>
                <p className="mt-3 text-sm leading-7 text-black/60">
                  {trackedOrder.carrier ?? 'Andreani'} · {getShippingMethodLabel(trackedOrder.shippingMethod)} · destino {trackedOrder.address?.city ?? 'Sin ciudad'}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Cliente</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{trackedOrder.customer.fullName ?? trackedOrder.customer.email}</p>
                </div>
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Tracking</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{trackedOrder.trackingNumber ?? 'Pendiente de carga'}</p>
                </div>
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Destino</p>
                  <p className="mt-2 text-sm font-medium text-black/82">
                    {[trackedOrder.address?.city, trackedOrder.address?.province].filter(Boolean).join(', ') || 'Sin destino'}
                  </p>
                </div>
              </div>

              <div className="shipment-timeline rounded-[26px] border border-black/8 bg-[linear-gradient(180deg,#fbfbf8_0%,#f4f4ef_100%)] p-5 md:p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-black/46">Camino del envío</p>
                <div className="mt-5 space-y-4">
                  {getTrackedOrderTimeline(trackedOrder).map((step, index, steps) => {
                    const Icon = step.icon
                    const isLast = index === steps.length - 1

                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex w-10 flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                              step.done
                                ? 'border-black bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]'
                                : 'border-black/12 bg-white text-black/42'
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          {!isLast ? (
                            <div className={`mt-2 w-px flex-1 ${step.done ? 'bg-black/22' : 'bg-black/10'}`} />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm font-semibold ${step.done ? 'text-black/86' : 'text-black/56'}`}>{step.label}</p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                step.done ? 'bg-black text-white' : 'border border-black/10 bg-white text-black/48'
                              }`}
                            >
                              {step.done ? 'Hecho' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-black/58">{step.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {trackedOrder.trackingNumber ? (
                  <Link href={getAndreaniTrackingUrl(trackedOrder.trackingNumber)} target="_blank" className="button-secondary mt-2">
                    Seguimiento de mi envío
                  </Link>
                ) : null}
              </div>

              <div className="rounded-[22px] border border-black/8 bg-white px-5 py-5 text-sm leading-7 text-black/60">
                <p className="font-medium text-black/84">Estado interno del pedido</p>
                <p className="mt-2">
                  Pedido {trackedOrder.shortCode ?? trackedOrder.orderNumber} con envío {getOrderStateLabel(trackedOrder.shippingStatus).toLowerCase()}.
                </p>
                {trackedOrder.trackingNumber ? (
                  <Link href={getAndreaniTrackingUrl(trackedOrder.trackingNumber)} target="_blank" className="button-secondary mt-4">
                    Seguir en Andreani
                  </Link>
                ) : null}
              </div>
            </div>
          ) : !mockOrder ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-8 text-sm leading-7 text-red-700">
              No encontramos el código <strong>{code}</strong>. Revisalo o probá con uno de los códigos demo.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-black/46">{mockOrder.code}</p>
                <h2 className="mt-3 font-display text-4xl tracking-[-0.05em] text-black">{mockOrder.status}</h2>
                <p className="mt-3 text-sm leading-7 text-black/60">
                  {mockOrder.eta} · {mockOrder.carrier} · destino {mockOrder.destination}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Cliente</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{mockOrder.customerName}</p>
                </div>
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Correo</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{mockOrder.carrier}</p>
                </div>
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Entrega estimada</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{mockOrder.eta}</p>
                </div>
              </div>

              <div className="shipment-timeline rounded-[26px] border border-black/8 bg-[linear-gradient(180deg,#fbfbf8_0%,#f4f4ef_100%)] p-5 md:p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-black/46">Camino del envío</p>
                <div className="mt-5 space-y-4">
                  {mockOrder.events.map((event, index) => {
                    const icons = [CreditCard, Package, PackageCheck, Truck, CheckCheck]
                    const Icon = icons[Math.min(index, icons.length - 1)] ?? CircleDashed
                    const isLast = index === mockOrder.events.length - 1

                    return (
                      <div key={`${event.label}-${index}-timeline`} className="flex gap-4">
                        <div className="flex w-10 flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          {!isLast ? <div className="mt-2 w-px flex-1 bg-black/22" /> : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-black/86">{event.label}</p>
                            <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                              Hecho
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-black/58">{event.description}</p>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-black/42">{event.timestamp}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                {mockOrder.events.map((event, index) => (
                  <div key={`${event.label}-${index}`} className="rounded-[22px] border border-black/8 bg-white px-5 py-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-black/86">{event.label}</p>
                        <p className="mt-1 text-sm leading-6 text-black/60">{event.description}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-black/42">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
