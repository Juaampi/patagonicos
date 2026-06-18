import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { getMercadoPagoPaymentById } from '@/lib/mercadopago'
import { syncApprovedPayment } from '@/lib/server/fulfillment'

export const runtime = 'nodejs'

type MercadoPagoWebhookBody = {
  type?: string
  action?: string
  data?: {
    id?: string | number
  }
}

function parseSignatureParts(headerValue: string) {
  const values = new Map<string, string>()

  for (const part of headerValue.split(',')) {
    const [rawKey, rawValue] = part.split('=')
    const key = rawKey?.trim()
    const value = rawValue?.trim()

    if (key && value) {
      values.set(key, value)
    }
  }

  return {
    ts: values.get('ts') ?? '',
    v1: values.get('v1') ?? '',
  }
}

function buildSignatureTemplate(input: {
  dataId: string
  requestId: string
  ts: string
}) {
  const segments = [
    input.dataId ? `id:${input.dataId.toLowerCase()};` : '',
    input.requestId ? `request-id:${input.requestId};` : '',
    input.ts ? `ts:${input.ts};` : '',
  ]

  return segments.join('')
}

function isValidMercadoPagoSignature(request: NextRequest, dataId: string) {
  if (!env.MERCADOPAGO_WEBHOOK_SECRET) {
    return true
  }

  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? ''

  if (!xSignature || !xRequestId || !dataId) {
    return false
  }

  const { ts, v1 } = parseSignatureParts(xSignature)
  if (!ts || !v1) {
    return false
  }

  const template = buildSignatureTemplate({
    dataId,
    requestId: xRequestId,
    ts,
  })

  const expected = crypto.createHmac('sha256', env.MERCADOPAGO_WEBHOOK_SECRET).update(template).digest('hex')
  if (expected.length !== v1.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    webhook: 'mercadopago',
    url: '/api/mercadopago/webhook',
  })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = rawBody ? (JSON.parse(rawBody) as MercadoPagoWebhookBody) : {}
    const dataId =
      request.nextUrl.searchParams.get('data.id') ??
      request.nextUrl.searchParams.get('data_id') ??
      String(body.data?.id ?? '').trim()

    if (!isValidMercadoPagoSignature(request, dataId)) {
      return NextResponse.json({ ok: false, message: 'Invalid Mercado Pago signature.' }, { status: 401 })
    }

    const topic =
      String(body.type ?? '').trim() ||
      String(request.nextUrl.searchParams.get('topic') ?? '').trim() ||
      String(request.nextUrl.searchParams.get('type') ?? '').trim()

    console.info('[mercadopago-webhook] received', {
      dataId: dataId || null,
      topic: topic || 'unknown',
      hasSignature: Boolean(request.headers.get('x-signature')),
      hasRequestId: Boolean(request.headers.get('x-request-id')),
    })

    if (topic !== 'payment' || !dataId) {
      return NextResponse.json({ ok: true, ignored: true, topic: topic || 'unknown' })
    }

    const payment = await getMercadoPagoPaymentById(dataId)
    const orderId =
      String(payment.external_reference ?? payment.metadata?.orderId ?? '').trim()

    if (payment.status === 'approved' && orderId) {
      await syncApprovedPayment(orderId, String(payment.id))
    }

    console.info('[mercadopago-webhook] processed', {
      paymentId: String(payment.id),
      status: payment.status ?? 'unknown',
      orderId: orderId || null,
    })

    return NextResponse.json({
      ok: true,
      topic,
      paymentId: String(payment.id),
      status: payment.status ?? 'unknown',
      orderId: orderId || null,
    })
  } catch (error) {
    console.error('[mercadopago-webhook] failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
      dataId: request.nextUrl.searchParams.get('data.id') ?? request.nextUrl.searchParams.get('data_id') ?? null,
      topic: request.nextUrl.searchParams.get('topic') ?? request.nextUrl.searchParams.get('type') ?? 'unknown',
    })

    return NextResponse.json(
      {
        ok: false,
        message: 'Webhook processing failed.',
      },
      { status: 500 },
    )
  }
}
