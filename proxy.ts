import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-access-shared'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-admin-pathname', pathname)

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  if (pathname === '/admin/login') {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  const hasAdminAccess = request.cookies.get(ADMIN_COOKIE_NAME)?.value === 'granted'
  if (hasAdminAccess) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  const loginUrl = new URL('/admin/login', request.url)
  loginUrl.searchParams.set('next', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
