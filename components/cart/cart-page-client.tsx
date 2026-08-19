'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Minus, Plus, Sparkles, Trash2 } from 'lucide-react'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { useCart } from '@/components/cart/cart-provider'
import { buildCartPricingSummary, getComboDiscountedPrice, getComboSavings } from '@/lib/combo-pricing'
import { TRANSFER_DISCOUNT_PERCENT, type StoreSettingsSnapshot } from '@/lib/store-settings'
import type { Product } from '@/types/store'
import { formatPrice } from '@/lib/utils'

export function CartPageClient({
  settings,
  freeShippingUpsellProduct,
  products,
}: {
  settings: StoreSettingsSnapshot
  freeShippingUpsellProduct: Product | null
  products: Product[]
}) {
  const { isHydrated, items, subtotal, updateQuantity, removeItem, addItem } = useCart()
  const comboSummary = buildCartPricingSummary(items)
  const comboDiscountAmount = comboSummary.twoForOneDiscount
  const comboLinkDiscountAmount = comboSummary.comboLinkDiscount
  const freeShippingDifference = Math.max(settings.localDeliveryFreeThreshold - subtotal, 0)
  const humanGiftSuggestions = products.filter(
    (product) =>
      product.animalType === 'HUMAN' &&
      product.variants.some((variant) => variant.stock > 0) &&
      !items.some((item) => item.productId === product.id),
  )
  const comboSuggestions = products.filter(
    (product) =>
      !items.some((item) => item.productId === product.id) &&
      product.comboEligibleFrom?.some((combo) => items.some((item) => item.productId === combo.productId)),
  )
  const suggestedVariant =
    freeShippingUpsellProduct?.variants.find((variant) => variant.stock > 0) ?? null
  const suggestedImage =
    (suggestedVariant
      ? freeShippingUpsellProduct?.images.find(
          (image) => image.type === 'COLOR' && image.colorName === suggestedVariant.colorName,
        )
      : null) ??
    freeShippingUpsellProduct?.images[0] ??
    null
  const suggestionAlreadyInCart = suggestedVariant
    ? items.some((item) => item.sku === suggestedVariant.sku)
    : false
  const shouldShowFreeShippingUpsell =
    freeShippingDifference > 0 &&
    Boolean(freeShippingUpsellProduct && suggestedVariant && !suggestionAlreadyInCart)

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
              <p className="mt-2 text-sm text-black/38 line-through">{formatPrice(comboSummary.grossSubtotal)}</p>
              <p className="mt-2 text-2xl font-semibold text-black/84">{formatPrice(subtotal)}</p>
              {(comboDiscountAmount > 0 || comboLinkDiscountAmount > 0) ? (
                <p className="mt-2 text-sm font-medium text-black/66">
                  Ahorrás {formatPrice(comboDiscountAmount + comboLinkDiscountAmount)} antes de envío y otros descuentos.
                </p>
              ) : null}
              {comboDiscountAmount > 0 ? (
                <p className="mt-2 text-sm leading-6 text-emerald-700">Incluye {formatPrice(comboDiscountAmount)} de ahorro por promo 2x1.</p>
              ) : null}
              {comboLinkDiscountAmount > 0 ? (
                <p className="mt-2 text-sm leading-6 text-sky-700">Incluye {formatPrice(comboLinkDiscountAmount)} de ahorro por combos entre prendas.</p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-amber-700">
                {TRANSFER_DISCOUNT_PERCENT}% off por transferencia.
              </p>
            </div>
          </div>
        </div>

        <div className="card-surface p-7">
          {comboDiscountAmount > 0 ? (
            <div className="mb-5 rounded-[24px] border border-emerald-200 bg-[linear-gradient(135deg,#f5fbf7_0%,#edf7f1_52%,#e2f3ea_100%)] px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">Promo 2x1 activa</p>
              <p className="mt-2 text-sm leading-7 text-emerald-950">
                Ya se descontaron <strong>{formatPrice(comboDiscountAmount)}</strong> por las unidades gratis de tus productos promocionados.
              </p>
            </div>
          ) : null}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 rounded-[26px] border border-black/8 p-4 md:flex-row md:items-center md:justify-between">
                {(() => {
                  const originalLineTotal = item.price * item.quantity
                  const discountedLineTotal = comboSummary.lineTotalsByItemId.get(item.id) ?? originalLineTotal
                  const lineSavings = Math.max(0, originalLineTotal - discountedLineTotal)
                  const comboUnits = comboSummary.comboDiscountedUnitsByItemId.get(item.id) ?? 0
                  const comboDiscountPercent =
                    comboUnits > 0
                      ? item.comboEligibleFrom?.find((combo) => items.some((cartItem) => cartItem.productId === combo.productId))?.discountPercent ?? 25
                      : 25

                  return (
                    <>
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
                    {item.comboArmable ? (
                      <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                        2x1 armable
                      </p>
                    ) : null}
                    {(comboSummary.freeUnitsByItemId.get(item.id) ?? 0) > 0 ? (
                      <p className="mt-2 text-sm font-medium text-emerald-700">
                        Ya tenés {(comboSummary.freeUnitsByItemId.get(item.id) ?? 0)} unidad gratis aplicada.
                      </p>
                    ) : item.comboArmable ? (
                      <p className="mt-2 text-sm font-medium text-emerald-700">Sumando una más de este producto, la segunda te queda gratis.</p>
                    ) : null}
                    {(comboSummary.comboDiscountedUnitsByItemId.get(item.id) ?? 0) > 0 ? (
                      <p className="mt-2 text-sm font-medium text-sky-700">
                        Ya tenés {(comboSummary.comboDiscountedUnitsByItemId.get(item.id) ?? 0)} unidad combo con 25% off.
                      </p>
                    ) : null}
                    {comboUnits > 0 ? (
                      <p className="mt-2 text-sm text-sky-800">
                        Precio combo por unidad: <span className="text-black/38 line-through">{formatPrice(item.price)}</span>{' '}
                        <span className="font-semibold">{formatPrice(getComboDiscountedPrice(item.price, comboDiscountPercent))}</span>
                      </p>
                    ) : null}
                    {lineSavings > 0 ? (
                      <p className="mt-2 text-sm font-medium text-black/72">En esta línea ahorrás {formatPrice(lineSavings)}.</p>
                    ) : null}
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
                  <div className="min-w-24 text-right">
                    {lineSavings > 0 ? (
                      <p className="text-xs text-black/38 line-through">{formatPrice(originalLineTotal)}</p>
                    ) : null}
                    <p className="font-semibold text-black/84">{formatPrice(discountedLineTotal)}</p>
                    {lineSavings > 0 ? (
                      <p className="text-xs font-medium text-emerald-700">- {formatPrice(lineSavings)}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:bg-black hover:text-white"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                    </>
                  )
                })()}
              </div>
            ))}
          </div>
        </div>

        {comboSuggestions.length > 0 ? (
          <div className="card-surface overflow-hidden border border-sky-200 bg-[linear-gradient(135deg,#f2f8ff_0%,#ebf5ff_100%)] p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">Prendas combo</p>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.05em] text-sky-950">Agregá estas prendas con 25% off</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-sky-950/80">
                  Como ya tenés una prenda que habilita combo, estas opciones quedan destacadas para completar el look con descuento.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {comboSuggestions.slice(0, 6).map((product) => (
                <div key={product.id} className="rounded-[24px] border border-sky-200 bg-white/90 p-4">
                  <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-800">
                    Combo 25% off
                  </p>
                  <p className="mt-3 text-base font-semibold text-black/84">{product.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/44">{product.category}</p>
                  <p className="mt-3 text-sm font-medium text-sky-800">Agregá esta prenda combo con 25% de descuento.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-black/38 line-through">{formatPrice(product.price)}</span>
                    <span className="font-semibold text-sky-900">{formatPrice(getComboDiscountedPrice(product.price, 25))}</span>
                    <span className="text-sky-700">Ahorrás {formatPrice(getComboSavings(product.price, 25))}</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link href={`/productos/${product.slug}`} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/76 transition hover:bg-black hover:text-white">
                      Ver producto
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {humanGiftSuggestions.length > 0 ? (
          <div className="card-surface overflow-hidden border border-rose-200 bg-[linear-gradient(135deg,#fff8f3_0%,#fff3ed_55%,#fce8e1_100%)] p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-800">Para vos también</p>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.05em] text-rose-950">Regalate algo vos también</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-rose-950/80">
                  Ya que estás comprando para tu perruno, te mostramos algunas prendas para vos que también están disponibles.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {humanGiftSuggestions.slice(0, 3).map((product) => {
                const variant = product.variants.find((entry) => entry.stock > 0)
                const image =
                  (variant
                    ? product.images.find((entry) => entry.type === 'COLOR' && entry.colorName === variant.colorName)
                    : null) ??
                  product.images[0] ??
                  null

                if (!variant) {
                  return null
                }

                return (
                  <div key={product.id} className="rounded-[24px] border border-rose-200 bg-white/92 p-4">
                    <div className="flex gap-4">
                      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[#f7f1eb]">
                        {image?.url || product.mainImageUrl ? (
                          <Image
                            src={image?.url ?? product.mainImageUrl ?? ''}
                            alt={image?.alt ?? product.name}
                            fill
                            className="object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-base font-semibold text-black/84">{product.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/44">{product.category}</p>
                        <p className="mt-3 text-sm text-black/60">
                          {variant.colorName} · {variant.size}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          {product.compareAtPrice ? (
                            <span className="text-black/38 line-through">{formatPrice(product.compareAtPrice)}</span>
                          ) : null}
                          <span className="font-semibold text-rose-950">{formatPrice(product.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          addItem({
                            id: `${product.id}:${variant.sku}`,
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            category: product.category,
                            price: product.price,
                            compareAtPrice: product.compareAtPrice,
                            comboArmable: product.comboArmable,
                            comboEligibleFrom: product.comboEligibleFrom?.map((combo) => ({
                              productId: combo.productId,
                              discountPercent: combo.discountPercent,
                            })),
                            imageUrl: image?.url ?? product.mainImageUrl,
                            imageAlt: image?.alt ?? product.name,
                            colorName: variant.colorName,
                            colorHex: variant.colorHex,
                            size: variant.size,
                            sku: variant.sku,
                            quantity: 1,
                            maxStock: variant.stock,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-rose-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black"
                      >
                        Agregar al carrito
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/productos/${product.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/76 transition hover:bg-black hover:text-white"
                      >
                        Ver producto
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {shouldShowFreeShippingUpsell && freeShippingUpsellProduct && suggestedVariant ? (
          <div className="card-surface overflow-hidden border border-emerald-200 bg-[linear-gradient(135deg,#f5fbf7_0%,#edf7f1_52%,#e3f4ea_100%)] p-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_260px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Envío gratis
                </div>
                <h2 className="mt-4 font-display text-3xl tracking-[-0.05em] text-black md:text-4xl">
                  ¿Querés agregar este producto para llegar al envío gratis?
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62 md:text-base md:leading-8">
                  Te faltan <strong>{formatPrice(freeShippingDifference)}</strong> para alcanzar el mínimo de{' '}
                  <strong>{formatPrice(settings.localDeliveryFreeThreshold)}</strong>. Te sugerimos esta prenda para aprovechar el envío gratis.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      addItem({
                        id: `${freeShippingUpsellProduct.id}:${suggestedVariant.sku}`,
                        productId: freeShippingUpsellProduct.id,
                        slug: freeShippingUpsellProduct.slug,
                        name: freeShippingUpsellProduct.name,
                        category: freeShippingUpsellProduct.category,
                        price: freeShippingUpsellProduct.price,
                        compareAtPrice: freeShippingUpsellProduct.compareAtPrice,
                        comboArmable: freeShippingUpsellProduct.comboArmable,
                        comboEligibleFrom: freeShippingUpsellProduct.comboEligibleFrom?.map((combo) => ({
                          productId: combo.productId,
                          discountPercent: combo.discountPercent,
                        })),
                        imageUrl: suggestedImage?.url ?? freeShippingUpsellProduct.mainImageUrl,
                        imageAlt: suggestedImage?.alt ?? freeShippingUpsellProduct.name,
                        colorName: suggestedVariant.colorName,
                        colorHex: suggestedVariant.colorHex,
                        size: suggestedVariant.size,
                        sku: suggestedVariant.sku,
                        quantity: 1,
                        maxStock: suggestedVariant.stock,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black"
                  >
                    Agregar sugerido
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/productos/${freeShippingUpsellProduct.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/76 transition hover:bg-black hover:text-white"
                  >
                    Ver producto
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/8 bg-white/88 p-4 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
                <div className="flex gap-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[#f3f3ef]">
                    {suggestedImage?.url || freeShippingUpsellProduct.mainImageUrl ? (
                      <Image
                        src={suggestedImage?.url ?? freeShippingUpsellProduct.mainImageUrl ?? ''}
                        alt={suggestedImage?.alt ?? freeShippingUpsellProduct.name}
                        fill
                        className="object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-base font-semibold text-black/84">{freeShippingUpsellProduct.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/44">{freeShippingUpsellProduct.category}</p>
                    <p className="mt-3 text-sm text-black/60">
                      {suggestedVariant.colorName} · {suggestedVariant.size}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-black">{formatPrice(freeShippingUpsellProduct.price)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <CheckoutForm items={items} settings={settings} />
      </div>
    </section>
  )
}
