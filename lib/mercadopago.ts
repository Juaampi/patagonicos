import { MercadoPagoConfig, Preference } from 'mercadopago'
import { env } from './env'

function getClient() {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error('Mercado Pago access token not configured')
  }

  return new MercadoPagoConfig({
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  })
}

export async function createPendingPreference(input: {
  orderId: string
  orderNumber: string
  shortCode?: string | null
  email: string
  items: Array<{ id: string; title: string; quantity: number; unit_price: number }>
}) {
  const preference = new Preference(getClient())
  const successUrl = new URL('/checkout/resultado', env.SITE_URL)
  successUrl.searchParams.set('status', 'success')
  successUrl.searchParams.set('order', input.orderId)
  successUrl.searchParams.set('email', input.email)
  successUrl.searchParams.set('orderNumber', input.orderNumber)
  if (input.shortCode) {
    successUrl.searchParams.set('shortCode', input.shortCode)
  }

  const pendingUrl = new URL('/checkout/resultado', env.SITE_URL)
  pendingUrl.searchParams.set('status', 'pending')
  pendingUrl.searchParams.set('order', input.orderId)
  pendingUrl.searchParams.set('email', input.email)

  const failureUrl = new URL('/checkout/resultado', env.SITE_URL)
  failureUrl.searchParams.set('status', 'failure')
  failureUrl.searchParams.set('order', input.orderId)
  failureUrl.searchParams.set('email', input.email)

  return preference.create({
    body: {
      items: input.items,
      payer: { email: input.email },
      external_reference: input.orderId,
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      metadata: {
        orderId: input.orderId,
      },
    },
  })
}
