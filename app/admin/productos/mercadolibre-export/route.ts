import { NextResponse } from 'next/server'
import { buildMercadoLibreExportWorkbook } from '@/lib/server/mercadolibre-export'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const buffer = await buildMercadoLibreExportWorkbook()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mercado-libre-productos.xlsx"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Mercado Libre export failed', error)

    return NextResponse.json(
      {
        message: 'No pudimos generar el archivo de Mercado Libre.',
      },
      {
        status: 500,
      },
    )
  }
}
