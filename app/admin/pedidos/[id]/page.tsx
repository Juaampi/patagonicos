import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAndreaniTrackingUrl } from '@/lib/server/andreani'
import { buildGoogleMapsPinUrl, getOrderForTicket, getOrderStateLabel, getShippingMethodLabel } from '@/lib/server/fulfillment'
import {
  createReplacementOrderFromExchangeAction,
  markOrderPaidAction,
  markOrderShippedWithTrackingAction,
  updateOrderStatusAction,
} from '@/lib/server/fulfillment-actions'
import { formatPrice } from '@/lib/utils'

function getExchangeStatusLabel(status: string) {
  const labels: Record<string, string> = {
    REQUESTED: 'En cambio',
    CUSTOMER_SHIPMENT_CONFIRMED: 'Cliente confirmó envío',
    REPLACEMENT_CREATED: 'Pedido de recambio creado',
    REJECTED: 'Rechazado',
    COMPLETED: 'Completado',
  }

  return labels[status] ?? status
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderForTicket(id)

  if (!order) {
    notFound()
  }

  const pinUrl = buildGoogleMapsPinUrl(order.address?.latitude, order.address?.longitude)
  const andreaniTrackerUrl = getAndreaniTrackingUrl()
  const replacementContext = order.replacementExchangeRequests?.[0]

  return (
    <AdminShell>
      <div className="card-surface p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Pedido</p>
            <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">{order.shortCode ?? order.orderNumber}</h1>
            <p className="mt-3 text-sm text-black/58">{order.orderNumber}</p>
            {replacementContext ? (
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <span className="font-semibold">Pedido de recambio</span>
                <span className="text-sky-800">Original:</span>
                <Link href={`/admin/pedidos/${replacementContext.orderId}`} className="font-semibold underline underline-offset-2">
                  {replacementContext.order.shortCode ?? replacementContext.order.orderNumber}
                </Link>
                <span className="text-sky-800">
                  · {replacementContext.orderItem.productName} · {replacementContext.currentSize} por {replacementContext.requestedSize}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/pedidos/${order.id}/ticket`}
              className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
            >
              Imprimir ticket
            </Link>
            {pinUrl ? (
              <Link
                href={pinUrl}
                target="_blank"
                className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
              >
                Ver pin
              </Link>
            ) : null}
            {order.paymentStatus !== 'PAID' ? (
              <form action={markOrderPaidAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                  Marcar pagado
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Cliente y entrega</h2>
              <div className="mt-4 grid gap-4 text-sm text-black/64 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-black/42">Cliente</p>
                  <p className="mt-2 text-base font-medium text-black/84">{order.customer.fullName ?? order.customer.email}</p>
                  <p className="mt-1">{order.customer.phone ?? 'Sin teléfono'}</p>
                  <p className="mt-1">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-black/42">Dirección</p>
                  <p className="mt-2 text-base font-medium text-black/84">{order.address?.line1 ?? 'Sin dirección'}</p>
                  <p className="mt-1">
                    {[order.address?.city, order.address?.province, order.address?.postalCode].filter(Boolean).join(', ')}
                  </p>
                  {order.address?.pinLabel ? <p className="mt-2 text-sm text-black/54">{order.address.pinLabel}</p> : null}
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Productos</h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => {
                  const exchangeRequest = 'exchangeRequests' in item ? item.exchangeRequests[0] : null

                  return (
                    <div key={item.id} className="flex items-start justify-between gap-4 rounded-[18px] border border-black/8 px-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-black/84">{item.productName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-black/46">
                          {item.colorName} · {item.size} · x{item.quantity}
                        </p>
                        {exchangeRequest ? (
                        <div className="mt-3 rounded-[16px] border border-sky-200 bg-sky-50 px-3 py-3 text-xs leading-6 text-sky-900">
                          <p>
                            Cambio solicitado: {exchangeRequest.currentSize} por {exchangeRequest.requestedSize} ·{' '}
                            {getExchangeStatusLabel(exchangeRequest.status)}
                          </p>
                          {exchangeRequest.status === 'REQUESTED' ? (
                            <p className="mt-1 text-sky-800">
                              Estamos esperando que el cliente confirme que ya despachó la prenda original.
                            </p>
                          ) : null}
                          {exchangeRequest.customerShipmentConfirmedAt ? (
                            <p className="mt-1 text-sky-800">
                              Cliente confirmó el envío el{' '}
                              {new Date(exchangeRequest.customerShipmentConfirmedAt).toLocaleString('es-AR')}
                              .
                            </p>
                          ) : null}
                          {exchangeRequest.replacementOrderId ? (
                            <p className="mt-1 text-sky-800">
                              Recambio generado:{' '}
                              <Link
                                href={`/admin/pedidos/${exchangeRequest.replacementOrderId}`}
                                className="font-semibold underline underline-offset-2"
                              >
                                ver pedido nuevo
                              </Link>
                              .
                            </p>
                          ) : null}
                          {exchangeRequest.status === 'CUSTOMER_SHIPMENT_CONFIRMED' ? (
                            <form action={createReplacementOrderFromExchangeAction} className="mt-3">
                              <input type="hidden" name="exchangeRequestId" value={exchangeRequest.id} />
                              <button className="rounded-full border border-sky-300 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-900 transition hover:bg-sky-900 hover:text-white">
                                Confirmar cambio y generar pedido nuevo
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ) : null}
                      </div>
                      <p className="font-semibold text-black/84">{formatPrice(item.totalPrice)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Estado</h2>
              <div className="mt-4 space-y-3 text-sm text-black/64">
                <div className="flex items-center justify-between">
                  <span>Estado orden</span>
                  <strong>{getOrderStateLabel(order.status)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado pago</span>
                  <strong>{getOrderStateLabel(order.paymentStatus)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Método pago</span>
                  <strong>{getOrderStateLabel(order.paymentMethod)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Método entrega</span>
                  <strong>{getShippingMethodLabel(order.shippingMethod)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado envío</span>
                  <strong>{getOrderStateLabel(order.shippingStatus)}</strong>
                </div>
                {order.trackingNumber ? (
                  <div className="flex items-center justify-between">
                    <span>Tracking</span>
                    <strong>{order.trackingNumber}</strong>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Resumen</h2>
              <div className="mt-4 space-y-3 text-sm text-black/64">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <strong>{formatPrice(order.subtotal)}</strong>
                </div>
                {order.discountAmount > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Descuentos automáticos</span>
                    <strong>-{formatPrice(order.discountAmount)}</strong>
                  </div>
                ) : null}
                {order.couponDiscountAmount > 0 ? (
                  <div className="flex items-center justify-between text-sky-700">
                    <span>Cupón {order.couponCode ?? ''}</span>
                    <strong>-{formatPrice(order.couponDiscountAmount)}</strong>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>Envío</span>
                  <strong>{formatPrice(order.shippingAmount)}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-black/8 pt-3 text-base text-black">
                  <span>Total</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Despacho Andreani</h2>
              <div className="mt-4 space-y-4 text-sm text-black/64">
                <form action={markOrderShippedWithTrackingAction} className="space-y-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    name="trackingNumber"
                    defaultValue={order.trackingNumber ?? ''}
                    placeholder="Código de seguimiento Andreani"
                    className="w-full rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
                  />
                  <button className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                    Marcar despachada
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  {order.trackingNumber ? (
                    <Link
                      href={`/seguimiento?code=${encodeURIComponent(order.trackingNumber)}`}
                      className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
                    >
                      Ver seguimiento interno
                    </Link>
                  ) : null}
                  <Link
                    href={andreaniTrackerUrl}
                    target="_blank"
                    className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
                  >
                    Abrir Andreani
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Acciones rápidas</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <form action={updateOrderStatusAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="nextStatus" value="READY_FOR_LOCAL_DELIVERY" />
                  <button className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                    Listo reparto local
                  </button>
                </form>
                <form action={updateOrderStatusAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="nextStatus" value="READY_FOR_NATIONAL_SHIPPING" />
                  <button className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                    Listo envío nacional
                  </button>
                </form>
                <form action={updateOrderStatusAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="nextStatus" value="OUT_FOR_DELIVERY" />
                  <button className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                    En reparto
                  </button>
                </form>
                <form action={updateOrderStatusAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="nextStatus" value="SHIPPED" />
                  <button className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                    Marcar enviado
                  </button>
                </form>
                <form action={updateOrderStatusAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="nextStatus" value="DELIVERED" />
                  <button className="rounded-full border border-black/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                    Marcar entregado
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
