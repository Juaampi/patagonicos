'use client'

import { buildMetaPurchaseEventId } from '@/lib/analytics-shared'
import type { CartItem, Product, ProductVariant } from '@/types/store'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

type AnalyticsItem = {
  item_id: string
  item_name: string
  item_category?: string
  item_variant?: string
  price: number
  quantity: number
}

type PurchasePayload = {
  currency?: string
  orderId: string
  orderNumber?: string | null
  shipping?: number
  tax?: number
  total: number
  items: AnalyticsItem[]
}

const DEFAULT_CURRENCY = 'ARS'

function isBrowser() {
  return typeof window !== 'undefined'
}

function isGaDebugEnabled() {
  if (!isBrowser()) {
    return false
  }

  const debugFromStorage = window.localStorage.getItem('pa2-ga-debug')
  if (debugFromStorage === '1') {
    return true
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('ga_debug') === '1' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function trackGtagEvent(name: string, params: Record<string, unknown>) {
  if (!isBrowser() || typeof window.gtag !== 'function') {
    return
  }

  window.gtag('event', name, {
    ...params,
    debug_mode: isGaDebugEnabled(),
  })
}

function trackMetaEvent(name: string, params: Record<string, unknown>, options?: { eventId?: string }) {
  if (!isBrowser() || typeof window.fbq !== 'function') {
    return
  }

  if (options?.eventId) {
    window.fbq('track', name, params, {
      eventID: options.eventId,
    })
    return
  }

  window.fbq('track', name, params)
}

function buildVariantLabel(colorName?: string, size?: string) {
  return [colorName, size].filter(Boolean).join(' - ')
}

export function mapCartItemToAnalyticsItem(item: CartItem): AnalyticsItem {
  return {
    item_id: item.productId,
    item_name: item.name,
    item_category: item.category,
    item_variant: buildVariantLabel(item.colorName, item.size),
    price: item.price,
    quantity: item.quantity,
  }
}

export function mapProductToAnalyticsItem(product: Product, variant?: ProductVariant | null): AnalyticsItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    item_variant: buildVariantLabel(variant?.colorName, variant?.size),
    price: product.price,
    quantity: 1,
  }
}

function buildMetaContents(items: AnalyticsItem[]) {
  return items.map((item) => ({
    id: item.item_id,
    quantity: item.quantity,
    item_price: item.price,
  }))
}

export function trackViewItem(product: Product, variant?: ProductVariant | null) {
  const item = mapProductToAnalyticsItem(product, variant)

  trackGtagEvent('view_item', {
    currency: DEFAULT_CURRENCY,
    value: item.price,
    items: [item],
  })

  trackMetaEvent('ViewContent', {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_category: item.item_category,
    content_type: 'product',
    contents: buildMetaContents([item]),
    currency: DEFAULT_CURRENCY,
    value: item.price,
  })
}

export function trackAddToCart(item: CartItem) {
  const analyticsItem = mapCartItemToAnalyticsItem(item)
  const value = analyticsItem.price * analyticsItem.quantity

  trackGtagEvent('add_to_cart', {
    currency: DEFAULT_CURRENCY,
    value,
    items: [analyticsItem],
  })

  trackMetaEvent('AddToCart', {
    content_ids: [analyticsItem.item_id],
    content_name: analyticsItem.item_name,
    content_category: analyticsItem.item_category,
    content_type: 'product',
    contents: buildMetaContents([analyticsItem]),
    currency: DEFAULT_CURRENCY,
    value,
  })
}

export function trackBeginCheckout(input: { currency?: string; total: number; shipping?: number; items: AnalyticsItem[] }) {
  const currency = input.currency ?? DEFAULT_CURRENCY

  trackGtagEvent('begin_checkout', {
    currency,
    value: input.total,
    shipping: input.shipping ?? 0,
    items: input.items,
  })

  trackMetaEvent('InitiateCheckout', {
    content_ids: input.items.map((item) => item.item_id),
    contents: buildMetaContents(input.items),
    content_type: 'product',
    currency,
    num_items: input.items.reduce((total, item) => total + item.quantity, 0),
    value: input.total,
  })
}

export function hasTrackedPurchase(orderId: string) {
  if (!isBrowser()) {
    return false
  }

  return window.sessionStorage.getItem(`pa2-purchase-${orderId}`) === '1'
}

export function markPurchaseTracked(orderId: string) {
  if (!isBrowser()) {
    return
  }

  window.sessionStorage.setItem(`pa2-purchase-${orderId}`, '1')
}

export function trackPurchase(input: PurchasePayload) {
  const currency = input.currency ?? DEFAULT_CURRENCY
  const transactionId = input.orderNumber?.trim() || input.orderId
  const metaEventId = buildMetaPurchaseEventId(input.orderId)

  trackGtagEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value: input.total,
    shipping: input.shipping ?? 0,
    tax: input.tax ?? 0,
    items: input.items,
  })

  trackMetaEvent('Purchase', {
    content_ids: input.items.map((item) => item.item_id),
    contents: buildMetaContents(input.items),
    content_type: 'product',
    currency,
    num_items: input.items.reduce((total, item) => total + item.quantity, 0),
    value: input.total,
  }, { eventId: metaEventId })
}
