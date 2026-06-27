import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function maskSecret(value?: string | null) {
  const normalized = value?.trim() ?? ''
  if (!normalized) {
    return ''
  }

  if (normalized.length <= 8) {
    return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`
  }

  return `${normalized.slice(0, 4)}***${normalized.slice(-4)}`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const accessCode = url.searchParams.get('code')?.trim() || ''
  const sendProbe = url.searchParams.get('send')?.trim() === '1'
  const to = url.searchParams.get('to')?.trim() || env.ADMIN_EMAIL

  if (accessCode !== env.INTERNAL_ACCESS_CODE) {
    return NextResponse.json({ ok: false, message: 'Invalid internal access code.' }, { status: 401 })
  }

  const provider = env.EMAIL_PROVIDER
  const resendConfigured = Boolean(env.RESEND_API_KEY)
  const fromEmail = env.FROM_EMAIL

  const baseResponse = {
    ok: true,
    provider,
    resendConfigured,
    resendKey: {
      present: resendConfigured,
      preview: maskSecret(env.RESEND_API_KEY),
    },
    fromEmail,
    adminEmail: env.ADMIN_EMAIL,
    willUseConsoleFallback: !(provider === 'resend' && resendConfigured),
  }

  if (!sendProbe) {
    return NextResponse.json(baseResponse)
  }

  try {
    const result = await sendEmail({
      to,
      subject: 'Patagónicos email debug',
      html: '<p>Prueba de envío desde <strong>/api/email-debug</strong>.</p>',
    })

    return NextResponse.json({
      ...baseResponse,
      probe: {
        sent: true,
        to,
        result,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ...baseResponse,
        ok: false,
        probe: {
          sent: false,
          to,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    )
  }
}
