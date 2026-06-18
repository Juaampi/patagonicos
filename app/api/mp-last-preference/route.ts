import { NextResponse } from 'next/server'
import { getLatestPreferenceDebug } from '@/lib/mercadopago'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      latest: getLatestPreferenceDebug(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}
