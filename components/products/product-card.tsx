'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getGalleryForColor, getMainImage, getProductColors, isColorOutOfStock } from '@/lib/variant-utils'
import type { Product, ProductImage } from '@/types/store'
import { formatPrice } from '@/lib/utils'

function getImageFit(image?: ProductImage | null) {
  if (image?.type === 'MAIN' || image?.type === 'INFO') {
    return 'object-contain'
  }

  return 'object-cover'
}

export function ProductCard({ product }: { product: Product }) {
  const colors = getProductColors(product)
  const mainImage = getMainImage(product)
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name ?? '')
  const [activeIndex, setActiveIndex] = useState(0)
  const selectedColorOutOfStock = selectedColor ? isColorOutOfStock(product, selectedColor) : false

  const gallery = useMemo(() => {
    return getGalleryForColor(product, selectedColor)
      .filter((item) => item.kind === 'image')
      .map((item) => item.image)
  }, [product, selectedColor])

  const activeImage = gallery[activeIndex] ?? gallery[0] ?? mainImage

  const selectColor = (colorName: string) => {
    setSelectedColor(colorName)
    const nextGallery = getGalleryForColor(product, colorName).filter((item) => item.kind === 'image')
    const firstColorImageIndex = nextGallery.findIndex((item) => item.kind === 'image' && item.image.type === 'COLOR')
    setActiveIndex(firstColorImageIndex >= 0 ? firstColorImageIndex : 0)
  }

  const goPrevious = () => {
    setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1))
  }

  const goNext = () => {
    setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1))
  }

  return (
    <article className="card-surface overflow-hidden">
      <div className="group relative bg-[#f3f3ef]">
        <Link href={`/productos/${product.slug}`} className="block">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-b-[28px] bg-[#f3f3ef]">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.alt}
                fill
                className={`h-full w-full transition duration-500 ${getImageFit(activeImage)}`}
              />
            ) : null}
          </div>
        </Link>

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

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">{product.category}</p>
            <Link href={`/productos/${product.slug}`} className="mt-2 block font-display text-2xl tracking-[-0.04em] text-black transition hover:text-black/72">
              {product.name}
            </Link>
          </div>
          <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={() => selectColor(color.name)}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
                selectedColor === color.name ? 'border-black bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.05)]' : 'border-black/10'
              }`}
              title={isColorOutOfStock(product, color.name) ? `${color.name} - sin stock` : color.name}
              aria-label={color.name}
            >
              <span className="h-4 w-4 rounded-full border border-black/12" style={{ backgroundColor: color.hex }} />
            </button>
          ))}
        </div>

        {selectedColor ? (
          <p className="text-xs uppercase tracking-[0.14em] text-black/54">
            {selectedColor}
            {selectedColorOutOfStock ? <span className="ml-2 font-semibold text-black/86">Sin stock</span> : null}
          </p>
        ) : null}

        <Link href={`/productos/${product.slug}`} className="button-secondary w-full">
          Ver producto
        </Link>
      </div>
    </article>
  )
}
