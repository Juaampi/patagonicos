import { PaymentStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import { sendMetaPurchaseEventSafely } from '@/lib/server/meta-conversions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const accessCode = url.searchParams.get('code')?.trim() || ''
  const orderId = url.searchParams.get('order')?.trim() || ''
  const testEventCode = url.searchParams.get('test_event_code')?.trim() || ''

  if (accessCode !== env.INTERNAL_ACCESS_CODE) {
    return NextResponse.json({ ok: false, message: 'Invalid internal access code.' }, { status: 401 })
  }

  const resolvedOrderId =
    orderId ||
    (
      await prisma.order.findFirst({
        where: {
          paymentStatus: PaymentStatus.PAID,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
        },
      })
    )?.id ||
    ''

  if (!resolvedOrderId) {
    return NextResponse.json(
      {
        ok: false,
        message: 'No encontramos una orden pagada para probar el evento.',
      },
      { status: 404 },
    )
  }

  const result = await sendMetaPurchaseEventSafely({
    orderId: resolvedOrderId,
    testEventCode,
  })

  return NextResponse.json({
    ok: result.ok,
    orderId: resolvedOrderId,
    testEventCode: testEventCode || env.META_TEST_EVENT_CODE || null,
    result,
  })
}
