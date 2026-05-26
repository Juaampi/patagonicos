import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: {
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        include: {
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  return (
    <div className="card-surface p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">{customer.fullName ?? 'Sin nombre'}</h1>
          <p className="mt-3 text-sm text-black/58">{customer.email}</p>
        </div>
        <Link
          href={`/perfil?email=${encodeURIComponent(customer.email)}`}
          className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
        >
          Ver perfil publico
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-black/8 p-5">
            <h2 className="text-lg font-semibold text-black/82">Contacto</h2>
            <div className="mt-4 space-y-3 text-sm text-black/64">
              <div className="flex items-center justify-between"><span>Telefono</span><strong>{customer.phone ?? 'Sin telefono'}</strong></div>
              <div className="flex items-center justify-between"><span>WhatsApp</span><strong>{customer.whatsappOptIn ? 'Habilitado' : 'No confirmado'}</strong></div>
              <div className="flex items-center justify-between"><span>Pedidos</span><strong>{customer.orders.length}</strong></div>
              <div className="flex items-center justify-between"><span>Total</span><strong>{formatPrice(customer.orders.reduce((total, order) => total + order.total, 0))}</strong></div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/8 p-5">
            <h2 className="text-lg font-semibold text-black/82">Direcciones</h2>
            <div className="mt-4 space-y-3">
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-black/52">Sin direcciones cargadas.</p>
              ) : (
                customer.addresses.map((address) => (
                  <div key={address.id} className="rounded-[18px] border border-black/8 px-4 py-4 text-sm text-black/62">
                    <p className="font-medium text-black/84">{address.line1}</p>
                    <p className="mt-1">{[address.city, address.province, address.postalCode].filter(Boolean).join(', ')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-black/8 p-5">
          <h2 className="text-lg font-semibold text-black/82">Pedidos</h2>
          <div className="mt-4 overflow-x-auto rounded-[20px] border border-black/8">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-t border-black/8">
                    <td className="px-4 py-3 font-medium text-black/84">{order.shortCode ?? order.orderNumber}</td>
                    <td className="px-4 py-3 text-black/62">{order.status}</td>
                    <td className="px-4 py-3 text-black/62">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 text-black/52">{new Date(order.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
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
        </div>
      </div>
    </div>
  )
}
