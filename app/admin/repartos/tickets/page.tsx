import Link from 'next/link'
import { getDeliveriesPageSnapshot } from '@/lib/server/delivery'

export const dynamic = 'force-dynamic'

export default async function AdminDeliveryTicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const snapshot = await getDeliveriesPageSnapshot(params?.date)

  return (
    <div className="space-y-6">
      <div className="card-surface p-7">
        <p className="eyebrow">Tickets de reparto</p>
        <h2 className="mt-4 font-display text-4xl tracking-[-0.05em]">Abrir e imprimir pedidos del recorrido</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black/58">
          Primera version practica: cada ticket interno abre en una pestaña lista para imprimir desde navegador.
        </p>
      </div>

      <div className="grid gap-4">
        {snapshot.stops.map((stop) => (
          <div key={stop.orderId} className="card-surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Parada #{stop.stopOrder}</p>
              <h3 className="mt-2 text-xl font-semibold text-black/88">{stop.customerName}</h3>
              <p className="mt-1 text-sm text-black/58">{stop.address}</p>
            </div>
            <Link
              href={stop.ticketUrl}
              target="_blank"
              className="rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/82"
            >
              Abrir ticket
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
