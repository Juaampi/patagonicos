'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'

const WHATSAPP_FALLBACK_HREF = '/contacto'

function WhatsAppMonoIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 2.7a7.3 7.3 0 0 0-6.23 11.08L2.7 17.3l3.63-1A7.3 7.3 0 1 0 10 2.7Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.55 7.33c.16-.37.34-.39.51-.4.14-.01.29-.01.43 0 .14.01.33-.05.51.39.18.43.61 1.49.67 1.59.06.11.09.24.02.39-.07.15-.11.24-.21.37-.11.13-.23.27-.33.36-.11.1-.22.2-.09.41.13.2.57.93 1.22 1.51.84.75 1.55.98 1.77 1.09.22.11.35.09.47-.06.12-.15.54-.62.68-.83.15-.21.29-.18.5-.11.2.07 1.29.61 1.51.71.22.11.36.16.42.25.06.09.06.51-.12 1.01-.18.5-1.05.98-1.45 1.03-.4.06-.77.24-2.6-.47-2.19-.85-3.61-2.96-3.72-3.1-.12-.15-.9-1.19-.9-2.28 0-1.09.57-1.61.77-1.84Z"
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

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/delivery')) {
    return null
  }

  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-3 md:bottom-6 md:right-6">
      <Link
        href={WHATSAPP_FALLBACK_HREF}
        aria-label="WhatsApp"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white"
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center">
          <WhatsAppMonoIcon className="h-[22px] w-[22px]" />
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
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
            {itemCount}
          </span>
        ) : null}
      </Link>
    </div>
  )
}
