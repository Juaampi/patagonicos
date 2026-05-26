import type { ReactNode } from 'react'
import { AdminHeader } from './admin-header'
import { AdminSidebar } from './admin-sidebar'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminHeader />
      <section className="shell pb-12">
        <div className="grid gap-5 xl:grid-cols-[198px_1fr]">
          <AdminSidebar />
          <main className="min-w-0 space-y-8">{children}</main>
        </div>
      </section>
    </>
  )
}
