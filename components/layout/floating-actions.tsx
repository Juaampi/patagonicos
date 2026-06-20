'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { getSiteWhatsAppHref } from '@/lib/site-contact'

function WhatsAppMonoIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 3.25c-4.83 0-8.75 3.78-8.75 8.44 0 1.58.45 3.06 1.24 4.33L3.25 20.75l4.9-1.2a8.92 8.92 0 0 0 3.85.88c4.83 0 8.75-3.78 8.75-8.44S16.83 3.25 12 3.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.26 8.36c.18-.41.37-.44.63-.45.11 0 .24 0 .39.01.16.01.37-.04.57.43.19.47.64 1.63.69 1.75.06.12.1.27.02.43-.07.17-.12.27-.24.41-.12.15-.25.31-.36.41-.12.11-.24.23-.1.46.14.23.64 1.04 1.37 1.69.95.84 1.74 1.1 1.99 1.21.24.12.39.1.53-.07.14-.17.61-.7.77-.93.17-.24.33-.2.55-.12.23.07 1.45.68 1.69.81.24.12.4.18.45.28.06.1.06.56-.13 1.11-.2.55-1.17 1.08-1.61 1.13-.45.06-.87.26-2.89-.53-2.43-.94-4.01-3.29-4.13-3.45-.12-.16-1-1.31-1-2.51 0-1.21.64-1.8.87-2.05Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function FloatingActions() {
  const pathname = usePathname()
  const { itemCount, isHydrated } = useCart()
  const [cartAnimating, setCartAnimating] = useState(false)

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

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/adminpatagonicos') || pathname?.startsWith('/delivery')) {
    return null
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-3 md:bottom-6 md:right-6">
      <Link
        href={getSiteWhatsAppHref('Hola, quiero hacer una consulta sobre Patagónicos.')}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center">
          <WhatsAppMonoIcon className="block h-5 w-5" />
        </span>
      </Link>

      <Link
        href="/carrito"
        aria-label="Ir al carrito"
        className={`relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-black hover:text-white ${
          cartAnimating ? 'cart-bounce cart-ring' : ''
        }`}
      >
        <ShoppingBag className="h-5 w-5" />
        {isHydrated && itemCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-bold text-white shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
            {itemCount}
          </span>
        ) : null}
      </Link>
    </div>
  )
}
