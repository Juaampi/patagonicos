import { CheckoutReturnScreen } from '@/components/checkout/checkout-return-screen'

export const dynamic = 'force-dynamic'

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string
    email?: string
    order?: string
    orderNumber?: string
    shortCode?: string
    payment_id?: string
    collection_id?: string
  }>
}) {
  const params = searchParams ? await searchParams : undefined
  const requestedStatus = params?.status?.trim()
  const status: 'success' | 'pending' | 'failure' =
    requestedStatus === 'pending' || requestedStatus === 'failure' ? requestedStatus : 'success'

  return (
    <CheckoutReturnScreen
      status={status}
      email={params?.email?.trim()}
      orderId={params?.order?.trim()}
      orderNumber={params?.orderNumber?.trim()}
      shortCode={params?.shortCode?.trim()}
      paymentId={params?.payment_id?.trim() || params?.collection_id?.trim()}
    />
  )
}
