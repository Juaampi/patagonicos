'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Moon, ShoppingBag, Sun, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { Logo } from '@/components/brand/logo'
import type { StoreSettingsSnapshot } from '@/lib/store-settings'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/adoptame', label: 'Mascotas en adopción' },
  { href: '/envios', label: 'Envíos' },
]

type ThemeMode = 'light' | 'dark'

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
  document.body.classList.toggle('theme-dark-body', theme === 'dark')
  window.localStorage.setItem('pa2-theme', theme)
}

export function SiteHeader({ settings }: { settings: StoreSettingsSnapshot }) {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount, isHydrated } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartAnimating, setCartAnimating] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('light')

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const datasetTheme = document.documentElement.dataset.theme

      if (datasetTheme === 'dark' || datasetTheme === 'light') {
        setTheme(datasetTheme)
        return
      }

      const storedTheme = window.localStorage.getItem('pa2-theme')
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme)
        return
      }

      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const updateTheme = (nextTheme: ThemeMode) => {
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  const handleMobileNavigation = (href: string) => {
    setMobileOpen(false)
    router.push(href)
  }

  const renderThemeToggle = (compact = false) => (
    <div
      className={cn(
        'inline-flex items-center rounded-full border backdrop-blur-sm',
        compact ? 'border-black/10 bg-black/[0.03] p-1' : 'border-black/10 bg-white/78 p-1 shadow-[0_10px_28px_rgba(0,0,0,0.06)]',
      )}
      aria-label="Selector de tema"
    >
      <button
        type="button"
        aria-pressed={theme === 'light'}
        onClick={() => updateTheme('light')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition',
          theme === 'light' ? 'bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]' : 'text-black/68 hover:text-black',
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        Claro
      </button>
      <button
        type="button"
        aria-pressed={theme === 'dark'}
        onClick={() => updateTheme('dark')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition',
          theme === 'dark' ? 'bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]' : 'text-black/68 hover:text-black',
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        Oscuro
      </button>
    </div>
  )

  const shippingHeadline = 'Envíos a todo el país'
  const freeShippingHeadline = `Envío gratis desde ${new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(settings.localDeliveryFreeThreshold)}`

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-black text-white">
        <div className="top-strip-marquee px-3 md:px-4">
          <div className="top-strip-track text-[9px] font-medium uppercase leading-tight tracking-[0.12em] text-white/88 md:text-xs md:tracking-[0.18em]">
            <div className="top-strip-group">
              <span>{shippingHeadline}</span>
              <span>{freeShippingHeadline}</span>
              {settings.barilocheEnabled ? <BarilocheDeliveryCountdown light className="text-white/88" /> : null}
            </div>
            <div className="top-strip-group" aria-hidden="true">
              <span>{shippingHeadline}</span>
              <span>{freeShippingHeadline}</span>
              {settings.barilocheEnabled ? <BarilocheDeliveryCountdown light className="text-white/88" /> : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'transition-all duration-300',
          !scrolled && pathname === '/'
            ? 'border-b border-white/10 bg-white/40 text-black backdrop-blur-xl'
            : 'border-b border-black/8 bg-white/92 text-black backdrop-blur-xl',
        )}
      >
        <div className="shell flex items-center justify-between gap-3 py-2 md:gap-5 md:py-2.5">
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

          <div className="min-w-0 shrink">
            <Logo variant="header" inverted={theme === 'dark'} />
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            <nav className="flex items-center gap-1 rounded-full border border-black/8 bg-white/72 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
              {navItems.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-full px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition',
                      isActive ? 'bg-black !text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]' : 'text-black/76 hover:bg-black/5 hover:text-black',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            {renderThemeToggle()}
          </div>

          <div className="flex items-center gap-0.5 md:gap-2">
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
          <div className="border-t border-black/8 bg-white/96 backdrop-blur-xl lg:hidden">
            <div className="shell space-y-3 py-4">
              <div className="rounded-[24px] border border-black/8 bg-[#fafaf7] p-2.5">
                <div className="grid gap-1.5">
                  {navItems.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => handleMobileNavigation(item.href)}
                        className={cn(
                          'block w-full rounded-[18px] px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.12em] transition',
                          isActive ? 'bg-black !text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]' : 'text-black/86 hover:bg-white',
                        )}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-center">
                {renderThemeToggle(true)}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
