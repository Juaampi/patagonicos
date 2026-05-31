import Link from 'next/link'

type AdminCustomersPanelProps = {
  customers: Array<{
    id: string
    fullName?: string | null
    email: string
    phone?: string | null
    whatsappOptIn: boolean
    orderCount: number
    totalSpent: number
    lastOrderAt?: string
  }>
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AdminCustomersPanel({ customers }: AdminCustomersPanelProps) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-4">
        <p className="eyebrow">Clientes</p>
        <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-black/50">{customers.length} clientes</div>
      </div>

      <div>
        {customers.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/12 px-5 py-6 text-sm text-black/46">
            Todavia no hay clientes cargados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Telefono</th>
                  <th className="px-5 py-3 font-medium">Pedidos</th>
                  <th className="px-5 py-3 font-medium">Facturacion</th>
                  <th className="px-5 py-3 font-medium">Ultimo</th>
                  <th className="px-5 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-black/8 align-middle">
                    <td className="px-5 py-3">
                      <p className="font-medium text-black/84">{customer.fullName ?? 'Sin nombre'}</p>
                      <p className="mt-1 text-xs text-black/48">{customer.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-black/74">{customer.phone ?? 'Sin telefono'}</p>
                      <p className="mt-1 text-xs text-black/45">{customer.whatsappOptIn ? 'WhatsApp ok' : 'WhatsApp no'}</p>
                    </td>
                    <td className="px-5 py-3 font-medium text-black/82">{customer.orderCount}</td>
                    <td className="px-5 py-3 font-medium text-black/82">{formatPrice(customer.totalSpent)}</td>
                    <td className="px-5 py-3 text-black/62">
                      {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('es-AR') : 'Sin compras'}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
