type ComboPricedItem = {
  id: string
  productId: string
  price: number
  quantity: number
  comboArmable?: boolean
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
