import { CheckoutReturnScreen } from '@/components/checkout/checkout-return-screen'
import { getMercadoPagoPaymentById } from '@/lib/mercadopago'
import { syncApprovedPayment } from '@/lib/server/fulfillment'

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
    collection_status?: string
  }>
}) {
  const params = searchParams ? await searchParams : undefined
  const paymentId = params?.payment_id?.trim() || params?.collection_id?.trim() || ''
  const requestedStatus = params?.status?.trim()
  let status: 'success' | 'pending' | 'failure' =
    requestedStatus === 'pending' || requestedStatus === 'failure' ? requestedStatus : 'success'

  if (paymentId) {
    try {
      const payment = await getMercadoPagoPaymentById(paymentId)
      const orderId = String(payment.external_reference ?? payment.metadata?.orderId ?? params?.order ?? '').trim()

      if (payment.status === 'approved' && orderId) {
        await syncApprovedPayment(orderId, String(payment.id))
        status = 'success'
      } else if (payment.status && payment.status !== 'approved') {
        status = payment.status === 'pending' || payment.status === 'in_process' ? 'pending' : 'failure'
      }
    } catch (error) {
      console.error('[checkout-result] failed to sync Mercado Pago return', {
        message: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        orderId: params?.order?.trim() ?? null,
      })
    }
  }

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
