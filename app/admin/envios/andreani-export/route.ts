import { NextResponse } from 'next/server'
import { buildAndreaniExportWorkbook } from '@/lib/server/andreani'

export async function GET() {
  const buffer = await buildAndreaniExportWorkbook()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="andreani-pedidos-sin-despachar.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
