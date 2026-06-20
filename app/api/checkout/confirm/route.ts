import { NextResponse } from 'next/server'
import { getMercadoPagoPaymentById } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'
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
    const approved = payment.status === 'approved'

    if (approved && orderId) {
      await syncApprovedPayment(orderId, String(payment.id))
    }

    const order =
      approved && orderId
        ? await prisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: {
                orderBy: {
                  id: 'asc',
                },
              },
            },
          })
        : null

    return NextResponse.json({
      ok: true,
      paymentId: String(payment.id),
      status: payment.status ?? 'unknown',
      orderId: orderId || null,
      approved,
      order: order
        ? {
            id: order.id,
            orderNumber: order.orderNumber,
            shortCode: order.shortCode,
            currency: 'ARS',
            total: order.total,
            shippingAmount: order.shippingAmount,
            subtotal: order.subtotal,
            items: order.items.map((item) => ({
              item_id: item.productId,
              item_name: item.productName,
              item_variant: [item.colorName, item.size].filter(Boolean).join(' - '),
              price: item.unitPrice,
              quantity: item.quantity,
            })),
          }
        : null,
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
