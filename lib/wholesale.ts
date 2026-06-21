import type { CartItem } from '@/types/store'

export const WHOLESALE_DISCOUNT_RATE = 0.35
export const WHOLESALE_MULTIPLIER = 1 - WHOLESALE_DISCOUNT_RATE
export const WHOLESALE_MIN_UNITS = 30
export const WHOLESALE_MIN_UNITS_PER_MODEL_COLOR = 10

export function getWholesalePrice(retailPrice: number) {
  return Math.floor(retailPrice * WHOLESALE_MULTIPLIER)
}

export function getWholesaleTotalUnits(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

export function getWholesaleColorGroups(items: CartItem[]) {
  const groups = new Map<string, { productId: string; productName: string; colorName: string; quantity: number }>()

  for (const item of items) {
    const key = `${item.productId}::${item.colorName}`
    const current = groups.get(key)

    if (current) {
      current.quantity += item.quantity
      continue
    }

    groups.set(key, {
      productId: item.productId,
      productName: item.name,
      colorName: item.colorName,
      quantity: item.quantity,
    })
  }

  return Array.from(groups.values())
}

export function getWholesaleValidation(items: CartItem[]) {
  const totalUnits = getWholesaleTotalUnits(items)
  const missingUnits = Math.max(WHOLESALE_MIN_UNITS - totalUnits, 0)
  const invalidColorGroups = getWholesaleColorGroups(items).filter(
    (group) => group.quantity < WHOLESALE_MIN_UNITS_PER_MODEL_COLOR,
  )

  return {
    totalUnits,
    missingUnits,
    invalidColorGroups,
    isValid:
      totalUnits >= WHOLESALE_MIN_UNITS &&
      invalidColorGroups.length === 0,
  }
}
