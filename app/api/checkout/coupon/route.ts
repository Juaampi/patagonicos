import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCheckoutPreview } from '@/lib/store-settings'
import { ensureStoreSettings } from '@/lib/server/fulfillment'
import { validateCouponCode } from '@/lib/server/coupons'

const couponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().int().nonnegative(),
  city: z.string().optional().default(''),
  province: z.string().optional().default(''),
  paymentMethod: z.enum(['ONLINE', 'CASH_ON_DELIVERY', 'TRANSFER']).default('ONLINE'),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = couponSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Datos inválidos para validar el cupón.' }, { status: 400 })
  }

  const settings = await ensureStoreSettings()
  const basePreview = getCheckoutPreview(
    parsed.data.subtotal,
    parsed.data.city,
    parsed.data.province,
    settings,
    parsed.data.paymentMethod,
  )

  const result = await validateCouponCode({
    code: parsed.data.code,
    subtotal: parsed.data.subtotal,
    existingDiscountAmount: basePreview.discountAmount,
  })

  if (!result.ok || !result.coupon) {
    return NextResponse.json(result, { status: 400 })
  }

  const preview = getCheckoutPreview(
    parsed.data.subtotal,
    parsed.data.city,
    parsed.data.province,
    settings,
    parsed.data.paymentMethod,
    {
      code: result.coupon.code,
      type: result.coupon.type,
      value: result.coupon.value,
      minSubtotal: result.coupon.minSubtotal,
    },
  )

  return NextResponse.json({
    ...result,
    preview: {
      shippingAmount: preview.shippingAmount,
      discountAmount: preview.discountAmount,
      couponDiscountAmount: preview.couponDiscountAmount,
      total: preview.total,
    },
  })
}
