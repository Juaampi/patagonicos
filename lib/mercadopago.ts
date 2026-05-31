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
  email: string
  items: Array<{ id: string; title: string; quantity: number; unit_price: number }>
}) {
  const preference = new Preference(getClient())

  return preference.create({
    body: {
      items: input.items,
      payer: { email: input.email },
      external_reference: input.orderId,
      back_urls: {
        success: `${env.SITE_URL}/carrito?status=success`,
        failure: `${env.SITE_URL}/carrito?status=failure`,
        pending: `${env.SITE_URL}/carrito?status=pending`,
      },
      metadata: {
        orderId: input.orderId,
      },
    },
  })
}
