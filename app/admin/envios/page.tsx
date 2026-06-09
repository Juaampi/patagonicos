import { AdminAndreaniPanel } from '@/components/admin/admin-andreani-panel'
import { AdminPrintJobsPanel } from '@/components/admin/admin-print-jobs-panel'
import { getAndreaniShipmentSnapshot } from '@/lib/server/andreani'
import { getAdminFulfillmentSnapshot } from '@/lib/server/fulfillment'

export const dynamic = 'force-dynamic'

export default async function AdminShipmentsPage() {
  const [fulfillment, andreani] = await Promise.all([
    getAdminFulfillmentSnapshot(),
    getAndreaniShipmentSnapshot(),
  ])

  return (
    <div className="space-y-6">
      <AdminAndreaniPanel
        trackerUrl={andreani.trackerUrl}
        readyToExport={andreani.readyToExport}
        missingData={andreani.missingData}
        dispatched={andreani.dispatched}
      />
      <AdminPrintJobsPanel
        printJobs={fulfillment.printJobs.map((job) => ({
          id: job.id,
          orderId: job.orderId,
          type: job.type,
          status: job.status,
          fileUrl: job.fileUrl ?? undefined,
          createdAt: job.createdAt.toISOString(),
          printedAt: job.printedAt?.toISOString(),
          orderShortCode: job.order.shortCode ?? undefined,
          customerName: job.order.customer.fullName ?? job.order.customer.email,
        }))}
      />
    </div>
  )
}
