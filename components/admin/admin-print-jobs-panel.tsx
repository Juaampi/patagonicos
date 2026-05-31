import Link from 'next/link'
import { getOrderStateLabel } from '@/lib/server/fulfillment'
import { updatePrintJobStatusAction } from '@/lib/server/fulfillment-actions'

type AdminPrintJobsPanelProps = {
  printJobs: Array<{
    id: string
    orderId: string
    type: string
    status: string
    fileUrl?: string
    createdAt: string
    printedAt?: string
    orderShortCode?: string
    customerName: string
  }>
}

export function AdminPrintJobsPanel({ printJobs }: AdminPrintJobsPanelProps) {
  const pendingJobs = printJobs.filter((job) => job.status === 'PENDING')
  const failedJobs = printJobs.filter((job) => job.status === 'FAILED')

  return (
    <div id="impresion" className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-4">
        <p className="eyebrow">Envios</p>
        <div className="mt-3 flex gap-3 text-[11px] uppercase tracking-[0.14em] text-black/52">
          <span>{pendingJobs.length} pendientes</span>
          <span>{failedJobs.length} fallidos</span>
        </div>
      </div>

      {printJobs.length === 0 ? (
        <div className="px-5 py-6 text-sm text-black/46">Todavía no hay tickets ni etiquetas en cola.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
              <tr>
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {printJobs.map((job) => (
                <tr key={job.id} className="border-t border-black/8 align-middle">
                  <td className="px-5 py-3 font-medium text-black/84">{job.orderShortCode ?? 'Sin codigo'}</td>
                  <td className="px-5 py-3 text-black/66">{job.customerName}</td>
                  <td className="px-5 py-3 text-black/66">{job.type}</td>
                  <td className="px-5 py-3 text-black/66">{getOrderStateLabel(job.status)}</td>
                  <td className="px-5 py-3 text-black/52">{new Date(job.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/pedidos/${job.orderId}`}
                        className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                      >
                        Ver
                      </Link>
                      {job.fileUrl ? (
                        <Link
                          href={job.fileUrl}
                          className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                        >
                          Imprimir
                        </Link>
                      ) : null}
                      <form action={updatePrintJobStatusAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="nextStatus" value="PRINTED" />
                        <button className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white">
                          Impreso
                        </button>
                      </form>
                    </div>
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
