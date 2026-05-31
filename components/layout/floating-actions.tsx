'use client'

import Link from 'next/link'
import { MessageCircle, ShoppingBag } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'

const WHATSAPP_FALLBACK_HREF = '/contacto'

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
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:bg-black hover:text-white"
      >
        <MessageCircle className="h-5 w-5" />
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
