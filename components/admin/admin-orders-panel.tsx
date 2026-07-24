import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { getOrderStateLabel, getShippingMethodLabel, isCancelledStatus, isDeliveredStatus } from '@/lib/server/fulfillment'
import { markOrderPaidAction, updateOrderStatusAction } from '@/lib/server/fulfillment-actions'

type AdminOrdersPanelProps = {
  orders: Array<{
    id: string
    orderNumber: string
    shortCode?: string
    status: string
    paymentStatus: string
    paymentMethod: string
    shippingMethod: string
    shippingStatus: string
    total: number
    createdAt: string
    customerName: string
    customerPhone?: string
    city?: string
    trackingNumber?: string
    pinUrl?: string
    whatsappVisitTodayUrl?: string
    whatsappOutsideUrl?: string
    printJobs: Array<{ id: string; status: string; type: string }>
  }>
}

export function AdminOrdersPanel({ orders }: AdminOrdersPanelProps) {
  const pendingCount = orders.filter((order) => !isDeliveredStatus(order.status) && !isCancelledStatus(order.status)).length
  const localCount = orders.filter((order) => order.shippingMethod === 'LOCAL_DELIVERY' && !isDeliveredStatus(order.status)).length
  const codCount = orders.filter((order) => order.paymentMethod === 'CASH_ON_DELIVERY').length

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-4">
      <p className="eyebrow">Fulfillment</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-black/50">
          <span>{orders.length} pedidos</span>
          <span>{pendingCount} abiertos</span>
          <span>{localCount} locales</span>
          <span>{codCount} contra entrega</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
            <tr>
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Entrega</th>
              <th className="px-5 py-3 font-medium">Pago</th>
              <th className="px-5 py-3 font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-black/8 align-middle">
                <td className="px-5 py-3">
                  <p className="font-medium text-black/84">{order.shortCode ?? order.orderNumber}</p>
                  <p className="mt-1 text-xs text-black/45">{new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-black/82">{order.customerName}</p>
                  <p className="mt-1 text-xs text-black/45">{order.customerPhone ?? order.city ?? 'Sin dato'}</p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-black/74">{getShippingMethodLabel(order.shippingMethod)}</p>
                  <p className="mt-1 text-xs text-black/45">{getOrderStateLabel(order.status)}</p>
                  {order.trackingNumber ? <p className="mt-1 text-xs text-black/45">Tracking: {order.trackingNumber}</p> : null}
                </td>
                <td className="px-5 py-3">
                  <p className="text-black/74">{getOrderStateLabel(order.paymentStatus)}</p>
                  <p className="mt-1 text-xs text-black/45">{getOrderStateLabel(order.paymentMethod)}</p>
                </td>
                <td className="px-5 py-3 font-medium text-black/82">{formatPrice(order.total)}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                    >
                      Ver
                    </Link>
                    {order.pinUrl ? (
                      <Link
                        href={order.pinUrl}
                        target="_blank"
                        className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                      >
                        Ver pin
                      </Link>
                    ) : null}
                    {order.whatsappVisitTodayUrl ? (
                      <Link
                        href={order.whatsappVisitTodayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 transition hover:bg-emerald-600 hover:text-white"
                      >
                        WPP hoy
                      </Link>
                    ) : null}
                    {order.whatsappOutsideUrl ? (
                      <Link
                        href={order.whatsappOutsideUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800 transition hover:bg-amber-500 hover:text-white"
                      >
                        WPP afuera
                      </Link>
                    ) : null}
                    {order.paymentStatus !== 'PAID' ? (
                      <form action={markOrderPaidAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white">
                          Pagado
                        </button>
                      </form>
                    ) : null}
                    {!isDeliveredStatus(order.status) ? (
                      <form action={updateOrderStatusAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="nextStatus" value="DELIVERED" />
                        <button className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white">
                          Entregado
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
