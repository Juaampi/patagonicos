import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { DeliveryCopyLinkButton } from './delivery-copy-link-button'

type DeliveryRouteSummaryProps = {
  selectedDateValue: string
  todayDateValue: string
  totalStops: number
  cashOnDeliveryCount: number
  totalToCollect: number
  routeBatches: Array<{
    id: string
    label: string
    stopCount: number
    url: string
    stops: Array<{
      stopOrder: number
      customerName: string
      address: string
    }>
  }>
}

export function DeliveryRouteSummary({
  selectedDateValue,
  todayDateValue,
  totalStops,
  cashOnDeliveryCount,
  totalToCollect,
  routeBatches,
}: DeliveryRouteSummaryProps) {
  const primaryMapsUrl = routeBatches[0]?.url

  return (
    <div className="card-surface p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="eyebrow">Repartos</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-black/50">
            <span>{totalStops} de hoy</span>
            <span>{cashOnDeliveryCount} contra entrega</span>
            <span>{formatPrice(totalToCollect)} a cobrar</span>
          </div>
        </div>

        <form action="/admin/repartos" className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={selectedDateValue}
            className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm text-black/74 outline-none"
          />
          <button className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
            Ver fecha
          </button>
          <Link href={`/admin/repartos?date=${todayDateValue}`} className="rounded-full bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/82">
            Ver repartos de hoy
          </Link>
          {primaryMapsUrl ? (
            <Link href={primaryMapsUrl} target="_blank" className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-black/74 transition hover:bg-black hover:text-white">
              Ver recorrido de hoy
            </Link>
          ) : null}
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {primaryMapsUrl ? <DeliveryCopyLinkButton url={primaryMapsUrl} /> : null}
        <Link
          href={`/admin/repartos/tickets?date=${selectedDateValue}`}
          className="rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-black/74 transition hover:bg-black hover:text-white"
        >
          Imprimir tickets
        </Link>
      </div>

      {routeBatches.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {routeBatches.map((batch) => (
            <div key={batch.id} className="rounded-[22px] border border-black/8 bg-[#fafaf8] p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">{batch.label}</p>
                  <p className="mt-2 text-sm text-black/62">{batch.stopCount} paradas</p>
                </div>
                <Link
                  href={batch.url}
                  target="_blank"
                  className="inline-flex rounded-full bg-black px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/82"
                >
                  Abrir en Google Maps
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {batch.stops.map((stop) => (
                  <span
                    key={`${batch.id}-${stop.stopOrder}`}
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-black/68"
                  >
                    #{stop.stopOrder} {stop.customerName} · {stop.address}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
