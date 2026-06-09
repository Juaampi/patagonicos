import { AdminOrdersPanel } from '@/components/admin/admin-orders-panel'
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
        printJobs: order.printJobs.map((job) => ({
          id: job.id,
          status: job.status,
          type: job.type,
        })),
      }))}
    />
  )
}
