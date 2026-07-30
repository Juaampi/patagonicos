'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { markOrderCancelledAction, markOrderPaidAction, markOrderUnpaidAction, updateOrderStatusAction } from '@/lib/server/fulfillment-actions'
import { formatPrice } from '@/lib/utils'

export type AdminOrderRow = {
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
  whatsappCancelUrl?: string
  printJobs: Array<{ id: string; status: string; type: string }>
}

type FilterKey = 'ready' | 'pending' | 'paid' | 'all'

function getOrderStateLabel(status: string) {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    PAGADO: 'Pagado',
    PREPARANDO: 'Preparando',
    ENVIADO: 'Enviado',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
    PENDING_PAYMENT: 'Pendiente de pago',
    PAID: 'Pagado',
    AWAITING_PAYMENT_ON_DELIVERY: 'Pago contra entrega',
    READY_FOR_LOCAL_DELIVERY: 'Listo para reparto local',
    READY_FOR_NATIONAL_SHIPPING: 'Listo para envío nacional',
    OUT_FOR_DELIVERY: 'En reparto',
    SHIPPED: 'Despachado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazado',
    PENDING_ON_DELIVERY: 'Pendiente al entregar',
    ONLINE: 'Pagado online',
    CASH_ON_DELIVERY: 'Contra entrega',
    TRANSFER: 'Transferencia',
  }

  return labels[status] ?? status
}

function getShippingMethodLabel(method: string) {
  if (method === 'LOCAL_DELIVERY' || method === 'BARILOCHE_SAME_DAY') {
    return 'Local Bariloche'
  }

  return 'Envío nacional'
}

function isDeliveredStatus(status: string) {
  return status === 'ENTREGADO' || status === 'DELIVERED'
}

function isCancelledStatus(status: string) {
  return status === 'CANCELADO' || status === 'CANCELLED'
}

function isPaidStatus(paymentStatus: string) {
  return paymentStatus === 'PAID' || paymentStatus === 'APROBADO'
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

function getStatusBadgeClass(order: AdminOrderRow) {
  if (isCancelledStatus(order.status)) {
    return 'border-red-200 bg-red-50 text-red-700'
  }
  if (isDeliveredStatus(order.status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (isPaidStatus(order.paymentStatus) && !isShippedStatus(order.status, order.shippingStatus)) {
    return 'border-sky-200 bg-sky-50 text-sky-800'
  }
  if (!isPaidStatus(order.paymentStatus)) {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border-black/10 bg-[#f4f1eb] text-black/68'
}

function matchesFilter(order: AdminOrderRow, filter: FilterKey) {
  const paid = isPaidStatus(order.paymentStatus)
  const shipped = isShippedStatus(order.status, order.shippingStatus)
  const delivered = isDeliveredStatus(order.status)
  const cancelled = isCancelledStatus(order.status)

  if (filter === 'ready') {
    return paid && !shipped && !delivered && !cancelled
  }

  if (filter === 'pending') {
    return !paid && !delivered && !cancelled
  }

  if (filter === 'paid') {
    return paid && !cancelled
  }

  return true
}

function getQuickAction(order: AdminOrderRow) {
  if (isCancelledStatus(order.status) || isDeliveredStatus(order.status)) {
    return null
  }

  if (order.shippingMethod === 'LOCAL_DELIVERY' || order.shippingMethod === 'BARILOCHE_SAME_DAY') {
    if (order.status !== 'OUT_FOR_DELIVERY') {
      return { label: 'Mandar a reparto', nextStatus: 'OUT_FOR_DELIVERY' }
    }
  } else if (order.status !== 'SHIPPED') {
    return { label: 'Marcar despachado', nextStatus: 'SHIPPED' }
  }

  return { label: 'Marcar entregado', nextStatus: 'DELIVERED' }
}

const FILTERS: Array<{ key: FilterKey; label: string; helper: string }> = [
  { key: 'ready', label: 'Por despachar', helper: 'Pagados y todavía no enviados' },
  { key: 'pending', label: 'Pendientes', helper: 'Sin pago confirmado' },
  { key: 'paid', label: 'Pagados', helper: 'Todos los pagos acreditados' },
  { key: 'all', label: 'Todos', helper: 'Sin filtrar' },
]

export function AdminOrdersTableClient({ orders }: { orders: AdminOrderRow[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ready')
  const [search, setSearch] = useState('')

  const counters = useMemo(
    () => ({
      ready: orders.filter((order) => matchesFilter(order, 'ready')).length,
      pending: orders.filter((order) => matchesFilter(order, 'pending')).length,
      paid: orders.filter((order) => matchesFilter(order, 'paid')).length,
      all: orders.length,
    }),
    [orders],
  )

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      if (!matchesFilter(order, activeFilter)) {
        return false
      }

      if (!query) {
        return true
      }

      const searchableFields = [
        order.shortCode,
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.city,
        order.trackingNumber,
      ]

      return searchableFields.some((field) => field?.toLowerCase().includes(query))
    })
  }, [activeFilter, orders, search])

  return (
    <div className="px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-col gap-4 rounded-[26px] border border-black/8 bg-[linear-gradient(180deg,#fcfbf9_0%,#f5f1ea_100%)] px-4 py-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.key === activeFilter
            const count = counters[filter.key]

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-black bg-black text-white shadow-[0_16px_30px_rgba(0,0,0,0.14)]'
                    : 'border-black/10 bg-white text-black/74 hover:border-black/20 hover:bg-black/3'
                }`}
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em]">{filter.label}</span>
                <span className={`mt-1 block text-sm ${isActive ? 'text-white/78' : 'text-black/48'}`}>
                  {count} pedidos · {filter.helper}
                </span>
              </button>
            )
          })}
        </div>

        <label className="block w-full md:max-w-sm">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Buscar pedido</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código, cliente, teléfono, ciudad o tracking"
            className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-black/84 outline-none transition placeholder:text-black/32 focus:border-black/25"
          />
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-[26px] border border-black/8 bg-white">
        <div className="flex items-center justify-between border-b border-black/8 px-5 py-4 text-sm text-black/56">
          <p>{filteredOrders.length} pedidos visibles</p>
          <p className="hidden md:block">La vista arranca en pagos pendientes de despacho</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f7f4ef] text-[11px] uppercase tracking-[0.16em] text-black/48">
              <tr>
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Entrega</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-black/52">
                    No hay pedidos para este filtro.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const quickAction = getQuickAction(order)

                  return (
                    <tr key={order.id} className="border-t border-black/8 align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-black/84">{order.shortCode ?? order.orderNumber}</p>
                        <p className="mt-1 text-xs text-black/46">{order.orderNumber}</p>
                        <p className="mt-2 text-xs text-black/46">
                          {new Date(order.createdAt).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-black/82">{order.customerName}</p>
                        <p className="mt-1 text-xs text-black/46">{order.customerPhone ?? 'Sin teléfono'}</p>
                        <p className="mt-1 text-xs text-black/46">{order.city ?? 'Sin ciudad'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getStatusBadgeClass(order)}`}>
                          {getOrderStateLabel(order.status)}
                        </span>
                        <p className="mt-2 text-sm text-black/72">{getOrderStateLabel(order.paymentStatus)}</p>
                        <p className="mt-1 text-xs text-black/46">{getOrderStateLabel(order.paymentMethod)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-black/74">{getShippingMethodLabel(order.shippingMethod)}</p>
                        <p className="mt-1 text-xs text-black/46">{getOrderStateLabel(order.shippingStatus)}</p>
                        {order.trackingNumber ? <p className="mt-1 text-xs text-black/46">Tracking: {order.trackingNumber}</p> : null}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-black/84">{formatPrice(order.total)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/pedidos/${order.id}`}
                            className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/74 transition hover:bg-black hover:text-white"
                          >
                            Ver detalle
                          </Link>
                          <Link
                            href={`/admin/pedidos/${order.id}/ticket`}
                            className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/74 transition hover:bg-black hover:text-white"
                          >
                            Ticket
                          </Link>
                          {order.pinUrl ? (
                            <Link
                              href={order.pinUrl}
                              target="_blank"
                              className="rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/74 transition hover:bg-black hover:text-white"
                            >
                              Ver pin
                            </Link>
                          ) : null}
                          {quickAction ? (
                            <form action={updateOrderStatusAction}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="nextStatus" value={quickAction.nextStatus} />
                              <button className="rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-800 transition hover:bg-sky-700 hover:text-white">
                                {quickAction.label}
                              </button>
                            </form>
                          ) : null}
                          {!isCancelledStatus(order.status) ? (
                            <form action={markOrderCancelledAction}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <button className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-600 hover:text-white">
                                Cancelar
                              </button>
                            </form>
                          ) : null}
                          {isPaidStatus(order.paymentStatus) ? (
                            <form action={markOrderUnpaidAction}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <button className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800 transition hover:bg-amber-500 hover:text-white">
                                Volver pendiente
                              </button>
                            </form>
                          ) : (
                            <form action={markOrderPaidAction}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <button className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 transition hover:bg-emerald-600 hover:text-white">
                                Marcar pagado
                              </button>
                            </form>
                          )}
                          {!isDeliveredStatus(order.status) ? (
                            <form action={updateOrderStatusAction}>
                              <input type="hidden" name="orderId" value={order.id} />
                              <input type="hidden" name="nextStatus" value="DELIVERED" />
                              <button className="rounded-full border border-black/10 bg-[#f4f1eb] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white">
                                Entregado
                              </button>
                            </form>
                          ) : null}
                          {order.whatsappVisitTodayUrl ? (
                            <Link
                              href={order.whatsappVisitTodayUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 transition hover:bg-emerald-600 hover:text-white"
                            >
                              WPP hoy
                            </Link>
                          ) : null}
                          {order.whatsappOutsideUrl ? (
                            <Link
                              href={order.whatsappOutsideUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-amber-200 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800 transition hover:bg-amber-500 hover:text-white"
                            >
                              WPP afuera
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
