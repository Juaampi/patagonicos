import { DeliveryRouteSummary } from '@/components/admin/delivery-route-summary'
import { DeliveryStopsTable } from '@/components/admin/delivery-stops-table'
import { getDeliveriesPageSnapshot } from '@/lib/server/delivery'

export const dynamic = 'force-dynamic'

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const snapshot = await getDeliveriesPageSnapshot(params?.date)

  return (
    <>
      <DeliveryRouteSummary
        selectedDateValue={snapshot.selectedDateValue}
        todayDateValue={snapshot.todayDateValue}
        totalStops={snapshot.stats.totalStops}
        cashOnDeliveryCount={snapshot.stats.cashOnDeliveryCount}
        totalToCollect={snapshot.stats.totalToCollect}
        routeBatches={snapshot.routeBatches}
      />

      <DeliveryStopsTable stops={snapshot.stops} />
    </>
  )
}
