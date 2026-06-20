'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-access-shared'
import { env } from '@/lib/env'

export async function hasAdminAccess() {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === 'granted'
}

export async function adminLoginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const nextPath = String(formData.get('next') ?? '/admin/dashboard').trim() || '/admin/dashboard'

  if (email !== env.ADMIN_EMAIL.toLowerCase()) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}&error=1`)
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, 'granted', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })

  redirect(nextPath)
}

export async function clearAdminAccess() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}
