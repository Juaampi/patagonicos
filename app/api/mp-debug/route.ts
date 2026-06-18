import { NextResponse } from 'next/server'
import {
  createMinimalTestPreference,
  getMercadoPagoAccessTokenSummary,
  getMercadoPagoPreferenceById,
} from '@/lib/mercadopago'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const preference = await createMinimalTestPreference()
    const preferenceId = preference.id ?? null
    const fetchedPreference = preferenceId ? await getMercadoPagoPreferenceById(preferenceId) : null

    return NextResponse.json(
      {
        ok: true,
        siteUrl: env.SITE_URL,
        publicKeyConfigured: Boolean(env.MERCADOPAGO_PUBLIC_KEY),
        accessToken: getMercadoPagoAccessTokenSummary(),
        createdPreference: {
          id: preference.id ?? null,
          init_point: preference.init_point ?? null,
          sandbox_init_point: preference.sandbox_init_point ?? null,
        },
        fetchedPreference: fetchedPreference
          ? {
              id: fetchedPreference.id ?? null,
              external_reference: fetchedPreference.external_reference ?? null,
              init_point: fetchedPreference.init_point ?? null,
              sandbox_init_point: fetchedPreference.sandbox_init_point ?? null,
              notification_url: fetchedPreference.notification_url ?? null,
              back_urls: fetchedPreference.back_urls ?? null,
              payer: fetchedPreference.payer ?? null,
              items: fetchedPreference.items ?? null,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    console.error('[mercadopago] mp-debug failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
      accessToken: getMercadoPagoAccessTokenSummary(),
      siteUrl: env.SITE_URL,
    })

    return NextResponse.json(
      {
        ok: false,
        message: 'No pudimos inspeccionar la configuracion de Mercado Pago.',
        accessToken: getMercadoPagoAccessTokenSummary(),
        siteUrl: env.SITE_URL,
      },
      { status: 500 },
    )
  }
}
