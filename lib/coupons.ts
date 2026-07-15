export type CouponPreviewInput = {
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minSubtotal: number
}

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

export function getCouponDiscountAmount(
  subtotal: number,
  existingDiscountAmount: number,
  coupon: CouponPreviewInput | null,
) {
  if (!coupon || subtotal <= 0) {
    return 0
  }

  if (subtotal < coupon.minSubtotal) {
    return 0
  }

  const rawDiscount =
    coupon.type === 'PERCENTAGE'
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value

  return Math.max(0, Math.min(rawDiscount, subtotal - Math.max(0, existingDiscountAmount)))
}
