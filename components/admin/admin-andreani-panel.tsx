import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { getOrderStateLabel } from '@/lib/server/fulfillment'

type AdminAndreaniPanelProps = {
  trackerUrl: string
  readyToExport: Array<{
    id: string
    orderNumber: string
    shortCode?: string
    createdAt: string
    customerName: string
    city: string
    province: string
    total: number
    totalUnits: number
    totalWeightGrams: number
  }>
  missingData: Array<{
    id: string
    orderNumber: string
    shortCode?: string
    customerName: string
    missingFields: string[]
  }>
  dispatched: Array<{
    id: string
    orderNumber: string
    shortCode?: string
    customerName: string
    trackingNumber?: string
    shippingStatus: string
  }>
}

export function AdminAndreaniPanel({
  trackerUrl,
  readyToExport,
  missingData,
  dispatched,
}: AdminAndreaniPanelProps) {
  return (
    <div className="space-y-6">
      <section className="card-surface overflow-hidden">
        <div className="border-b border-black/10 px-6 py-4">
          <p className="eyebrow">Andreani</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-black/52">
            <span>{readyToExport.length} listos</span>
            <span>{missingData.length} con faltantes</span>
            <span>{dispatched.length} despachados</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 px-6 py-5">
          <Link href="/admin/envios/andreani-export" className="button-primary">
            Descargar plantilla Andreani
          </Link>
          <Link href={trackerUrl} target="_blank" className="button-secondary">
            Abrir buscador Andreani
          </Link>
        </div>
      </section>

      <section className="card-surface overflow-hidden">
        <div className="border-b border-black/10 px-6 py-4">
          <p className="eyebrow">Sin despachar</p>
        </div>
        {readyToExport.length === 0 ? (
          <div className="px-6 py-6 text-sm text-black/52">No hay pedidos listos para exportar ahora mismo.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Destino</th>
                  <th className="px-5 py-3 font-medium">Bultos</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {readyToExport.map((shipment) => (
                  <tr key={shipment.id} className="border-t border-black/8 align-middle">
                    <td className="px-5 py-3">
                      <p className="font-medium text-black/84">{shipment.shortCode ?? shipment.orderNumber}</p>
                      <p className="mt-1 text-xs text-black/45">{new Date(shipment.createdAt).toLocaleDateString('es-AR')}</p>
                    </td>
                    <td className="px-5 py-3 text-black/72">{shipment.customerName}</td>
                    <td className="px-5 py-3 text-black/72">{shipment.city}, {shipment.province}</td>
                    <td className="px-5 py-3 text-black/72">{shipment.totalUnits} u. · {shipment.totalWeightGrams} gr</td>
                    <td className="px-5 py-3 font-medium text-black/82">{formatPrice(shipment.total)}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/pedidos/${shipment.id}`}
                        className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                      >
                        Ver pedido
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-surface overflow-hidden">
        <div className="border-b border-black/10 px-6 py-4">
          <p className="eyebrow">Faltan datos</p>
        </div>
        {missingData.length === 0 ? (
          <div className="px-6 py-6 text-sm text-black/52">No hay pedidos bloqueados por datos faltantes.</div>
        ) : (
          <div className="space-y-3 px-6 py-5">
            {missingData.map((shipment) => (
              <div key={shipment.id} className="rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-900">{shipment.shortCode ?? shipment.orderNumber} · {shipment.customerName}</p>
                    <p className="mt-2 text-sm text-amber-800">{shipment.missingFields.join(' · ')}</p>
                  </div>
                  <Link
                    href={`/admin/pedidos/${shipment.id}`}
                    className="rounded-full border border-amber-300 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900 transition hover:bg-amber-100"
                  >
                    Completar pedido
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-surface overflow-hidden">
        <div className="border-b border-black/10 px-6 py-4">
          <p className="eyebrow">Despachados</p>
        </div>
        {dispatched.length === 0 ? (
          <div className="px-6 py-6 text-sm text-black/52">Todavía no hay pedidos despachados por Andreani.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Pedido</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Tracking</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dispatched.map((shipment) => (
                  <tr key={shipment.id} className="border-t border-black/8 align-middle">
                    <td className="px-5 py-3 font-medium text-black/84">{shipment.shortCode ?? shipment.orderNumber}</td>
                    <td className="px-5 py-3 text-black/72">{shipment.customerName}</td>
                    <td className="px-5 py-3 text-black/72">{shipment.trackingNumber ?? 'Sin tracking'}</td>
                    <td className="px-5 py-3 text-black/72">{getOrderStateLabel(shipment.shippingStatus)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/pedidos/${shipment.id}`}
                          className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                        >
                          Ver pedido
                        </Link>
                        {shipment.trackingNumber ? (
                          <Link
                            href={`/seguimiento?code=${encodeURIComponent(shipment.trackingNumber)}`}
                            className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                          >
                            Ver seguimiento
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
