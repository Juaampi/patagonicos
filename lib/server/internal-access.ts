'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { env } from '@/lib/env'

const INTERNAL_COOKIE_NAME = 'pa2_internal_access'

export async function hasInternalAccess() {
  const cookieStore = await cookies()
  return cookieStore.get(INTERNAL_COOKIE_NAME)?.value === 'granted'
}

export async function requireInternalAccess(nextPath: string) {
  const allowed = await hasInternalAccess()
  if (!allowed) {
    redirect(`/delivery/login?next=${encodeURIComponent(nextPath)}`)
  }
}

export async function internalAccessLoginAction(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim()
  const nextPath = String(formData.get('next') ?? '/delivery/orders').trim() || '/delivery/orders'

  if (code !== env.INTERNAL_ACCESS_CODE) {
    redirect(`/delivery/login?next=${encodeURIComponent(nextPath)}&error=1`)
  }

  const cookieStore = await cookies()
  cookieStore.set(INTERNAL_COOKIE_NAME, 'granted', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  redirect(nextPath)
}
