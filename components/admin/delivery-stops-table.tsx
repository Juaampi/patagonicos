import { getOrderStateLabel } from '@/lib/server/fulfillment'
import { formatPrice } from '@/lib/utils'
import { DeliveryStopActions } from './delivery-stop-actions'

type DeliveryStopsTableProps = {
  stops: Array<{
    orderId: string
    orderNumber: string
    shortCode?: string | null
    stopOrder: number
    customerName: string
    phone: string | null
    address: string
    zone: string
    paymentMethod: string
    paymentStatus: string
    amountToCollect: number
    total: number
    status: string
    productsSummary: string
    mapsUrl: string
    orderUrl: string
    ticketUrl: string
    phoneUrl: string | null
    routeWhatsappUrl: string
    pinUrl: string
  }>
}

export function DeliveryStopsTable({ stops }: DeliveryStopsTableProps) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-4">
        <p className="eyebrow">Tabla de repartos</p>
      </div>

      {stops.length === 0 ? (
        <div className="px-6 py-8 text-sm text-black/56">No hay pedidos locales pendientes para repartir en esta fecha.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1420px] text-left text-sm">
            <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
              <tr>
                <th className="px-5 py-3 font-medium">Parada</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Direccion</th>
                <th className="px-5 py-3 font-medium">Pago</th>
                <th className="px-5 py-3 font-medium">Cobro</th>
                <th className="px-5 py-3 font-medium">Productos</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop) => (
                <tr key={stop.orderId} className="border-t border-black/8 align-top">
                  <td className="px-5 py-3">
                    <p className="font-medium text-black/84">#{stop.stopOrder}</p>
                    <p className="mt-1 text-xs text-black/45">{stop.shortCode ?? stop.orderNumber}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-black/84">{stop.customerName}</p>
                    <p className="mt-1 text-xs text-black/45">{stop.phone ?? 'Sin telefono'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-black/74">{stop.address}</p>
                    <p className="mt-1 text-xs text-black/45">{stop.zone}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-black/74">{getOrderStateLabel(stop.paymentMethod)}</p>
                    <p className="mt-1 text-xs text-black/45">{getOrderStateLabel(stop.paymentStatus)}</p>
                  </td>
                  <td className="px-5 py-3 font-medium text-black/82">
                    {stop.amountToCollect > 0 ? formatPrice(stop.amountToCollect) : 'Abonado'}
                    <p className="mt-1 text-xs font-normal text-black/45">Total {formatPrice(stop.total)}</p>
                  </td>
                  <td className="max-w-[260px] px-5 py-3 text-black/66">{stop.productsSummary}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-black/66">
                      {getOrderStateLabel(stop.status)}
                    </span>
                  </td>
                  <td className="min-w-[480px] px-5 py-3">
                    <DeliveryStopActions
                      orderId={stop.orderId}
                      orderUrl={stop.orderUrl}
                      ticketUrl={stop.ticketUrl}
                      mapsUrl={stop.mapsUrl}
                      phoneUrl={stop.phoneUrl}
                      defaultWhatsappUrl={stop.routeWhatsappUrl}
                      pinUrl={stop.pinUrl}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
