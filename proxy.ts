import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const redirectUrl = new URL(
      pathname.replace(/^\/admin/, '/adminpatagonicos') + search,
      request.url,
    )
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === '/adminpatagonicos' || pathname.startsWith('/adminpatagonicos/')) {
    const rewriteUrl = new URL(
      pathname.replace(/^\/adminpatagonicos/, '/admin') + search,
      request.url,
    )
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/adminpatagonicos', '/adminpatagonicos/:path*'],
}
