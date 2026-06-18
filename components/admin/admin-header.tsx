'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { adminNavigationItems, adminPageMeta } from './admin-navigation'

function getCurrentPage(pathname: string) {
  const matchedItem = adminNavigationItems.find((item) =>
    item.match.some((matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`)),
  )

  if (!matchedItem) {
    return {
      title: 'Admin',
      subtitle: 'Gestion interna del negocio.',
    }
  }

  return adminPageMeta[matchedItem.href]
}

export function AdminHeader() {
  const pathname = usePathname()
  const currentPage = getCurrentPage(pathname)
  const today = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return (
    <header className="sticky top-0 z-30 mb-8 border-b border-black/8 bg-[rgba(245,245,243,0.88)] backdrop-blur-xl">
      <div className="shell py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Admin modular</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-0.05em] text-black/90">{currentPage.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/58">{currentPage.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span suppressHydrationWarning className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-black/55">
              {today}
            </span>
            <Link
              href="/admin/repartos"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/76 transition hover:bg-black hover:text-white"
            >
              Repartos del dia
            </Link>
            <Link
              href="/admin/logout"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black/76 transition hover:bg-black hover:text-white"
            >
              Salir
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
