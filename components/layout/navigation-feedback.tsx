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

const MIN_VISIBLE_MS = 420
const SAFETY_TIMEOUT_MS = 12000

export function NavigationFeedback() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const safetyTimeoutRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const activeRequestsRef = useRef(0)
  const navigationPendingRef = useRef(false)

  const clearTimers = () => {
    if (safetyTimeoutRef.current) {
      window.clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  const showLoader = () => {
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now()
    }

    clearTimers()
    setIsLoading(true)

    safetyTimeoutRef.current = window.setTimeout(() => {
      activeRequestsRef.current = 0
      navigationPendingRef.current = false
      startedAtRef.current = null
      setIsLoading(false)
      clearTimers()
    }, SAFETY_TIMEOUT_MS)
  }

  const syncLoader = () => {
    if (activeRequestsRef.current > 0 || navigationPendingRef.current) {
      showLoader()
      return
    }

    const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : 0
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false)
      startedAtRef.current = null
      clearTimers()
    }, remaining)
  }

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

      navigationPendingRef.current = true
      showLoader()
    }

    const handleSubmit = (event: SubmitEvent) => {
      const target = event.target

      if (!(target instanceof HTMLFormElement)) {
        return
      }

      navigationPendingRef.current = true
      showLoader()
    }

    const handleRequestStart = () => {
      activeRequestsRef.current += 1
      showLoader()
    }

    const handleRequestStop = () => {
      activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1)
      syncLoader()
    }

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      handleRequestStart()

      try {
        return await originalFetch(...args)
      } finally {
        handleRequestStop()
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('submit', handleSubmit)
    window.addEventListener('pa2-loading:start', handleRequestStart)
    window.addEventListener('pa2-loading:stop', handleRequestStop)

    return () => {
      window.fetch = originalFetch
      document.removeEventListener('click', handleClick)
      document.removeEventListener('submit', handleSubmit)
      window.removeEventListener('pa2-loading:start', handleRequestStart)
      window.removeEventListener('pa2-loading:stop', handleRequestStop)
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (!navigationPendingRef.current) {
      return
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })

    navigationPendingRef.current = false
    syncLoader()
  }, [pathname, searchParams])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[140] h-[3px] transition-opacity duration-300 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="nav-loader-shell h-full w-full">
        <div className="nav-loader-track h-full w-full" />
        <div className="nav-loader-sweep h-full" />
      </div>
    </div>
  )
}
