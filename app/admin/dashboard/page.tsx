import { AdminDashboardOverview } from '@/components/admin/admin-dashboard-overview'
import { getAdminSnapshot } from '@/lib/server/catalog'
import { getAdminFulfillmentSnapshot, isCancelledStatus, isDeliveredStatus, isShippedStatus } from '@/lib/server/fulfillment'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [snapshot, fulfillment] = await Promise.all([getAdminSnapshot(), getAdminFulfillmentSnapshot()])

  const metrics = {
    activeProducts: snapshot.products.filter((product) => product.status === 'ACTIVE').length,
    pendingOrders: fulfillment.orders.filter((order) => !isDeliveredStatus(order.status) && !isCancelledStatus(order.status)).length,
    localDeliveries: fulfillment.orders.filter(
      (order) =>
        order.shippingMethod === 'LOCAL_DELIVERY' &&
        !isDeliveredStatus(order.status) &&
        !isCancelledStatus(order.status),
    ).length,
    nationalShipments: fulfillment.orders.filter(
      (order) =>
        order.shippingMethod === 'NATIONAL_SHIPPING' &&
        !isShippedStatus(order.status) &&
        !isDeliveredStatus(order.status) &&
        !isCancelledStatus(order.status),
    ).length,
    cashOnDelivery: fulfillment.orders.filter((order) => order.paymentMethod === 'CASH_ON_DELIVERY').length,
    queuedPrintJobs: fulfillment.printJobs.filter((job) => job.status === 'PENDING').length,
    totalPendingRevenue: fulfillment.orders
      .filter((order) => !isDeliveredStatus(order.status) && !isCancelledStatus(order.status))
      .reduce((total, order) => total + order.total, 0),
  }

  return <AdminDashboardOverview metrics={metrics} />
}
