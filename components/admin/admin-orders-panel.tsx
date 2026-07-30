import { formatPrice } from '@/lib/utils'
import { AdminOrdersTableClient, type AdminOrderRow } from '@/components/admin/admin-orders-table-client'

type AdminOrdersPanelProps = {
  orders: AdminOrderRow[]
}

function isCancelledStatus(status: string) {
  return status === 'CANCELADO' || status === 'CANCELLED'
}

function isDeliveredStatus(status: string) {
  return status === 'ENTREGADO' || status === 'DELIVERED'
}

function isShippedStatus(status: string, shippingStatus: string) {
  return (
    status === 'ENVIADO' ||
    status === 'SHIPPED' ||
    status === 'OUT_FOR_DELIVERY' ||
    shippingStatus === 'DESPACHADO' ||
    shippingStatus === 'EN_TRANSITO' ||
    shippingStatus === 'EN_SUCURSAL' ||
    shippingStatus === 'ENTREGADO'
  )
}

function isPaidStatus(paymentStatus: string) {
  return paymentStatus === 'PAID' || paymentStatus === 'APROBADO'
}

export function AdminOrdersPanel({ orders }: AdminOrdersPanelProps) {
  const readyToShipOrders = orders.filter(
    (order) =>
      isPaidStatus(order.paymentStatus) &&
      !isCancelledStatus(order.status) &&
      !isDeliveredStatus(order.status) &&
      !isShippedStatus(order.status, order.shippingStatus),
  )
  const pendingOrders = orders.filter(
    (order) => !isPaidStatus(order.paymentStatus) && !isCancelledStatus(order.status) && !isDeliveredStatus(order.status),
  )
  const paidOrders = orders.filter((order) => isPaidStatus(order.paymentStatus) && !isCancelledStatus(order.status))
  const openTotal = readyToShipOrders.reduce((total, order) => total + order.total, 0)

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-5">
        <p className="eyebrow">Pedidos</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(135deg,#f4fbf6_0%,#e9f7ee_100%)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800/70">Listos para despachar</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">{readyToShipOrders.length}</p>
            <p className="mt-1 text-sm text-emerald-900/70">{formatPrice(openTotal)} por preparar</p>
          </div>
          <div className="rounded-[22px] border border-amber-200 bg-[linear-gradient(135deg,#fff8ee_0%,#fff1db_100%)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800/70">Pendientes</p>
            <p className="mt-2 text-2xl font-semibold text-amber-950">{pendingOrders.length}</p>
            <p className="mt-1 text-sm text-amber-900/70">Todavía sin pago confirmado</p>
          </div>
          <div className="rounded-[22px] border border-sky-200 bg-[linear-gradient(135deg,#f1f8ff_0%,#e8f2ff_100%)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-800/70">Pagados</p>
            <p className="mt-2 text-2xl font-semibold text-sky-950">{paidOrders.length}</p>
            <p className="mt-1 text-sm text-sky-900/70">Incluye despachados y entregados</p>
          </div>
          <div className="rounded-[22px] border border-black/10 bg-[linear-gradient(135deg,#faf8f5_0%,#f4f1eb_100%)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/52">Total pedidos</p>
            <p className="mt-2 text-2xl font-semibold text-black/88">{orders.length}</p>
            <p className="mt-1 text-sm text-black/54">Vista filtrable para operar más rápido</p>
          </div>
        </div>
      </div>

      <AdminOrdersTableClient orders={orders} />
    </div>
  )
}
