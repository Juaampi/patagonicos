import { NextResponse } from 'next/server'
import { getMercadoPagoPaymentById } from '@/lib/mercadopago'
import { syncApprovedPayment } from '@/lib/server/fulfillment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const paymentId = url.searchParams.get('payment_id')?.trim() || url.searchParams.get('collection_id')?.trim() || ''
  const fallbackOrderId = url.searchParams.get('order')?.trim() || ''

  if (!paymentId) {
    return NextResponse.json({ ok: false, message: 'Missing payment id.' }, { status: 400 })
  }

  try {
    const payment = await getMercadoPagoPaymentById(paymentId)
    const orderId = String(payment.external_reference ?? payment.metadata?.orderId ?? fallbackOrderId).trim()

    if (payment.status === 'approved' && orderId) {
      await syncApprovedPayment(orderId, String(payment.id))
    }

    return NextResponse.json({
      ok: true,
      paymentId: String(payment.id),
      status: payment.status ?? 'unknown',
      orderId: orderId || null,
    })
  } catch (error) {
    console.error('[checkout-confirm] failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
      paymentId,
      orderId: fallbackOrderId || null,
    })

    return NextResponse.json(
      {
        ok: false,
        message: 'No pudimos confirmar el pago desde el retorno.',
      },
      { status: 500 },
    )
  }
}
