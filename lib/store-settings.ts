import { normalizeProvinceName } from '@/lib/argentina-data'
import { getCouponDiscountAmount, type CouponPreviewInput } from '@/lib/coupons'

export type StoreSettingsSnapshot = {
  localDeliveryFreeThreshold: number
  localDeliveryCost: number
  nationalShippingCost: number
  barilocheCutoffHour: number
  barilocheCutoffMinute: number
  barilocheEnabled: boolean
  barilocheDiscountPercent: number
}

export const TRANSFER_PAYMENT_ALIAS = 'patagonicos.ok'
export const TRANSFER_DISCOUNT_PERCENT = 10

export function normalizeCity(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export function isBarilocheLocation(city: string, province: string) {
  const normalizedProvince = normalizeProvinceName(province)
  const normalizedCity = normalizeCity(city)

  return (
    normalizedProvince === 'rio negro' &&
    (normalizedCity === 'bariloche' || normalizedCity === 'san carlos de bariloche')
  )
}

export function getCheckoutPreview(
  subtotal: number,
  city: string,
  province: string,
  settings: StoreSettingsSnapshot,
  paymentMethod: 'ONLINE' | 'CASH_ON_DELIVERY' | 'TRANSFER' = 'ONLINE',
  coupon: CouponPreviewInput | null = null,
) {
  const isBarilocheCustomer = isBarilocheLocation(city, province)
  const isEligibleForBariloche = settings.barilocheEnabled && isBarilocheCustomer
  const qualifiesForFreeShipping = subtotal >= settings.localDeliveryFreeThreshold
  const barilocheDiscountPercent = isBarilocheCustomer ? settings.barilocheDiscountPercent : 0
  const barilocheDiscountAmount = Math.round((subtotal * barilocheDiscountPercent) / 100)
  const transferDiscountPercent = paymentMethod === 'TRANSFER' ? TRANSFER_DISCOUNT_PERCENT : 0
  const transferDiscountAmount = Math.round((subtotal * transferDiscountPercent) / 100)
  const discountPercent = barilocheDiscountPercent + transferDiscountPercent
  const discountAmount = barilocheDiscountAmount + transferDiscountAmount
  const couponDiscountAmount = getCouponDiscountAmount(subtotal, discountAmount, coupon)
  const shippingAmount = isEligibleForBariloche
    ? qualifiesForFreeShipping
      ? 0
      : settings.localDeliveryCost
    : qualifiesForFreeShipping
      ? 0
      : settings.nationalShippingCost

  return {
    isBariloche: isEligibleForBariloche,
    qualifiesForFreeShipping,
    shippingMethod: isEligibleForBariloche ? 'LOCAL_DELIVERY' : 'NATIONAL_SHIPPING',
    shippingAmount,
    barilocheDiscountPercent,
    barilocheDiscountAmount,
    transferDiscountPercent,
    transferDiscountAmount,
    discountPercent,
    discountAmount,
    couponDiscountAmount,
    total: Math.max(0, subtotal - discountAmount - couponDiscountAmount + shippingAmount),
    allowCashOnDelivery: isEligibleForBariloche,
  }
}
