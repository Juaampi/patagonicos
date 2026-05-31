import { NextResponse } from 'next/server'
import { PaymentMethod } from '@prisma/client'
import { z } from 'zod'
import { createOrderFromCheckout } from '@/lib/server/fulfillment'

const checkoutSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(4),
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

  return NextResponse.json({
    ok: true,
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    shortCode: result.order.shortCode,
    status: result.order.status,
    paymentStatus: result.order.paymentStatus,
    shippingMethod: result.order.shippingMethod,
    message:
      result.order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
        ? 'Orden creada con pago contra entrega. El ticket interno ya quedó listo para impresión.'
        : 'Orden creada. Quedó pendiente de pago online para continuar con fulfillment.',
  })
}
