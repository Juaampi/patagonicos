type ComboEligibility = {
  productId: string
  discountPercent: number
}

type ComboPricedItem = {
  id: string
  productId: string
  price: number
  quantity: number
  comboArmable?: boolean
  comboEligibleFrom?: ComboEligibility[]
}

type ComboGroupSummary = {
  productId: string
  quantity: number
  freeUnits: number
  paidUnits: number
  price: number
}

export type ComboPricingSummary = {
  grossSubtotal: number
  comboDiscount: number
  payableSubtotal: number
  freeUnitsByItemId: Map<string, number>
  lineTotalsByItemId: Map<string, number>
  groupSummaries: Map<string, ComboGroupSummary>
}

export type CartPricingSummary = {
  grossSubtotal: number
  twoForOneDiscount: number
  comboLinkDiscount: number
  totalDiscount: number
  payableSubtotal: number
  freeUnitsByItemId: Map<string, number>
  comboDiscountedUnitsByItemId: Map<string, number>
  lineTotalsByItemId: Map<string, number>
  groupSummaries: Map<string, ComboGroupSummary>
}

export const DEFAULT_PRODUCT_COMBO_DISCOUNT_PERCENT = 25

export function getComboDiscountedPrice(price: number, discountPercent = DEFAULT_PRODUCT_COMBO_DISCOUNT_PERCENT) {
  return Math.max(0, price - Math.round((price * discountPercent) / 100))
}

export function getComboSavings(price: number, discountPercent = DEFAULT_PRODUCT_COMBO_DISCOUNT_PERCENT) {
  return Math.max(0, price - getComboDiscountedPrice(price, discountPercent))
}

export function getTwoForOnePricing(price: number) {
  return {
    originalTotal: price * 2,
    discountedTotal: price,
    savings: price,
    effectiveUnitPrice: Math.round(price / 2),
  }
}

export function getFreeUnitsForQuantity(quantity: number, comboArmable?: boolean) {
  if (!comboArmable || quantity <= 1) {
    return 0
  }

  return Math.floor(quantity / 2)
}

export function buildComboPricingSummary(items: ComboPricedItem[]): ComboPricingSummary {
  const grossSubtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const freeUnitsByItemId = new Map<string, number>()
  const lineTotalsByItemId = new Map<string, number>()
  const groupSummaries = new Map<string, ComboGroupSummary>()

  const itemsByProduct = new Map<string, ComboPricedItem[]>()
  for (const item of items) {
    const current = itemsByProduct.get(item.productId) ?? []
    current.push(item)
    itemsByProduct.set(item.productId, current)
  }

  for (const [productId, productItems] of itemsByProduct.entries()) {
    const comboEnabled = productItems.some((item) => item.comboArmable)
    const quantity = productItems.reduce((total, item) => total + item.quantity, 0)
    const freeUnits = getFreeUnitsForQuantity(quantity, comboEnabled)
    const paidUnits = Math.max(0, quantity - freeUnits)
    const price = productItems[0]?.price ?? 0

    groupSummaries.set(productId, {
      productId,
      quantity,
      freeUnits,
      paidUnits,
      price,
    })

    let freeUnitsRemaining = freeUnits
    for (const item of productItems) {
      const freeUnitsForItem = Math.min(item.quantity, freeUnitsRemaining)
      const paidQuantity = Math.max(0, item.quantity - freeUnitsForItem)
      freeUnitsRemaining -= freeUnitsForItem

      freeUnitsByItemId.set(item.id, freeUnitsForItem)
      lineTotalsByItemId.set(item.id, paidQuantity * item.price)
    }
  }

  const comboDiscount = Array.from(freeUnitsByItemId.entries()).reduce((total, [itemId, freeUnits]) => {
    const item = items.find((entry) => entry.id === itemId)
    return total + (item ? item.price * freeUnits : 0)
  }, 0)

  return {
    grossSubtotal,
    comboDiscount,
    payableSubtotal: Math.max(0, grossSubtotal - comboDiscount),
    freeUnitsByItemId,
    lineTotalsByItemId,
    groupSummaries,
  }
}

export function buildCartPricingSummary(items: ComboPricedItem[]): CartPricingSummary {
  const twoForOneSummary = buildComboPricingSummary(items)
  const comboDiscountedUnitsByItemId = new Map<string, number>()
  const lineTotalsByItemId = new Map(twoForOneSummary.lineTotalsByItemId)
  const sourceRemaining = new Map<string, number>()

  for (const item of items) {
    sourceRemaining.set(item.productId, (sourceRemaining.get(item.productId) ?? 0) + item.quantity)
  }

  let comboLinkDiscount = 0

  for (const item of items) {
    const paidLineTotal = lineTotalsByItemId.get(item.id) ?? item.price * item.quantity
    const remainingPaidUnits = item.price > 0 ? Math.round(paidLineTotal / item.price) : 0

    if (remainingPaidUnits <= 0 || !item.comboEligibleFrom || item.comboEligibleFrom.length === 0) {
      comboDiscountedUnitsByItemId.set(item.id, 0)
      continue
    }

    let discountedUnits = 0
    let lineDiscount = 0
    const eligibilities = [...item.comboEligibleFrom].sort((left, right) => right.discountPercent - left.discountPercent)

    for (let unitIndex = 0; unitIndex < remainingPaidUnits; unitIndex += 1) {
      const match = eligibilities.find((eligibility) => (sourceRemaining.get(eligibility.productId) ?? 0) > 0)
      if (!match) {
        break
      }

      sourceRemaining.set(match.productId, Math.max(0, (sourceRemaining.get(match.productId) ?? 0) - 1))
      discountedUnits += 1
      lineDiscount += Math.round((item.price * match.discountPercent) / 100)
    }

    comboDiscountedUnitsByItemId.set(item.id, discountedUnits)
    comboLinkDiscount += lineDiscount
    lineTotalsByItemId.set(item.id, Math.max(0, paidLineTotal - lineDiscount))
  }

  return {
    grossSubtotal: twoForOneSummary.grossSubtotal,
    twoForOneDiscount: twoForOneSummary.comboDiscount,
    comboLinkDiscount,
    totalDiscount: twoForOneSummary.comboDiscount + comboLinkDiscount,
    payableSubtotal: Math.max(0, twoForOneSummary.payableSubtotal - comboLinkDiscount),
    freeUnitsByItemId: twoForOneSummary.freeUnitsByItemId,
    comboDiscountedUnitsByItemId,
    lineTotalsByItemId,
    groupSummaries: twoForOneSummary.groupSummaries,
  }
}
