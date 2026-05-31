'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { getColorImages, getMainImage, getProductColors, isColorOutOfStock } from '@/lib/variant-utils'
import type { Product, ProductImage } from '@/types/store'
import { formatPrice } from '@/lib/utils'

function getImageFit(image: ProductImage) {
  if (image.type === 'LIFESTYLE') {
    return 'object-cover'
  }

  return 'object-contain'
}

function getSalesBadgeLabel(count?: number) {
  if (!count || count <= 0) {
    return null
  }

  if (count >= 1000) return '+1000 compras'
  if (count >= 500) return '+500 compras'
  if (count >= 100) return `+${Math.floor(count / 100) * 100} compras`
  if (count >= 10) return `+${Math.floor(count / 10) * 10} compras`
  return `+${count} compras`
}

export function ProductFeature({ product }: { product: Product }) {
  const colors = getProductColors(product)
  const mainImage = getMainImage(product)
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name ?? '')
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)
  const selectedColorOutOfStock = selectedColor ? isColorOutOfStock(product, selectedColor) : false
  const salesBadgeLabel = getSalesBadgeLabel(product.salesCount)

  const gallery = useMemo(() => {
    const items: ProductImage[] = []
    if (mainImage) {
      items.push(mainImage)
    }

    const colorImages = selectedColor
      ? getColorImages(product, selectedColor).filter((image) => image.url !== mainImage?.url)
      : []

    items.push(...colorImages)
    return items
  }, [mainImage, product, selectedColor])

  const activeImage = gallery[activeIndex] ?? gallery[0] ?? mainImage

  const selectColor = (colorName: string) => {
    setSelectedColor(colorName)
    const nextColorImages = getColorImages(product, colorName).filter((image) => image.url !== mainImage?.url)
    setActiveIndex(nextColorImages.length > 0 ? 1 : 0)
  }

  const goPrevious = () => {
    setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1))
  }

  const goNext = () => {
    setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1))
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current
    const endX = event.changedTouches[0]?.clientX ?? null
    touchStartXRef.current = null

    if (startX == null || endX == null || gallery.length <= 1) {
      return
    }

    const deltaX = endX - startX
    if (Math.abs(deltaX) < 36) {
      return
    }

    if (deltaX > 0) {
      goPrevious()
      return
    }

    goNext()
  }

  return (
    <section className="shell mt-18">
      <div className="card-surface overflow-hidden p-3 md:p-4 xl:p-5">
        <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr] xl:items-stretch">
          <div className="overflow-hidden rounded-[28px] bg-[#f3f3ef] xl:max-w-[650px]">
            <div
              className="group relative aspect-[4/4.7] w-full touch-pan-y md:aspect-[4/3.95] xl:aspect-[4/3.72]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="absolute inset-5 md:inset-7 xl:inset-8">
                {activeImage ? (
                  <Image
                    src={activeImage.url}
                    alt={activeImage.alt}
                    fill
                    className={`h-full w-full transition duration-500 ${getImageFit(activeImage)}`}
                  />
                ) : null}
              </div>

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goPrevious}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-black shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition hover:bg-white md:left-4 md:h-10 md:w-10"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-black shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition hover:bg-white md:right-4 md:h-10 md:w-10"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                    {gallery.map((image, index) => (
                      <button
                        key={`${image.url}-${index}`}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`h-2 rounded-full transition ${activeIndex === index ? 'w-8 bg-black' : 'w-2 bg-black/20'}`}
                        aria-label={`Ver imagen ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col p-3 md:p-4 xl:p-5">
            <p className="eyebrow">Producto más vendido</p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                {salesBadgeLabel ? (
                  <div className="mb-3 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                    {salesBadgeLabel}
                  </div>
                ) : null}
                <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">{product.category}</p>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.06em] md:text-4xl">{product.name}</h2>
              </div>
              <p className="text-lg font-semibold md:text-right md:text-2xl">{formatPrice(product.price)}</p>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-black/62 md:text-[15px]">
              {product.shortDescription}
            </p>

            <div className="mt-7">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">Variantes</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => selectColor(color.name)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      selectedColor === color.name
                        ? 'border-black bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.05)]'
                        : 'border-black/10'
                    }`}
                    title={color.name}
                    aria-label={color.name}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-black/12"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                ))}
              </div>
              {selectedColor ? (
                <p className="mt-3 text-sm text-black/55">
                  Color seleccionado: <span className="font-medium text-black/78">{selectedColor}</span>
                  {selectedColorOutOfStock ? <span className="ml-2 font-semibold text-black/86">Sin stock</span> : null}
                </p>
              ) : null}
            </div>

            {gallery.length > 1 ? (
              <div className="mt-7">
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">Galería</p>
                <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                  {gallery.map((image, index) => (
                    <button
                      key={`${image.url}-thumb-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-[18px] border bg-[#f3f3ef] ${
                        activeIndex === index ? 'border-black' : 'border-black/10'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className={`p-2 ${getImageFit(image)}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto pt-7">
              <Link href={`/productos/${product.slug}`} scroll className="button-primary w-full">
                Ver producto más vendido
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
