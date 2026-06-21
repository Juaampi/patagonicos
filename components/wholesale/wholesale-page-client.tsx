'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Package, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { getAvailableSizes, getColorImages, getMainImage, getProductColors, getVariantForSelection } from '@/lib/variant-utils'
import { getSiteWhatsAppHref } from '@/lib/site-contact'
import type { CartItem, Product } from '@/types/store'
import {
  getWholesalePrice,
  getWholesaleValidation,
  WHOLESALE_MIN_UNITS,
  WHOLESALE_MIN_UNITS_PER_MODEL_COLOR,
} from '@/lib/wholesale'
import { formatPrice } from '@/lib/utils'

const WHOLESALE_STORAGE_KEY = 'pa2-wholesale-cart'
const INVALID_NUMBER_KEYS = ['e', 'E', '+', '-', '.', ',']

function normalizeWholesaleItem(item: CartItem): CartItem {
  return {
    ...item,
    salesChannel: 'WHOLESALE',
    maxStock: Math.max(item.maxStock ?? 0, item.quantity ?? 1, 9999),
  }
}

function normalizePositiveQuantity(value: string | number, fallback = 1) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return fallback
    }

    return Math.max(1, Math.floor(value))
  }

  const digitsOnly = value.replace(/\D/g, '')
  if (!digitsOnly) {
    return fallback
  }

  const parsed = Number(digitsOnly)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(1, Math.floor(parsed))
}

export function WholesalePageClient({
  products,
}: {
  products: Product[]
}) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const raw = window.localStorage.getItem(WHOLESALE_STORAGE_KEY)
      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw) as CartItem[]
      return Array.isArray(parsed) ? parsed.map(normalizeWholesaleItem) : []
    } catch {
      return []
    }
  })
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [selectionByProduct, setSelectionByProduct] = useState<Record<string, { colorName: string; size: string; quantity: number }>>({})
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    try {
      window.localStorage.setItem(WHOLESALE_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore local storage failures and keep the builder usable in memory.
    }
  }, [isHydrated, items])

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)
  const validation = useMemo(() => getWholesaleValidation(items), [items])
  const wholesaleMessage = useMemo(() => {
    if (items.length === 0) {
      return 'Hola Patagónicos, quiero consultar por compras mayoristas de indumentaria para mascotas.'
    }

    const lines = [
      'Hola Patagónicos, quiero enviarles este pedido mayorista:',
      '',
      ...items.map((item) => `- ${item.name} | ${item.colorName} | ${item.size} | ${item.quantity}u | ${formatPrice(item.price)} c/u`),
      '',
      `Total de unidades: ${validation.totalUnits}`,
      `Subtotal mayorista: ${formatPrice(subtotal)}`,
      '',
      'Quedo atento/a a confirmación de stock, envío y pasos siguientes.',
    ]

    return lines.join('\n')
  }, [items, subtotal, validation.totalUnits])

  function getSelection(product: Product) {
    const existing = selectionByProduct[product.id]
    if (existing) {
      return existing
    }

    const colors = getProductColors(product)
    const colorName = colors[0]?.name ?? ''
    const size = getAvailableSizes(product, colorName)[0]?.label ?? ''

    return {
      colorName,
      size,
      quantity: 1,
    }
  }

  function updateSelection(productId: string, patch: Partial<{ colorName: string; size: string; quantity: number }>) {
    setSelectionByProduct((current) => {
      const currentSelection = current[productId] ?? { colorName: '', size: '', quantity: 1 }
      const nextQuantity =
        patch.quantity == null ? currentSelection.quantity : normalizePositiveQuantity(patch.quantity, currentSelection.quantity)

      return {
        ...current,
        [productId]: {
          ...currentSelection,
          ...patch,
          quantity: nextQuantity,
        },
      }
    })
  }

  function addWholesaleItem(product: Product) {
    const selection = getSelection(product)
    const variant = getVariantForSelection(product, selection.colorName, selection.size)

    if (!variant || selection.quantity <= 0) {
      setFeedback('Elegí una variante válida antes de agregar al pedido mayorista.')
      window.setTimeout(() => setFeedback(null), 2400)
      return
    }

    const image =
      getColorImages(product, variant.colorName)[0] ??
      getMainImage(product) ??
      undefined

    const normalizedItem = normalizeWholesaleItem({
      id: `wholesale:${product.id}:${variant.sku}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      price: getWholesalePrice(product.price),
      compareAtPrice: product.price,
      imageUrl: image?.url ?? product.mainImageUrl,
      imageAlt: image?.alt ?? product.name,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      sku: variant.sku,
      quantity: selection.quantity,
      maxStock: 9999,
      salesChannel: 'WHOLESALE',
    })

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.sku === normalizedItem.sku)

      if (existingIndex === -1) {
        return [...current, normalizedItem]
      }

      return current.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              quantity: item.quantity + normalizedItem.quantity,
              maxStock: Math.max(item.maxStock, normalizedItem.maxStock),
            }
          : item,
      )
    })

    setFeedback(`Sumamos ${selection.quantity} unidad${selection.quantity > 1 ? 'es' : ''} de ${product.name}.`)
    window.setTimeout(() => setFeedback(null), 2200)
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.id !== id) {
          return [item]
        }

        const nextQuantity = Math.max(0, Math.floor(quantity))
        if (nextQuantity <= 0) {
          return []
        }

        return [{ ...item, quantity: nextQuantity }]
      }),
    )
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function clearItems() {
    setItems([])
  }

  return (
    <section className="shell pb-12 pt-32 md:pt-40">
      <div className="space-y-8">
        <div className="card-surface overflow-hidden border border-[#dbe7df] bg-[linear-gradient(135deg,#f8fbf9_0%,#eef4f1_38%,#f7f7f3_100%)]">
          <div className="grid gap-8 px-7 py-8 md:px-9 md:py-10 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="eyebrow">Canal exclusivo</p>
              <h1 className="mt-4 max-w-5xl font-display text-5xl tracking-[-0.06em] text-black/92 md:text-6xl">
                PATAGÓNICOS MAYORISTA 2026
              </h1>
              <p className="mt-4 text-xl font-medium tracking-[-0.03em] text-black/72">Indumentaria para mascotas</p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-black/62">
                Armá tu pedido mayorista con los productos reales de la colección, combinando modelos, colores y talles
                con precio especial directo desde la web.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-black/54">
                El envío corre por cuenta del comprador y se cotiza según el peso total del pedido y la localidad de entrega.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Pedido mínimo', value: `${WHOLESALE_MIN_UNITS} unidades`, icon: Package },
                { label: 'Modelo + color', value: `${WHOLESALE_MIN_UNITS_PER_MODEL_COLOR} unidades`, icon: ShieldCheck },
                { label: 'Descuento', value: '35% OFF', icon: ShieldCheck },
                { label: 'Cobertura', value: 'Todo el país', icon: Truck },
              ].map((item) => (
                <div key={item.label} className="rounded-[26px] border border-black/8 bg-white/80 p-5 backdrop-blur-sm">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#f6f6f2] text-black/80">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">{item.label}</p>
                  <p className="mt-2 text-2xl font-medium tracking-[-0.04em] text-black/88">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
          <div className="space-y-6">
            <div className="card-surface p-7 md:p-9">
              <p className="eyebrow">Colección disponible</p>
              <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] text-black md:text-5xl">
                Catálogo mayorista con los productos reales de la tienda
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
                Cada card permite elegir color, talle y cantidad. El precio mayorista se calcula automáticamente con el
                descuento correspondiente.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {products.map((product) => {
                const selection = getSelection(product)
                const colors = getProductColors(product)
                const sizes = getAvailableSizes(product, selection.colorName)
                const variant = getVariantForSelection(product, selection.colorName, selection.size)
                const image =
                  getColorImages(product, selection.colorName)[0] ??
                  getMainImage(product) ??
                  null

                return (
                  <article
                    key={product.id}
                    className="card-surface overflow-hidden border border-black/8 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#f3f3ef]">
                      {image ? (
                        <Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
                      ) : null}
                    </div>

                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">{product.category}</p>
                    <h3 className="mt-2 font-display text-3xl tracking-[-0.05em] text-black/90">{product.name}</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] border border-black/8 bg-[#fafaf8] px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-black/44">PVP</p>
                        <p className="mt-2 text-base font-medium text-black/82">{formatPrice(product.price)}</p>
                      </div>
                      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-emerald-700/80">Mayorista</p>
                        <p className="mt-2 text-base font-semibold text-emerald-900">{formatPrice(getWholesalePrice(product.price))}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.16em] text-black/48">Color</span>
                        <select
                          value={selection.colorName}
                          onChange={(event) => {
                            const nextColor = event.target.value
                            const nextSize = getAvailableSizes(product, nextColor)[0]?.label ?? ''
                            updateSelection(product.id, { colorName: nextColor, size: nextSize })
                          }}
                          className="w-full rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-3 text-sm outline-none"
                        >
                          {colors.map((color) => (
                            <option key={color.name} value={color.name}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_168px]">
                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.16em] text-black/48">Talle</span>
                          <select
                            value={selection.size}
                            onChange={(event) => updateSelection(product.id, { size: event.target.value })}
                            className="w-full rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-3 text-sm outline-none"
                          >
                            {sizes.map((size) => (
                              <option key={size.label} value={size.label}>
                                {size.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.16em] text-black/48">Cantidad</span>
                          <div className="flex min-w-[168px] items-center overflow-hidden rounded-[18px] border border-black/10 bg-[#f7f7f4]">
                            <button
                              type="button"
                              onClick={() =>
                                updateSelection(product.id, {
                                  quantity: Math.max(1, selection.quantity - 1),
                                })
                              }
                              className="inline-flex h-12 w-12 shrink-0 items-center justify-center text-black/70 transition hover:bg-black/5 hover:text-black"
                              aria-label={`Bajar cantidad de ${product.name}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={selection.quantity}
                              onKeyDown={(event) => {
                                if (INVALID_NUMBER_KEYS.includes(event.key)) {
                                  event.preventDefault()
                                }
                              }}
                              onChange={(event) =>
                                updateSelection(product.id, {
                                  quantity: normalizePositiveQuantity(event.target.value, selection.quantity),
                                })
                              }
                              className="h-12 min-w-[56px] flex-1 bg-transparent px-2 text-center text-sm font-medium outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateSelection(product.id, {
                                  quantity: selection.quantity + 1,
                                })
                              }
                              className="inline-flex h-12 w-12 shrink-0 items-center justify-center text-black/70 transition hover:bg-black/5 hover:text-black"
                              aria-label={`Subir cantidad de ${product.name}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-sm text-black/58">
                        <span>Stock sujeto a confirmación</span>
                        <span>Total variante: {formatPrice((variant ? getWholesalePrice(product.price) : 0) * selection.quantity)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addWholesaleItem(product)}
                        disabled={!variant}
                        className={`button-primary w-full justify-center ${!variant ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {!variant ? 'Elegí una variante' : 'Agregar al pedido mayorista'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="card-surface p-6 md:p-7">
              <p className="eyebrow">Pedido mayorista</p>
              <h2 className="mt-4 font-display text-3xl tracking-[-0.05em] text-black">Resumen del canal</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-[22px] border border-black/8 bg-[#fafaf8] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-black/44">Unidades cargadas</p>
                  <p className="mt-2 text-3xl font-semibold text-black/88">{validation.totalUnits}</p>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-[#fafaf8] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-black/44">Subtotal mayorista</p>
                  <p className="mt-2 text-3xl font-semibold text-black/88">{formatPrice(subtotal)}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm leading-7 text-black/62">
                <div className={`rounded-[20px] border px-4 py-3 ${validation.missingUnits > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                  {validation.missingUnits > 0
                    ? `Te faltan ${validation.missingUnits} unidades para alcanzar el mínimo mayorista de ${WHOLESALE_MIN_UNITS}.`
                    : `Ya alcanzaste el mínimo de ${WHOLESALE_MIN_UNITS} unidades.`}
                </div>

                <div className={`rounded-[20px] border px-4 py-3 ${validation.invalidColorGroups.length > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
                  {validation.invalidColorGroups.length > 0 ? (
                    <div>
                      <p className="font-medium">Todavía hay combinaciones por debajo de {WHOLESALE_MIN_UNITS_PER_MODEL_COLOR} unidades:</p>
                      <ul className="mt-2 space-y-1">
                        {validation.invalidColorGroups.map((group) => (
                          <li key={`${group.productId}-${group.colorName}`}>
                            {group.productName} · {group.colorName}: {group.quantity} unidad{group.quantity > 1 ? 'es' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    `Todas las combinaciones de modelo y color ya cumplen el mínimo de ${WHOLESALE_MIN_UNITS_PER_MODEL_COLOR} unidades.`
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href={getSiteWhatsAppHref('Hola Patagónicos, quiero consultar por un pedido mayorista y tengo algunas dudas antes de enviarlo.')}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary w-full justify-center"
                >
                  Consultar por WhatsApp
                </Link>
                {items.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearItems}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/72 transition hover:bg-black hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    Vaciar pedido mayorista
                  </button>
                ) : null}
              </div>
            </div>

            {items.length > 0 ? (
              <div className="card-surface p-6 md:p-7">
                <p className="eyebrow">Productos cargados</p>
                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-[22px] border border-black/8 p-4">
                      <div className="flex gap-4">
                        <div className="relative h-20 w-18 shrink-0 overflow-hidden rounded-[16px] bg-[#f3f3ef]">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.imageAlt ?? item.name} fill sizes="100px" className="object-contain" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-black/86">{item.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/44">
                            {item.colorName} · {item.size}
                          </p>
                          <p className="mt-2 text-sm font-medium text-black/72">{formatPrice(item.price)} por unidad</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center overflow-hidden rounded-full border border-black/10">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-9 w-9 items-center justify-center text-black/68 transition hover:bg-black/5 hover:text-black"
                            aria-label="Quitar unidad"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity}
                            onKeyDown={(event) => {
                              if (INVALID_NUMBER_KEYS.includes(event.key)) {
                                event.preventDefault()
                              }
                            }}
                            onChange={(event) => updateQuantity(item.id, normalizePositiveQuantity(event.target.value, item.quantity))}
                            className="h-9 min-w-[48px] bg-transparent px-2 text-center text-sm font-medium text-black/82 outline-none"
                            aria-label={`Cantidad de ${item.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center text-black/68 transition hover:bg-black/5 hover:text-black"
                            aria-label="Sumar unidad"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:bg-black hover:text-white"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        {items.length > 0 ? (
          <div className="card-surface overflow-hidden border border-[#cfe5d9] bg-[linear-gradient(135deg,#0f1720_0%,#18332b_45%,#2b5c46_100%)] p-7 text-white md:p-9">
            <p className="eyebrow text-white/60">Cierre del pedido</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em] md:text-5xl">
              Terminá tu selección y enviala directo por WhatsApp
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/76">
              Cuando cumplas el mínimo de {WHOLESALE_MIN_UNITS} unidades y el mínimo de {WHOLESALE_MIN_UNITS_PER_MODEL_COLOR}{' '}
              por modelo/color, podés enviarnos el resumen completo del pedido para confirmar stock, logística y pasos siguientes.
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">
              El costo de envío lo abona el comprador y se define según el peso final del pedido y la localidad de envío.
            </p>

            {validation.isValid ? (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={getSiteWhatsAppHref(wholesaleMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="button-primary inline-flex bg-white text-black hover:bg-[#f0f4ee]"
                >
                  Enviar pedido por WhatsApp
                </Link>
                <p className="text-sm leading-7 text-white/68">
                  El mensaje incluye productos, variantes, cantidades, unidades totales y subtotal mayorista.
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-[28px] border border-white/16 bg-white/8 p-6 text-sm leading-7 text-white/82">
                Todavía no se puede enviar el pedido porque faltan condiciones mínimas del canal mayorista.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
