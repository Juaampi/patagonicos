import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

type AdminDashboardOverviewProps = {
  metrics: {
    activeProducts: number
    pendingOrders: number
    localDeliveries: number
    nationalShipments: number
    cashOnDelivery: number
    queuedPrintJobs: number
    totalPendingRevenue: number
  }
}

export function AdminDashboardOverview({ metrics }: AdminDashboardOverviewProps) {
  const cards = [
    { label: 'Productos activos', value: metrics.activeProducts, href: '/admin/productos' },
    { label: 'Pedidos pendientes', value: metrics.pendingOrders, href: '/admin/pedidos' },
    { label: 'Repartos locales', value: metrics.localDeliveries, href: '/admin/repartos' },
    { label: 'Envios nacionales', value: metrics.nationalShipments, href: '/admin/envios' },
    { label: 'Contra entrega', value: metrics.cashOnDelivery, href: '/admin/repartos' },
    { label: 'Cola impresion', value: metrics.queuedPrintJobs, href: '/admin/envios' },
  ]

  return (
    <>
      <div className="card-surface overflow-hidden">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(249,250,244,1),rgba(240,241,234,0.92)_38%,rgba(255,255,255,1)_100%)] px-7 py-7">
          <p className="eyebrow">Vista general</p>
          <h2 className="mt-4 font-display text-5xl tracking-[-0.06em] text-black/92">Operacion diaria de tienda</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-black/60">
            Navegacion modular para separar catalogo, pedidos, envios y reparto local sin mezclar tareas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/admin/repartos" className="button-primary">
              Abrir repartos
            </Link>
            <Link href="/admin/productos/nuevo" className="button-secondary">
              Agregar producto
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card-surface rounded-[24px] p-5 transition hover:-translate-y-0.5">
            <p className="text-xs uppercase tracking-[0.18em] text-black/42">{card.label}</p>
            <p className="mt-4 font-display text-4xl tracking-[-0.05em] text-black/88">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="card-surface p-7">
        <p className="eyebrow">Caja pendiente</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="mt-4 font-display text-4xl tracking-[-0.05em] text-black/88">
              {formatPrice(metrics.totalPendingRevenue)}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-black/58">
              Total comprometido en pedidos abiertos, incluyendo entregas pendientes y contra entrega.
            </p>
          </div>
          <Link
            href="/admin/pedidos"
            className="rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/74 transition hover:bg-black hover:text-white"
          >
            Revisar pedidos
          </Link>
        </div>
      </div>
    </>
  )
}
