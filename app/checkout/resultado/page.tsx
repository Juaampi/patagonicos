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
  }>
}) {
  const params = searchParams ? await searchParams : undefined
  const status = params?.status === 'pending' || params?.status === 'failure' ? params.status : 'success'

  return (
    <CheckoutReturnScreen
      status={status}
      email={params?.email?.trim()}
      orderId={params?.order?.trim()}
      orderNumber={params?.orderNumber?.trim()}
      shortCode={params?.shortCode?.trim()}
    />
  )
}
