import { NextResponse } from 'next/server'
import { createMinimalTestPreference, createCheckoutDebugPreference } from '@/lib/mercadopago'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('mode') ?? 'minimal'

  try {
    const preference =
      mode === 'checkout'
        ? await createCheckoutDebugPreference({ email: 'debug-checkout@example.com' })
        : await createMinimalTestPreference()

    const redirectUrl = preference.init_point ?? preference.sandbox_init_point

    if (!redirectUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: 'Mercado Pago no devolvio una URL de checkout.',
          mode,
        },
        { status: 500 },
      )
    }

    return NextResponse.redirect(redirectUrl, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mode,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
