import { formatPrice } from '@/lib/utils'

type WhatsAppOrderLike = {
  customerName: string
  orderNumber: string
  shortCode?: string | null
  total: number
  amountToCollect?: number
  paymentMethod: string
  paymentStatus: string
  deliveryAddress: string
  items: Array<{
    productName: string
    quantity: number
  }>
}

export function normalizeArgentinaPhone(phone: string) {
  const digits = phone.replace(/\D+/g, '').replace(/^00/, '')

  if (!digits) {
    return ''
  }

  if (digits.startsWith('549')) {
    return digits
  }

  if (digits.startsWith('54')) {
    const national = digits.slice(2).replace(/^9/, '')
    return `549${national}`
  }

  const withoutLeadingZero = digits.replace(/^0/, '').replace(/^9/, '')

  if (withoutLeadingZero.length >= 10) {
    return `549${withoutLeadingZero}`
  }

  return digits
}

function summarizeProducts(items: WhatsAppOrderLike['items']) {
  const summary = items.map((item) => `${item.productName} x${item.quantity}`).join(', ')
  return summary.length > 140 ? `${summary.slice(0, 137)}...` : summary
}

function buildPaymentCopy(order: WhatsAppOrderLike) {
  const amountToCollect = order.amountToCollect ?? 0

  if (amountToCollect > 0 || order.paymentMethod === 'CASH_ON_DELIVERY') {
    return `Contra entrega. Cobro al entregar: ${formatPrice(amountToCollect || order.total)}`
  }

  if (order.paymentStatus === 'PAID') {
    return 'Pedido abonado'
  }

  return 'Pago a confirmar'
}

export function buildWhatsAppDeliveryMessage(order: WhatsAppOrderLike) {
  const displayNumber = order.shortCode ?? order.orderNumber

  return [
    `Hola ${order.customerName}! 👋`,
    'Tu pedido de Patagónicos ya está en camino 🚚🐶',
    '',
    `Pedido: #${displayNumber}`,
    `Productos: ${summarizeProducts(order.items)}`,
    `Total: ${formatPrice(order.total)}`,
    `Pago: ${buildPaymentCopy(order)}`,
    `Direccion: ${order.deliveryAddress}`,
    '',
    'Estoy saliendo con los repartos del dia.',
    'Te aviso por aca cualquier novedad.',
    '',
    'Muchas gracias 🏔️',
  ].join('\n')
}

export function buildWhatsAppVisitTodayMessage(order: WhatsAppOrderLike) {
  const displayNumber = order.shortCode ?? order.orderNumber

  return [
    `Hola ${order.customerName}! 👋`,
    'Hoy vamos a estar visitándote para entregar tu pedido de Patagónicos 🚚🐶',
    '',
    `Pedido: #${displayNumber}`,
    `Productos: ${summarizeProducts(order.items)}`,
    `Total: ${formatPrice(order.total)}`,
    `Pago: ${buildPaymentCopy(order)}`,
    `Direccion: ${order.deliveryAddress}`,
    '',
    'Te avisamos por acá cuando estemos cerca.',
    'Si necesitás darnos una referencia extra para encontrar el domicilio, respondé este mensaje.',
    '',
    'Muchas gracias 🏔️',
  ].join('\n')
}

export function buildWhatsAppOutsideMessage(order: WhatsAppOrderLike) {
  const displayNumber = order.shortCode ?? order.orderNumber

  return [
    `Hola ${order.customerName}! 👋`,
    'Ya estamos afuera con tu pedido de Patagónicos 🚚',
    '',
    `Pedido: #${displayNumber}`,
    `Productos: ${summarizeProducts(order.items)}`,
    `Total: ${formatPrice(order.total)}`,
    `Pago: ${buildPaymentCopy(order)}`,
    `Direccion: ${order.deliveryAddress}`,
    '',
    'Cuando puedas, salí así hacemos la entrega.',
    'Si necesitás que esperemos unos minutos, avisanos por este medio.',
    '',
    'Muchas gracias 🏔️',
  ].join('\n')
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizeArgentinaPhone(phone)

  if (!normalizedPhone) {
    return ''
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
