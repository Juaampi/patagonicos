export function buildMetaPurchaseEventId(orderId: string) {
  return `pa2_purchase_${orderId.trim()}`
}
