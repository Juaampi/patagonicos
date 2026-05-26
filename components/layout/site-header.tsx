'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { Logo } from '@/components/brand/logo'
import type { StoreSettingsSnapshot } from '@/lib/store-settings'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/guia-de-talles', label: 'Guía de talles' },
  { href: '/envios', label: 'Envíos' },
  { href: '/contacto', label: 'Contacto' },
]

const productLinks = [
  { href: '/productos?animal=DOG', label: 'Perros' },
  { href: '/productos?animal=CAT', label: 'Gatos' },
]

export function SiteHeader({ settings }: { settings: StoreSettingsSnapshot }) {
  const pathname = usePathname()
  const { itemCount, isHydrated } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let timeout = 0

    const handleCartPulse = () => {
      setCartAnimating(false)
      window.clearTimeout(timeout)
      window.requestAnimationFrame(() => {
        setCartAnimating(true)
        timeout = window.setTimeout(() => setCartAnimating(false), 760)
      })
    }

    window.addEventListener('pa2-cart-pulse', handleCartPulse)
    return () => {
      window.removeEventListener('pa2-cart-pulse', handleCartPulse)
      window.clearTimeout(timeout)
    }
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-black text-white">
        <div className="shell flex min-h-9 items-center justify-center px-3 py-1 text-center text-[9px] font-medium uppercase leading-tight tracking-[0.12em] text-white/88 md:min-h-10 md:px-4 md:py-0 md:text-xs md:tracking-[0.18em]">
          <span className="max-w-[34rem] md:max-w-none">
            Envío gratis a todo Argentina
            {settings.barilocheEnabled ? (
              <>
                {' '}· <BarilocheDeliveryCountdown light className="text-white/88" />
              </>
            ) : null}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'transition-all duration-300',
          !scrolled && pathname === '/'
            ? 'border-b border-white/10 bg-white/32 text-black backdrop-blur-xl'
            : 'border-b border-black/8 bg-white/96 text-black backdrop-blur',
        )}
      >
        <div className="shell flex items-center justify-between gap-2 py-2 md:gap-4 md:py-3.5">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-black/10 text-black/82 transition hover:bg-black/4"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div className="min-w-0 shrink max-[420px]:scale-[0.88] max-[420px]:origin-left">
            <Logo />
          </div>

          <nav className="hidden items-center gap-5 lg:flex">
            <Link
              href="/"
              className="text-[12px] font-semibold uppercase tracking-[0.12em] text-black/88 transition hover:text-black"
            >
              Inicio
            </Link>
            <div className="group relative">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/88 transition hover:text-black"
              >
                Productos
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <div className="invisible absolute left-0 top-full mt-3 min-w-48 rounded-[24px] border border-black/8 bg-white p-3 opacity-0 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition duration-200 group-hover:visible group-hover:opacity-100">
                {productLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-[16px] px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-black/74 transition hover:bg-[#f6f6f3] hover:text-black"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-black/88 transition hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 md:gap-2">
            <button
              type="button"
              aria-label="Buscar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/82 transition hover:bg-black/4 hover:text-black md:h-9 md:w-9"
            >
              <Search className="h-4 w-4 md:h-4.5 md:w-4.5" />
            </button>
            <Link
              href="/perfil"
              aria-label="Perfil"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black/82 transition hover:bg-black/4 hover:text-black md:h-9 md:w-9"
            >
              <UserRound className="h-4 w-4 md:h-4.5 md:w-4.5" />
            </Link>
            <Link
              href="/carrito"
              aria-label="Carrito"
              className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full text-black/82 transition hover:bg-black/4 hover:text-black md:h-9 md:w-9 ${
                cartAnimating ? 'cart-bounce cart-ring bg-black/[0.04]' : ''
              }`}
            >
              <ShoppingBag className="h-4 w-4 md:h-4.5 md:w-4.5" />
              {isHydrated ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[8px] font-bold text-white md:h-5 md:min-w-5 md:text-[10px]">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-black/8 bg-white lg:hidden">
            <div className="shell space-y-2 py-4">
              <Link
                href="/"
                className="block rounded-[18px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/86 transition hover:bg-[#f5f5f2]"
              >
                Inicio
              </Link>
              <div className="rounded-[22px] border border-black/8 bg-[#fafaf7] p-2">
                <button
                  type="button"
                  onClick={() => setProductsOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[16px] px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-black/86"
                >
                  Productos
                  <ChevronDown className={cn('h-4 w-4 transition', productsOpen ? 'rotate-180' : '')} />
                </button>
                {productsOpen ? (
                  <div className="space-y-1 px-1 pb-1">
                    {productLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-[14px] px-3 py-3 text-[12px] uppercase tracking-[0.1em] text-black/72 transition hover:bg-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-[18px] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/86 transition hover:bg-[#f5f5f2]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
