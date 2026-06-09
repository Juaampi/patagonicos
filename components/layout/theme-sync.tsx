'use client'

import { useEffect } from 'react'

type ThemeMode = 'light' | 'dark'

function resolveTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem('pa2-theme')
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
  document.body.classList.toggle('theme-dark-body', theme === 'dark')
}

export function ThemeSync() {
  useEffect(() => {
    const syncTheme = () => {
      applyTheme(resolveTheme())
    }

    syncTheme()

    const onVisibilityChange = () => {
      if (!document.hidden) {
        syncTheme()
      }
    }

    window.addEventListener('pageshow', syncTheme)
    window.addEventListener('focus', syncTheme)
    window.addEventListener('storage', syncTheme)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', syncTheme)
      window.removeEventListener('focus', syncTheme)
      window.removeEventListener('storage', syncTheme)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}
