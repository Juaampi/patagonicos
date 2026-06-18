import { CheckoutReturnScreen } from '@/components/checkout/checkout-return-screen'

export const dynamic = 'force-dynamic'

function pickFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.find((entry) => typeof entry === 'string' && entry.trim().length > 0)?.trim()
  }

  return typeof value === 'string' ? value.trim() : undefined
}

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string | string[]
    email?: string | string[]
    order?: string | string[]
    orderNumber?: string | string[]
    shortCode?: string | string[]
    payment_id?: string | string[]
    collection_id?: string | string[]
  }>
}) {
  const params = searchParams ? await searchParams : undefined
  const requestedStatus = pickFirstParam(params?.status)
  const status: 'success' | 'pending' | 'failure' =
    requestedStatus === 'pending' || requestedStatus === 'failure' ? requestedStatus : 'success'

  return (
    <CheckoutReturnScreen
      status={status}
      email={pickFirstParam(params?.email)}
      orderId={pickFirstParam(params?.order)}
      orderNumber={pickFirstParam(params?.orderNumber)}
      shortCode={pickFirstParam(params?.shortCode)}
      paymentId={pickFirstParam(params?.payment_id) || pickFirstParam(params?.collection_id)}
    />
  )
}
