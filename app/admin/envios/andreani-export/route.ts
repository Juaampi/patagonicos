import { NextResponse } from 'next/server'
import { buildAndreaniExportWorkbook } from '@/lib/server/andreani'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const buffer = await buildAndreaniExportWorkbook()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="andreani-pedidos-sin-despachar.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Andreani export failed', error)

    return NextResponse.json(
      {
        message: 'No pudimos generar el archivo de Andreani.',
      },
      {
        status: 500,
      },
    )
  }
}
