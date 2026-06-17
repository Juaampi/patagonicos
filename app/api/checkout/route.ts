import { NextResponse } from 'next/server'
import { PaymentMethod } from '@prisma/client'
import { z } from 'zod'
import { env } from '@/lib/env'
import { createPendingPreference } from '@/lib/mercadopago'
import { createOrderFromCheckout, syncApprovedPayment } from '@/lib/server/fulfillment'

const checkoutSchema = z.object({
  fullName: z.string().min(2),
  lastName: z.string().min(2),
  dni: z.string().min(7),
  email: z.string().email(),
  phone: z.string().min(6),
  phoneAreaCode: z.string().min(2),
  phoneNumber: z.string().min(6),
  address: z.string().min(4),
  streetNumber: z.string().min(1),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().min(3),
  whatsappOptIn: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  pinLabel: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      productName: z.string().min(1),
      colorName: z.string().min(1),
      size: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().int().positive(),
    }),
  ).min(1),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = checkoutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten(), message: 'Revisá los datos del checkout.' }, { status: 400 })
  }

  const result = await createOrderFromCheckout(parsed.data)
  let confirmedOrder = result.order

  let paymentUrl: string | null = null

  if (result.order.paymentMethod === PaymentMethod.ONLINE && env.MERCADOPAGO_ACCESS_TOKEN) {
    const preference = await createPendingPreference({
      orderId: result.order.id,
      orderNumber: result.order.orderNumber,
      shortCode: result.order.shortCode,
      email: result.order.customer.email,
      items: result.order.items.map((item) => ({
        id: item.productId,
        title: `${item.productName} - ${item.colorName} - ${item.size}`,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    })

    paymentUrl = preference.init_point ?? preference.sandbox_init_point ?? null
  } else if (result.order.paymentMethod === PaymentMethod.ONLINE) {
    const approvedOrder = await syncApprovedPayment(result.order.id, 'mercadopago-not-configured')
    confirmedOrder = {
      ...confirmedOrder,
      ...approvedOrder,
    }
  }

  return NextResponse.json({
    ok: true,
    orderId: confirmedOrder.id,
    orderNumber: confirmedOrder.orderNumber,
    shortCode: confirmedOrder.shortCode,
    status: confirmedOrder.status,
    paymentStatus: confirmedOrder.paymentStatus,
    shippingMethod: confirmedOrder.shippingMethod,
    paymentUrl,
    message:
      confirmedOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
        ? 'Orden creada con pago contra entrega. El ticket interno ya quedó listo para impresión.'
        : paymentUrl
          ? 'Orden creada. Te vamos a redirigir a Mercado Pago para completar el pago.'
          : 'Orden confirmada. Como Mercado Pago todavía no está configurado en este entorno, acreditamos el pago internamente.',
  })
}
