import { NextResponse } from 'next/server'
import { createMinimalTestPreference } from '@/lib/mercadopago'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const preference = await createMinimalTestPreference()

    return NextResponse.json(
      {
        sandbox_init_point: preference.sandbox_init_point ?? null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error('[mercadopago] mp-test-preference failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        ok: false,
        message: 'No pudimos crear la preferencia de prueba.',
      },
      { status: 500 },
    )
  }
}
