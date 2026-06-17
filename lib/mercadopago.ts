import { MercadoPagoConfig, Preference } from 'mercadopago'
import { env } from './env'

type MercadoPagoPreferenceItem = {
  id: string
  title: string
  quantity: number
  currency_id?: 'ARS'
  unit_price: number
}

type MercadoPagoPreferenceResponse = {
  id?: string
  init_point?: string | null
  sandbox_init_point?: string | null
}

function getClient() {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error('Mercado Pago access token not configured')
  }

  return new MercadoPagoConfig({
    accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
  })
}

export function getMercadoPagoWebhookUrl() {
  return new URL('/api/mercadopago/webhook', env.SITE_URL).toString()
}

export function getMercadoPagoAccessTokenSummary() {
  const token = env.MERCADOPAGO_ACCESS_TOKEN ?? ''

  return {
    configured: Boolean(token),
    prefix: token.slice(0, 12),
    suffix: token.slice(-6),
    isTestToken: token.startsWith('TEST-'),
    isProdLikeToken: token.startsWith('APP_USR-'),
  }
}

export function logMercadoPagoPreference(
  label: string,
  preference: MercadoPagoPreferenceResponse,
  extra?: Record<string, unknown>,
) {
  console.info(`[mercadopago] ${label}`, {
    ...extra,
    preferenceId: preference.id ?? null,
    initPoint: preference.init_point ?? null,
    sandboxInitPoint: preference.sandbox_init_point ?? null,
    siteUrl: env.SITE_URL,
    accessToken: getMercadoPagoAccessTokenSummary(),
  })
}

export async function getMercadoPagoPaymentById(paymentId: string) {
  if (!env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error('Mercado Pago access token not configured')
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Mercado Pago payment lookup failed with status ${response.status}.`)
  }

  return (await response.json()) as {
    id: number | string
    status?: string
    external_reference?: string | null
    metadata?: {
      orderId?: string | null
    } | null
  }
}

export async function createPendingPreference(input: {
  orderId: string
  orderNumber: string
  shortCode?: string | null
  email: string
  items: MercadoPagoPreferenceItem[]
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

  const response = await preference.create({
    body: {
      items: input.items.map((item) => ({
        ...item,
        currency_id: item.currency_id ?? 'ARS',
      })),
      external_reference: input.orderId,
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      notification_url: getMercadoPagoWebhookUrl(),
      metadata: {
        orderId: input.orderId,
      },
    },
  })

  logMercadoPagoPreference('standard preference created', response, {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    hasBackUrls: true,
    hasNotificationUrl: true,
    itemCount: input.items.length,
  })

  return response
}

export async function createMinimalTestPreference() {
  const preference = new Preference(getClient())
  const response = await preference.create({
    body: {
      items: [
        {
          id: 'mp-test-item',
          title: 'Prueba Patagonicos',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 100,
        },
      ],
    },
  })

  logMercadoPagoPreference('minimal test preference created', response, {
    hasBackUrls: false,
    hasNotificationUrl: false,
    hasPayer: false,
    itemCount: 1,
  })

  return response
}
