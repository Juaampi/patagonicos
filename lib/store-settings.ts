import { normalizeProvinceName } from '@/lib/argentina-data'

export type StoreSettingsSnapshot = {
  localDeliveryFreeThreshold: number
  localDeliveryCost: number
  nationalShippingCost: number
  barilocheCutoffHour: number
  barilocheCutoffMinute: number
  barilocheEnabled: boolean
  barilocheDiscountPercent: number
}

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
) {
  const isBarilocheCustomer = isBarilocheLocation(city, province)
  const isEligibleForBariloche = settings.barilocheEnabled && isBarilocheCustomer
  const qualifiesForFreeShipping = subtotal >= settings.localDeliveryFreeThreshold
  const discountPercent = isBarilocheCustomer ? settings.barilocheDiscountPercent : 0
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
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
    discountPercent,
    discountAmount,
    total: Math.max(0, subtotal - discountAmount + shippingAmount),
    allowCashOnDelivery: isEligibleForBariloche,
  }
}
