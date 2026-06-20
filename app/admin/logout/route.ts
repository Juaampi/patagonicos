import { NextResponse } from 'next/server'
import { clearAdminAccess } from '@/lib/server/admin-access'

export async function GET(request: Request) {
  await clearAdminAccess()

  return NextResponse.redirect(new URL('/adminpatagonicos/dashboard', request.url))
}
