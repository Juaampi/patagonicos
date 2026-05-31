'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

function shouldHandleNavigation(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href')

  if (!href || href.startsWith('#')) {
    return false
  }

  if (anchor.target && anchor.target !== '_self') {
    return false
  }

  if (anchor.hasAttribute('download')) {
    return false
  }

  const url = new URL(anchor.href, window.location.href)

  if (url.origin !== window.location.origin) {
    return false
  }

  return url.pathname + url.search !== window.location.pathname + window.location.search
}

export function NavigationFeedback() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a')
      if (!(anchor instanceof HTMLAnchorElement) || !shouldHandleNavigation(anchor)) {
        return
      }

      setIsLoading(true)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsLoading(false)
      }, 5000)
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    window.requestAnimationFrame(() => {
      setIsLoading(false)
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [pathname, searchParams])

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed bottom-0 left-0 right-0 z-[120] h-[2px] overflow-hidden bg-black/8 transition-opacity duration-300 ${
          isLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="nav-loader-sweep h-full w-[34%] rounded-full bg-black" />
      </div>

      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-3 left-3 z-[121] rounded-full border border-black/8 bg-white/92 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/56 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur transition-all duration-300 md:bottom-4 md:left-4 ${
          isLoading ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        Cargando
      </div>
    </>
  )
}
