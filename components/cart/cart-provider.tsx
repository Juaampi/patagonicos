'use client'

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { trackAddToCart } from '@/lib/client/analytics'
import type { CartItem } from '@/types/store'

const CART_STORAGE_KEY = 'pa2-cart'

type CartContextValue = {
  isHydrated: boolean
  items: CartItem[]
  itemCount: number
  subtotal: number
  cartPulseKey: number
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function normalizeStoredItem(item: CartItem): CartItem {
  return {
    ...item,
    maxStock: Math.max(item.maxStock ?? 0, item.quantity ?? 1, 10),
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartPulseKey, setCartPulseKey] = useState(0)
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw) as CartItem[]
      return Array.isArray(parsed) ? parsed.map(normalizeStoredItem) : []
    } catch {
      return []
    }
  })
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage write failures and keep in-memory cart usable.
    }
  }, [isHydrated, items])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

    return {
      isHydrated,
      items,
      itemCount,
      subtotal,
      cartPulseKey,
      addItem(item) {
        const normalizedItem = normalizeStoredItem(item)

        setItems((current) => {
          const existingIndex = current.findIndex((entry) => entry.sku === normalizedItem.sku)
          if (existingIndex === -1) {
            return [...current, normalizedItem]
          }

          return current.map((entry, index) =>
            index === existingIndex
              ? {
                  ...entry,
                  maxStock: Math.max(entry.maxStock, normalizedItem.maxStock, entry.quantity, 1),
                  quantity: Math.min(
                    entry.quantity + normalizedItem.quantity,
                    Math.max(entry.maxStock, normalizedItem.maxStock, entry.quantity, 1),
                  ),
                }
              : entry,
          )
        })
        trackAddToCart(normalizedItem)
        setCartPulseKey((current) => current + 1)
        window.dispatchEvent(new CustomEvent('pa2-cart-pulse'))
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id))
      },
      updateQuantity(id, quantity) {
        setItems((current) =>
          current.flatMap((item) => {
            if (item.id !== id) {
              return [item]
            }

            const nextQuantity = Math.max(0, Math.min(quantity, Math.max(item.maxStock, item.quantity, 1)))
            if (nextQuantity <= 0) {
              return []
            }

            return [{ ...item, quantity: nextQuantity }]
          }),
        )
      },
      clearCart() {
        setItems([])
      },
    }
  }, [cartPulseKey, isHydrated, items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
