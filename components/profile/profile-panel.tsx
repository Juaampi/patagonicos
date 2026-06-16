import { confirmExchangeShipmentAction, createExchangeRequestAction, updateCustomerWhatsappOptInAction } from '@/lib/server/fulfillment-actions'
import { getOrderStateLabel, getProfileSavedMessage, getShippingMethodLabel } from '@/lib/server/fulfillment'
import { ProfileSavedAlert } from '@/components/profile/profile-saved-alert'
import { getAndreaniTrackingUrl } from '@/lib/server/andreani'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { CheckCheck, CreditCard, Package, PackageCheck, Truck } from 'lucide-react'

type ProfilePanelProps = {
  email?: string
  saved?: string
  currentTimeIso: string
  profile:
    | {
        id: string
        email: string
        fullName?: string | null
        phone?: string | null
        whatsappOptIn: boolean
        orders: Array<{
          id: string
          orderNumber: string
          shortCode?: string | null
          status: string
          paymentStatus: string
          shippingMethod: string
          total: number
          createdAt: string
          deliveredAt?: string | null
          whatsappOptIn: boolean
          trackingNumber?: string | null
          address?: { city?: string | null; province?: string | null; line1?: string | null } | null
          items: Array<{
            id: string
            name: string
            quantity: number
            color: string
            size: string
            exchangeOptions: string[]
            exchangeRequests: Array<{
              id: string
              currentSize: string
              requestedSize: string
              status: string
              createdAt: string
              customerShipmentConfirmedAt?: string | null
              replacementOrderId?: string | null
            }>
          }>
        }>
      }
    | null
}

export function ProfilePanel({ email, saved, currentTimeIso, profile }: ProfilePanelProps) {
  const savedMessage = getProfileSavedMessage(saved)
  const currentTimestamp = new Date(currentTimeIso).getTime()

  const getStatusBadgeClass = (status: string) => {
    if (['SHIPPED', 'OUT_FOR_DELIVERY', 'READY_FOR_NATIONAL_SHIPPING', 'READY_FOR_LOCAL_DELIVERY', 'EN_PREPARACION', 'DESPACHADO', 'EN_TRANSITO'].includes(status)) {
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    }

    if (['DELIVERED', 'ENTREGADO'].includes(status)) {
      return 'border border-black/10 bg-black text-white'
    }

    if (['CANCELLED', 'CANCELADO'].includes(status)) {
      return 'border border-red-200 bg-red-50 text-red-700'
    }

    return 'border border-amber-200 bg-amber-50 text-amber-800'
  }

  const getTimeline = (order: NonNullable<ProfilePanelProps['profile']>['orders'][number]) => {
    const paymentConfirmed = order.paymentStatus === 'PAID'
    const prepared = paymentConfirmed || ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
    const dispatched = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status)
    const inTransit = ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) || Boolean(order.trackingNumber)
    const delivered = order.status === 'DELIVERED'
    const currentKey = delivered
      ? 'delivered'
      : inTransit
        ? 'transit'
        : dispatched
          ? 'dispatched'
          : prepared
            ? 'prepared'
            : paymentConfirmed
              ? 'payment'
              : null

    return [
      {
        key: 'payment',
        label: 'Pago confirmado',
        description: paymentConfirmed ? 'El pago ya fue acreditado y el pedido quedó validado.' : 'Estamos esperando la confirmación del pago.',
        done: paymentConfirmed,
        current: currentKey === 'payment',
        icon: CreditCard,
      },
      {
        key: 'prepared',
        label: 'En preparación',
        description: prepared ? 'El pedido ya entró a preparación y embalaje.' : 'Todavía no empezó el armado del paquete.',
        done: prepared,
        current: currentKey === 'prepared',
        icon: Package,
      },
      {
        key: 'dispatched',
        label: 'Despachado',
        description: dispatched ? 'Ya lo entregamos al correo con tu código de seguimiento.' : 'Todavía no fue despachado al correo.',
        done: dispatched,
        current: currentKey === 'dispatched',
        icon: PackageCheck,
      },
      {
        key: 'transit',
        label: 'En proceso',
        description: inTransit ? 'El paquete ya está en movimiento hacia tu zona.' : 'Aún no figura en tránsito.',
        done: inTransit,
        current: currentKey === 'transit',
        icon: Truck,
      },
      {
        key: 'delivered',
        label: 'Entregado',
        description: delivered ? 'El pedido figura como entregado.' : 'Todavía no aparece como entregado.',
        done: delivered,
        current: currentKey === 'delivered',
        icon: CheckCheck,
      },
    ]
  }

  const canRequestExchange = (order: NonNullable<ProfilePanelProps['profile']>['orders'][number]) => {
    const delivered = order.status === 'DELIVERED' || order.status === 'ENTREGADO'
    if (!delivered) {
      return false
    }

    const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt)
    return currentTimestamp - deliveredAt.getTime() <= 48 * 60 * 60 * 1000
  }

  const getExchangeStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      REQUESTED: 'En cambio',
      CUSTOMER_SHIPMENT_CONFIRMED: 'Cliente confirmó envío',
      REPLACEMENT_CREATED: 'Pedido de recambio creado',
      REJECTED: 'Rechazado',
      COMPLETED: 'Completado',
    }

    return labels[status] ?? status
  }

  const hasActiveExchange = (order: NonNullable<ProfilePanelProps['profile']>['orders'][number]) =>
    order.items.some((item) =>
      item.exchangeRequests.some((request) =>
        ['REQUESTED', 'CUSTOMER_SHIPMENT_CONFIRMED', 'REPLACEMENT_CREATED'].includes(request.status),
      ),
    )

  return (
    <section className="shell pb-12 pt-32">
      <ProfileSavedAlert saved={saved} savedMessage={savedMessage} />

      <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <aside className="card-surface p-7">
          <p className="eyebrow">Mi cuenta</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Acceso por email</h1>
          <p className="mt-4 text-sm leading-7 text-black/62">
            Después de comprar, tu cuenta queda asociada al mismo email. Entrás desde acá y ves pedidos, entrega y notificaciones.
          </p>
          <form action="/perfil" className="mt-6">
            <input
              name="email"
              defaultValue={email ?? ''}
              placeholder="tu@email.com"
              className="w-full rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
            />
            <button className="button-primary mt-4 w-full">Ver mi cuenta</button>
          </form>

          {profile ? (
            <div className="mt-6 rounded-[22px] bg-[#f7f7f4] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-black/50">Cliente</p>
              <p className="mt-3 text-base font-medium text-black/84">{profile.fullName ?? profile.email}</p>
              <p className="mt-1 text-sm text-black/62">{profile.phone ?? 'Sin teléfono cargado'}</p>
              <div className="mt-4 border-t border-black/8 pt-4">
                <form action={updateCustomerWhatsappOptInAction}>
                  <input type="hidden" name="customerId" value={profile.id} />
                  <input type="hidden" name="email" value={profile.email} />
                  <input type="hidden" name="enabled" value={profile.whatsappOptIn ? 'false' : 'true'} />
                  <button className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/76 transition hover:bg-black hover:text-white">
                    {profile.whatsappOptIn ? 'Desactivar notificaciones WhatsApp' : 'Activar notificaciones WhatsApp'}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-5">
          {!email ? (
            <div className="card-surface p-7 text-sm leading-7 text-black/58">
              Ingresá tu email para ver la cuenta asociada a tus compras.
            </div>
          ) : !profile ? (
            <div className="card-surface p-7 text-sm leading-7 text-black/58">
              No encontramos una cuenta para <strong>{email}</strong>. Revisá si compraste con ese email o hacé una compra nueva para que quede creada.
            </div>
          ) : profile.orders.length === 0 ? (
            <div className="card-surface p-7 text-sm leading-7 text-black/58">
              Tu cuenta ya existe pero todavía no tiene pedidos.
            </div>
          ) : (
            profile.orders.map((order) => {
              const andreaniTrackingUrl = getAndreaniTrackingUrl(order.trackingNumber)

              return (
                <article key={order.id} className="card-surface p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Pedido {order.shortCode ?? order.orderNumber}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-3xl tracking-[-0.05em]">{getOrderStateLabel(order.status)}</h2>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(order.status)}`}>
                        {getOrderStateLabel(order.status)}
                      </span>
                      {hasActiveExchange(order) ? (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-800">
                          En cambio
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-black/55">
                      {new Date(order.createdAt).toLocaleDateString('es-AR')} · {getShippingMethodLabel(order.shippingMethod)}
                    </p>
                  </div>
                  <p className="text-xl font-semibold">{formatPrice(order.total)}</p>
                </div>

                <div className="shipment-timeline mt-6 rounded-[26px] border border-black/8 bg-[linear-gradient(180deg,#fbfbf8_0%,#f4f4ef_100%)] p-5 md:p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Camino del envío</p>
                  <div className="mt-5 space-y-4">
                    {getTimeline(order).map((step, index, steps) => {
                      const Icon = step.icon
                      const isLast = index === steps.length - 1

                      return (
                        <div key={`${order.id}-${step.key}`} className="flex gap-4">
                          <div className="flex w-10 flex-col items-center">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                step.current
                                  ? 'bg-emerald-600 text-white'
                                  : step.done
                                    ? 'bg-black text-white'
                                    : 'bg-black/8 text-black/42'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            {!isLast ? (
                              <div
                                className={`mt-2 w-px flex-1 ${
                                  step.current ? 'bg-emerald-300' : step.done ? 'bg-black/22' : 'bg-black/10'
                                }`}
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1 pb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`shipment-timeline__step-label ${step.current ? 'shipment-timeline__step-label--current text-emerald-800' : step.done ? 'text-black/86' : 'text-black/56'} text-sm font-semibold`}>
                                {step.label}
                              </p>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  step.current
                                    ? 'bg-emerald-600 text-white'
                                    : step.done
                                      ? 'bg-black text-white'
                                      : 'border border-black/10 bg-white text-black/48'
                                }`}
                              >
                                {step.current ? 'En curso' : step.done ? 'Hecho' : 'Pendiente'}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-black/58">{step.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {order.trackingNumber ? (
                    <Link href={andreaniTrackingUrl} target="_blank" className="button-secondary mt-2">
                      Seguimiento de mi envío
                    </Link>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Productos</p>
                    <div className="mt-3 space-y-2 text-sm text-black/72">
                      {order.items.map((item) => (
                        <div key={item.id} className="rounded-[18px] border border-black/8 bg-white px-4 py-4">
                          <p>{item.name} · {item.color} · {item.size} · x{item.quantity}</p>

                          {item.exchangeRequests[0] ? (
                            <div className="mt-3 rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs leading-6 text-emerald-900">
                              Solicitud de cambio: {item.exchangeRequests[0].currentSize} por {item.exchangeRequests[0].requestedSize} · {getExchangeStatusLabel(item.exchangeRequests[0].status)}
                              {item.exchangeRequests[0].replacementOrderId ? (
                                <span className="mt-1 block text-emerald-800">Recambio generado y listo para gestionar.</span>
                              ) : null}
                            </div>
                          ) : null}

                          {item.exchangeRequests[0]?.status === 'REQUESTED' ? (
                            <form action={confirmExchangeShipmentAction} className="mt-3">
                              <input type="hidden" name="exchangeRequestId" value={item.exchangeRequests[0].id} />
                              <input type="hidden" name="email" value={profile.email} />
                              <button className="rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/76 transition hover:bg-black hover:text-white">
                                Confirmé que envié mi prenda
                              </button>
                            </form>
                          ) : canRequestExchange(order) && item.exchangeOptions.length > 0 ? (
                            <form action={createExchangeRequestAction} className="mt-3 space-y-3">
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="orderItemId" value={item.id} />
                              <input type="hidden" name="email" value={profile.email} />
                              <label className="block rounded-[16px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-xs uppercase tracking-[0.14em] text-black/46">
                                Cambiar prenda
                                <select name="requestedSize" defaultValue="" className="mt-2 block w-full bg-transparent text-sm normal-case tracking-normal text-black outline-none">
                                  <option value="" disabled>Elegí un talle mayor o menor</option>
                                  {item.exchangeOptions.map((size) => (
                                    <option key={`${item.id}-${size}`} value={size}>
                                      {size}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <button className="rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/76 transition hover:bg-black hover:text-white">
                                Solicitar cambio por sistema
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Pago y envío</p>
                    <p className="mt-3 text-sm text-black/72">{getOrderStateLabel(order.paymentStatus)}</p>
                    <p className="mt-1 text-sm text-black/52">{order.address?.city ?? ''} {order.address?.province ? `· ${order.address.province}` : ''}</p>
                    {order.trackingNumber ? (
                      <Link href={`/seguimiento?code=${encodeURIComponent(order.trackingNumber)}`} className="mt-3 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/74 transition hover:bg-black hover:text-white">
                        Seguir envío
                      </Link>
                    ) : null}
                  </div>
                  <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Notificaciones</p>
                    <p className="mt-3 text-sm text-black/72">
                      {order.whatsappOptIn ? 'WhatsApp activado para este pedido.' : 'WhatsApp no activado para este pedido.'}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-black/58">
                      Realizamos cambios dentro de las 48 hs hábiles de haber recibido el producto, únicamente por la misma prenda en un talle mayor o menor.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/58">
                      Si querés otra prenda distinta, escribinos por WhatsApp así lo vemos de forma personalizada.
                    </p>
                    <Link href="/contacto" className="mt-3 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/74 transition hover:bg-black hover:text-white">
                      Escribir por WhatsApp
                    </Link>
                    {!order.whatsappOptIn && profile.phone ? (
                      <form action={updateCustomerWhatsappOptInAction} className="mt-3">
                        <input type="hidden" name="customerId" value={profile.id} />
                        <input type="hidden" name="email" value={profile.email} />
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="enabled" value="true" />
                        <button className="rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/76 transition hover:bg-black hover:text-white">
                          Activar notificaciones al celular
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
