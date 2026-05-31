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
  const isEligibleForBariloche = settings.barilocheEnabled && isBarilocheLocation(city, province)
  const discountPercent = isEligibleForBariloche ? settings.barilocheDiscountPercent : 0
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const shippingAmount = isEligibleForBariloche
    ? subtotal >= settings.localDeliveryFreeThreshold
      ? 0
      : settings.localDeliveryCost
    : settings.nationalShippingCost

  return {
    isBariloche: isEligibleForBariloche,
    shippingMethod: isEligibleForBariloche ? 'LOCAL_DELIVERY' : 'NATIONAL_SHIPPING',
    shippingAmount,
    discountPercent,
    discountAmount,
    total: Math.max(0, subtotal - discountAmount + shippingAmount),
    allowCashOnDelivery: isEligibleForBariloche,
  }
}
