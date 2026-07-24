import { AdminOrdersPanel } from '@/components/admin/admin-orders-panel'
import { buildWhatsAppOutsideMessage, buildWhatsAppUrl, buildWhatsAppVisitTodayMessage } from '@/lib/delivery-whatsapp'
import { buildGoogleMapsPinUrl, getAdminFulfillmentSnapshot } from '@/lib/server/fulfillment'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const fulfillment = await getAdminFulfillmentSnapshot()

  return (
    <AdminOrdersPanel
      orders={fulfillment.orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        shortCode: order.shortCode ?? undefined,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingMethod: order.shippingMethod,
        shippingStatus: order.shippingStatus,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        customerName: order.customer.fullName ?? order.customer.email,
        customerPhone: order.customer.phone ?? undefined,
        city: order.address?.city ?? undefined,
        trackingNumber: order.trackingNumber ?? undefined,
        pinUrl: buildGoogleMapsPinUrl(order.address?.latitude, order.address?.longitude) || undefined,
        whatsappVisitTodayUrl: order.customer.phone
          ? buildWhatsAppUrl(
              order.customer.phone,
              buildWhatsAppVisitTodayMessage({
                customerName: order.customer.fullName ?? order.customer.email,
                orderNumber: order.orderNumber,
                shortCode: order.shortCode,
                total: order.total,
                amountToCollect: order.amountToCollect,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                deliveryAddress: [
                  order.address?.line1,
                  order.address?.line2,
                  order.address?.city,
                  order.address?.province,
                  order.address?.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Sin direccion cargada',
                items: order.items.map((item) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                })),
              }),
            ) || undefined
          : undefined,
        whatsappOutsideUrl: order.customer.phone
          ? buildWhatsAppUrl(
              order.customer.phone,
              buildWhatsAppOutsideMessage({
                customerName: order.customer.fullName ?? order.customer.email,
                orderNumber: order.orderNumber,
                shortCode: order.shortCode,
                total: order.total,
                amountToCollect: order.amountToCollect,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                deliveryAddress: [
                  order.address?.line1,
                  order.address?.line2,
                  order.address?.city,
                  order.address?.province,
                  order.address?.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Sin direccion cargada',
                items: order.items.map((item) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                })),
              }),
            ) || undefined
          : undefined,
        printJobs: order.printJobs.map((job) => ({
          id: job.id,
          status: job.status,
          type: job.type,
        })),
      }))}
    />
  )
}
