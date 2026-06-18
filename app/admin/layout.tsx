import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { AdminLayout } from '@/components/admin/admin-layout'

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-admin-pathname') ?? ''

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return <AdminLayout>{children}</AdminLayout>
}
