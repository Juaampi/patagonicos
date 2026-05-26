export function normalizeWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  if (digits.startsWith('54')) {
    return digits
  }

  return `54${digits.startsWith('0') ? digits.slice(1) : digits}`
}

export function formatPhoneForDisplay(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (!digits) return ''

  if (digits.startsWith('0')) {
    const p1 = digits.slice(0, 1)
    const p2 = digits.slice(1, 4)
    const p3 = digits.slice(4, 6)
    const p4 = digits.slice(6, 10)
    const p5 = digits.slice(10, 14)
    return [p1, p2, p3, p4, p5].filter(Boolean).join(' ')
  }

  const p1 = digits.slice(0, 3)
  const p2 = digits.slice(3, 6)
  const p3 = digits.slice(6, 10)
  const p4 = digits.slice(10, 14)
  return [p1, p2, p3, p4].filter(Boolean).join(' ')
}
