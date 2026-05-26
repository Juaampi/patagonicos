import { getOrderStateLabel } from '@/lib/server/fulfillment'
import { formatPrice } from '@/lib/utils'
import { DeliveryStopActions } from './delivery-stop-actions'

type DeliveryStopCardProps = {
  stop: {
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
    notes: string | null
    products: Array<{
      id: string
      productName: string
      quantity: number
      colorName: string
      size: string
    }>
    mapsUrl: string
    pinUrl: string
    orderUrl: string
    ticketUrl: string
    phoneUrl: string | null
    routeWhatsappUrl: string
  }
}

export function DeliveryStopCard({ stop }: DeliveryStopCardProps) {
  return (
    <article className="card-surface p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              #{stop.stopOrder}
            </span>
            <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-black/56">
              {getOrderStateLabel(stop.status)}
            </span>
            <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-black/56">
              {stop.shortCode ?? stop.orderNumber}
            </span>
          </div>

          <h3 className="mt-4 font-display text-3xl tracking-[-0.05em] text-black/90">{stop.customerName}</h3>
          <p className="mt-2 text-base text-black/68">{stop.address}</p>
          <p className="mt-1 text-sm uppercase tracking-[0.16em] text-black/46">{stop.zone}</p>
          <p className="mt-2 text-sm text-black/58">{stop.phone ?? 'Telefono no cargado'}</p>
        </div>

        <div className="grid gap-3 rounded-[24px] border border-black/8 bg-[#f8f8f5] p-4 text-sm text-black/64 md:grid-cols-2 xl:min-w-[360px]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Pago</p>
            <p className="mt-2 font-medium text-black/84">{getOrderStateLabel(stop.paymentMethod)}</p>
            <p className="mt-1 text-xs text-black/48">{getOrderStateLabel(stop.paymentStatus)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Cobro</p>
            <p className="mt-2 font-medium text-black/84">
              {stop.amountToCollect > 0 ? formatPrice(stop.amountToCollect) : 'Pedido abonado'}
            </p>
            <p className="mt-1 text-xs text-black/48">Total pedido {formatPrice(stop.total)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-black/8 bg-[#fafaf7] p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Productos</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {stop.products.map((product) => (
            <span
              key={product.id}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/72"
            >
              {product.productName} x{product.quantity} · {product.colorName} · {product.size}
            </span>
          ))}
        </div>
      </div>

      {stop.notes ? (
        <div className="mt-4 rounded-[18px] border border-black/8 bg-white px-4 py-4 text-sm text-black/60">
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Observaciones</p>
          <p className="mt-2">{stop.notes}</p>
        </div>
      ) : null}

      <div className="mt-5">
        <DeliveryStopActions
          orderId={stop.orderId}
          orderUrl={stop.orderUrl}
          ticketUrl={stop.ticketUrl}
          mapsUrl={stop.mapsUrl}
          pinUrl={stop.pinUrl}
          phoneUrl={stop.phoneUrl}
          defaultWhatsappUrl={stop.routeWhatsappUrl}
        />
      </div>
    </article>
  )
}
