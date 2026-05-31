'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { useCart } from '@/components/cart/cart-provider'
import type { StoreSettingsSnapshot } from '@/lib/store-settings'
import { formatPrice } from '@/lib/utils'

export function CartPageClient({
  settings,
}: {
  settings: StoreSettingsSnapshot
}) {
  const { isHydrated, items, subtotal, updateQuantity, removeItem } = useCart()

  if (!isHydrated) {
    return (
      <section className="shell pb-12 pt-32">
        <div className="card-surface mx-auto max-w-3xl p-8 text-center">
          <p className="eyebrow">Carrito</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Cargando tu carrito</h1>
          <p className="mt-4 text-sm leading-7 text-black/60">
            Estamos recuperando tu selección para que puedas seguir comprando.
          </p>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="shell pb-12 pt-32">
        <div className="card-surface mx-auto max-w-3xl p-8 text-center">
          <p className="eyebrow">Carrito</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Todavía no agregaste productos</h1>
          <p className="mt-4 text-sm leading-7 text-black/60">
            Elegí color, talle y sumá productos al carrito para avanzar con la compra.
          </p>
          <Link href="/productos" className="button-primary mt-8 inline-flex">
            Ver productos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="shell pb-12 pt-32">
      <div className="space-y-8">
        <div className="card-surface p-7">
          <p className="eyebrow">Carrito</p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-4xl tracking-[-0.05em] md:text-5xl">Tu selección</h1>
              <p className="mt-3 text-sm leading-7 text-black/60">
                Revisá cantidades, variantes y después completá checkout en el mismo flujo.
              </p>
            </div>
            <div className="rounded-[22px] border border-black/8 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-black/46">Subtotal actual</p>
              <p className="mt-2 text-2xl font-semibold text-black/84">{formatPrice(subtotal)}</p>
            </div>
          </div>
        </div>

        <div className="card-surface p-7">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-[26px] border border-black/8 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[#f3f3ef]">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.imageAlt ?? item.name} fill className="object-contain" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/productos/${item.slug}`} className="line-clamp-2 text-base font-medium text-black/84 hover:underline md:text-lg">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/44">{item.category}</p>
                    <p className="mt-3 text-sm text-black/60">
                      {item.colorName} · {item.size}
                    </p>
                    <p className="mt-2 font-semibold text-black/84">{formatPrice(item.price)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
                  <div className="flex items-center rounded-full border border-black/10">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="inline-flex h-10 w-10 items-center justify-center text-black/68 transition hover:bg-black/5 hover:text-black"
                      aria-label="Quitar unidad"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-medium text-black/82">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="inline-flex h-10 w-10 items-center justify-center text-black/68 transition hover:bg-black/5 hover:text-black"
                      aria-label="Sumar unidad"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="min-w-24 text-right font-semibold text-black/84">{formatPrice(item.price * item.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:bg-black hover:text-white"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <CheckoutForm items={items} settings={settings} />
      </div>
    </section>
  )
}
