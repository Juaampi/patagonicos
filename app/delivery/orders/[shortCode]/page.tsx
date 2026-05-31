import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { normalizeWhatsAppPhone } from '@/lib/contact-utils'
import { buildWhatsAppOrderMessage, getOrderStateLabel, getShippingMethodLabel } from '@/lib/server/fulfillment'
import { markOrderPaidAction, updateOrderStatusAction } from '@/lib/server/fulfillment-actions'
import { requireInternalAccess } from '@/lib/server/internal-access'

export const dynamic = 'force-dynamic'

export default async function DeliveryOrderPage({ params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = await params
  await requireInternalAccess(`/delivery/orders/${shortCode}`)

  const order = await prisma.order.findFirst({
    where: { shortCode },
    include: {
      customer: true,
      address: true,
      items: true,
    },
  })

  if (!order) {
    notFound()
  }

  const mapsQuery = encodeURIComponent(
    [order.address?.line1, order.address?.city, order.address?.province, order.address?.postalCode].filter(Boolean).join(', '),
  )
  const googleMapsLink =
    order.address?.latitude != null && order.address?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${order.address.latitude},${order.address.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
  const whatsappPhone = normalizeWhatsAppPhone(order.customer.phone ?? '')
  const whatsappMessage = encodeURIComponent(
    buildWhatsAppOrderMessage({
      shortCode: order.shortCode,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingMethod: order.shippingMethod,
    }),
  )

  return (
    <section className="shell pb-10 pt-32">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="card-surface p-6">
          <p className="eyebrow">Pedido interno</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">{order.shortCode}</h1>
          <p className="mt-3 text-sm text-black/58">{getShippingMethodLabel(order.shippingMethod)}</p>
        </div>

        <div className="card-surface p-6">
          <div className="grid gap-4 text-sm text-black/64 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/42">Cliente</p>
              <p className="mt-2 text-base font-medium text-black/84">{order.customer.fullName ?? order.customer.email}</p>
              <p className="mt-1">{order.customer.phone ?? 'Sin teléfono'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-black/42">Entrega</p>
              <p className="mt-2">{order.address?.line1 ?? 'Sin dirección'}</p>
              <p className="mt-1">{[order.address?.city, order.address?.province].filter(Boolean).join(', ')}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href={`tel:${order.customer.phone ?? ''}`} className="rounded-[18px] border border-black/10 px-4 py-3 text-center text-sm font-medium text-black/76">
              Llamar cliente
            </Link>
            {order.whatsappOptIn && whatsappPhone ? (
              <Link href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`} className="rounded-[18px] border border-black/10 px-4 py-3 text-center text-sm font-medium text-black/76">
                Enviar WPP
              </Link>
            ) : null}
            <Link href={googleMapsLink} className="rounded-[18px] border border-black/10 px-4 py-3 text-center text-sm font-medium text-black/76">
              Abrir Google Maps
            </Link>
            <Link href={`/admin/pedidos/${order.id}/ticket`} className="rounded-[18px] border border-black/10 px-4 py-3 text-center text-sm font-medium text-black/76">
              Ver ticket
            </Link>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-black/82">Estado actual</h2>
          <div className="mt-4 space-y-2 text-sm text-black/64">
            <p>Pago: <strong>{getOrderStateLabel(order.paymentStatus)}</strong></p>
            <p>Entrega: <strong>{getOrderStateLabel(order.status)}</strong></p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {order.paymentStatus !== 'PAID' ? (
              <form action={markOrderPaidAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                  Generar QR de pago
                </button>
              </form>
            ) : null}
            <form action={updateOrderStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="nextStatus" value="DELIVERED" />
              <button className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                Marcar entregado
              </button>
            </form>
            <form action={updateOrderStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="nextStatus" value="OUT_FOR_DELIVERY" />
              <button className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white">
                Cliente no estaba
              </button>
            </form>
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold text-black/82">Productos</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-[18px] border border-black/8 px-4 py-4 text-sm text-black/64">
                <p className="font-medium text-black/84">{item.productName}</p>
                <p className="mt-1">{item.colorName} · {item.size} · x{item.quantity}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
