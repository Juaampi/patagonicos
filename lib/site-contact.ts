import { normalizeWhatsAppPhone } from '@/lib/contact-utils'

export const SITE_WHATSAPP_DISPLAY = '+54 9 2944 324423'
export const SITE_WHATSAPP_RAW = '5492944324423'

export function getSiteWhatsAppHref(message?: string) {
  const normalizedPhone = normalizeWhatsAppPhone(SITE_WHATSAPP_RAW)
  if (!message) {
    return `https://wa.me/${normalizedPhone}`
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
