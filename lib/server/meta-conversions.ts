import crypto from 'node:crypto'
import { PaymentStatus } from '@prisma/client'
import { buildMetaPurchaseEventId } from '@/lib/analytics-shared'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'

const META_GRAPH_VERSION = 'v20.0'

function resolveMetaPixelId() {
  return env.META_PIXEL_ID?.trim() || env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || ''
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() || ''
}

function normalizePhone(value?: string | null) {
  return (value ?? '').replace(/\D/g, '')
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function maybeHash(value: string) {
  return value ? [sha256(value)] : undefined
}

function buildMetaUserData(order: {
  id: string
  customer: {
    email: string
    fullName: string | null
    phone: string | null
  }
  address: {
    city: string
    province: string
    postalCode: string
    country: string
    recipientFirstName: string | null
    recipientLastName: string | null
  } | null
}) {
  const firstName = normalizeValue(order.address?.recipientFirstName || order.customer.fullName?.split(' ')[0] || '')
  const lastName = normalizeValue(
    order.address?.recipientLastName || order.customer.fullName?.split(' ').slice(1).join(' ') || '',
  )
  const city = normalizeValue(order.address?.city)
  const province = normalizeValue(order.address?.province)
  const postalCode = normalizeValue(order.address?.postalCode)
  const country = normalizeValue(order.address?.country || 'ar')
  const email = normalizeValue(order.customer.email)
  const phone = normalizePhone(order.customer.phone)

  return {
    em: maybeHash(email),
    ph: maybeHash(phone),
    fn: maybeHash(firstName),
    ln: maybeHash(lastName),
    ct: maybeHash(city),
    st: maybeHash(province),
    zp: maybeHash(postalCode),
    country: maybeHash(country),
    external_id: maybeHash(order.id),
  }
}

function compactRecord<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value == null) {
        return false
      }

      if (Array.isArray(value)) {
        return value.length > 0
      }

      return true
    }),
  )
}

async function fetchMetaOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      address: true,
      items: {
        orderBy: {
          id: 'asc',
        },
      },
    },
  })
}

export async function sendMetaPurchaseEvent(input: {
  orderId: string
  testEventCode?: string | null
}) {
  const pixelId = resolveMetaPixelId()
  const accessToken = env.META_CONVERSIONS_ACCESS_TOKEN?.trim() || ''
  const testEventCode = input.testEventCode?.trim() || env.META_TEST_EVENT_CODE?.trim() || ''

  if (!pixelId || !accessToken) {
    return {
      ok: false,
      skipped: true,
      reason: 'missing-meta-config',
      pixelConfigured: Boolean(pixelId),
      accessTokenConfigured: Boolean(accessToken),
    }
  }

  const order = await fetchMetaOrder(input.orderId)
  if (!order) {
    return {
      ok: false,
      skipped: true,
      reason: 'order-not-found',
    }
  }

  if (order.paymentStatus !== PaymentStatus.PAID) {
    return {
      ok: false,
      skipped: true,
      reason: 'order-not-paid',
      paymentStatus: order.paymentStatus,
    }
  }

  const contents = order.items.map((item) => ({
    id: item.productId,
    quantity: item.quantity,
    item_price: item.unitPrice,
  }))

  const payload = compactRecord({
    data: [
      compactRecord({
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: `${env.SITE_URL}/checkout/resultado?order=${encodeURIComponent(order.id)}&status=success`,
        event_id: buildMetaPurchaseEventId(order.id),
        user_data: buildMetaUserData(order),
        custom_data: compactRecord({
          currency: 'ARS',
          value: order.total,
          order_id: order.orderNumber,
          content_type: 'product',
          content_ids: order.items.map((item) => item.productId),
          contents,
          num_items: order.items.reduce((total, item) => total + item.quantity, 0),
        }),
      }),
    ],
    test_event_code: testEventCode || undefined,
  })

  const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      access_token: accessToken,
    }),
    cache: 'no-store',
  })

  const responseText = await response.text()
  let parsedResponse: unknown = null

  try {
    parsedResponse = responseText ? JSON.parse(responseText) : null
  } catch {
    parsedResponse = responseText
  }

  if (!response.ok) {
    throw new Error(
      `Meta Conversions API request failed with ${response.status}: ${
        typeof parsedResponse === 'string' ? parsedResponse : JSON.stringify(parsedResponse)
      }`,
    )
  }

  return {
    ok: true,
    pixelId,
    testEventCode: testEventCode || null,
    payload,
    response: parsedResponse,
  }
}

export async function sendMetaPurchaseEventSafely(input: {
  orderId: string
  testEventCode?: string | null
}) {
  try {
    const result = await sendMetaPurchaseEvent(input)
    console.info('[meta-capi] purchase result', {
      orderId: input.orderId,
      ok: result.ok,
      skipped: 'skipped' in result ? result.skipped : false,
      reason: 'reason' in result ? result.reason : null,
      testEventCode: input.testEventCode?.trim() || env.META_TEST_EVENT_CODE?.trim() || null,
    })
    return result
  } catch (error) {
    console.error('[meta-capi] purchase failed', {
      orderId: input.orderId,
      message: error instanceof Error ? error.message : 'Unknown error',
      testEventCode: input.testEventCode?.trim() || env.META_TEST_EVENT_CODE?.trim() || null,
    })

    return {
      ok: false,
      skipped: false,
      reason: 'request-failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
