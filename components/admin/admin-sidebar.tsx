'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { adminNavigationItems } from './admin-navigation'

function isItemActive(pathname: string, matchers: string[]) {
  return matchers.some((matcher) => pathname === matcher || (matcher !== '/admin' && pathname.startsWith(`${matcher}/`)))
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
      <div className="card-surface overflow-hidden">
        <div className="border-b border-black/8 bg-[linear-gradient(135deg,#f9faf6_0%,#f0f1ea_100%)] px-4 py-4">
          <p className="eyebrow">Panel privado</p>
          <h1 className="mt-2 font-display text-[30px] leading-none tracking-[-0.05em] text-black/90">Admin</h1>
          <p className="mt-2 text-[11px] leading-5 text-black/54">Tienda, pedidos y reparto.</p>
        </div>

        <nav className="space-y-1.5 p-2.5">
          {adminNavigationItems.map((item) => {
            const Icon = item.icon
            const active = isItemActive(pathname, item.match)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-w-0 items-center gap-2.5 rounded-[16px] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                  active
                    ? 'border border-[#d9ddd0] bg-[#eef2e7] text-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]'
                    : 'border border-black/8 text-black/72 hover:bg-[#f6f6f3] hover:text-black'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-black' : 'text-black/62 group-hover:text-black'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
