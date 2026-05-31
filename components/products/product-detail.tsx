'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, CreditCard, LoaderCircle, LockKeyhole, ShoppingBag, Star, Truck, WalletCards, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { CashOnDeliveryInfo } from '@/components/marketing/cash-on-delivery-info'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { getFeatureChips } from '@/lib/product-display'
import type { StoreSettingsSnapshot } from '@/lib/store-settings'
import {
  getAvailableSizes,
  getColorImages,
  getGalleryForColor,
  getMainImage,
  getProductColors,
  getSizesForColor,
  getVariantForSelection,
  isColorOutOfStock,
  type ProductGalleryItem,
} from '@/lib/variant-utils'
import type { Product, ProductImage } from '@/types/store'
import { formatPrice } from '@/lib/utils'

function isYoutubeUrl(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

function getYoutubeEmbedUrl(url: string) {
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0]
    return id ? `https://www.youtube.com/embed/${id}` : url
  }

  const parsed = new URL(url)
  const id = parsed.searchParams.get('v')
  return id ? `https://www.youtube.com/embed/${id}` : url
}

function getImageFit(image: ProductImage) {
  if (image.type === 'MAIN' || image.type === 'INFO') {
    return 'object-contain'
  }

  if (image.type === 'LIFESTYLE') {
    return 'object-cover'
  }

  return 'object-cover'
}

function getMobileImageFit(image: ProductImage) {
  if (image.type === 'LIFESTYLE') {
    return 'object-cover'
  }

  return 'object-contain scale-[0.94]'
}

function getReviewAverage(product: Product) {
  if (product.reviews.length === 0) {
    return 0
  }

  const total = product.reviews.reduce((sum, review) => sum + review.rating, 0)
  return total / product.reviews.length
}

function getSoldScale(count?: number) {
  if (!count || count <= 0) {
    return ''
  }

  if (count >= 1000) return '+1000'
  if (count >= 500) return '+500'
  if (count >= 100) return '+100'
  if (count >= 50) return '+50'
  if (count >= 20) return '+20'
  return '+5'
}

function getInstallmentPrice(price: number) {
  return Math.round(price / 3)
}

function getVariantStockNotice(stock?: number) {
  if (!stock || stock <= 0) {
    return null
  }

  if (stock === 1) {
    return {
      label: 'Ultima unidad',
      className: 'border border-red-200 bg-red-50 text-red-700',
    }
  }

  if (stock <= 3) {
    return {
      label: `Quedan ${stock} unidades`,
      className: 'border border-orange-200 bg-orange-50 text-orange-700',
    }
  }

  return null
}

function RatingStars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = Math.max(0, Math.min(1, value - index))
        return (
          <div key={`${value}-${index}`} className={`relative ${size}`}>
            <Star className={`${size} text-black/18`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${size} fill-black text-black`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PurchaseBenefitRow({
  icon: Icon,
  title,
  children,
  action,
  compact = false,
  accent = 'text-black/86',
}: {
  icon: typeof Truck
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  compact?: boolean
  accent?: string
}) {
  return (
    <div className={compact ? 'py-1' : 'py-1.5'}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-black/58" />
        <div className="min-w-0 flex-1">
          {title || action ? (
            <div className="flex items-center justify-between gap-3">
              {title ? <p className={`text-[15px] font-medium leading-6 ${accent}`}>{title}</p> : <span />}
              {action}
            </div>
          ) : null}
          <div className={`${title || action ? 'mt-1' : ''} text-sm leading-6 text-black/58`}>{children}</div>
        </div>
      </div>
    </div>
  )
}

function AddToCartFeedback({
  feedback,
}: {
  feedback: { type: 'success' | 'error'; message: string } | null
}) {
  if (!feedback) {
    return null
  }

  return (
    <div
      className={`rounded-[22px] border px-4 py-3 text-sm ${
        feedback.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            feedback.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
          }`}
        >
          {feedback.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
            {feedback.type === 'success' ? 'Producto añadido' : 'Revisá tu selección'}
          </p>
          <p className="mt-1 leading-6">{feedback.message}</p>
        </div>
      </div>
    </div>
  )
}

export function ProductDetail({
  product,
  settings,
}: {
  product: Product
  settings: StoreSettingsSnapshot
}) {
  const { addItem } = useCart()
  const colors = getProductColors(product)
  const mainImage = getMainImage(product)
  const initialColor = colors[0]?.name ?? ''
  const initialSizes = getAvailableSizes(product, initialColor)
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [selectedSize, setSelectedSize] = useState(initialSizes[0]?.label ?? '')
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(mainImage?.id ?? `main-${mainImage?.url ?? 'fallback'}`)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [deliveryInfoOpen, setDeliveryInfoOpen] = useState(false)
  const reviewsScrollRef = useRef<HTMLDivElement>(null)
  const mobileAddToCartRef = useRef<HTMLButtonElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const featureChips = getFeatureChips(product.featureTags)

  const gallery = useMemo(() => getGalleryForColor(product, selectedColor), [product, selectedColor])
  const availableSizes = useMemo(() => getAvailableSizes(product, selectedColor), [product, selectedColor])
  const sizesForColor = useMemo(() => getSizesForColor(product, selectedColor), [product, selectedColor])
  const selectedColorOutOfStock = selectedColor ? isColorOutOfStock(product, selectedColor) : false
  const resolvedSelectedSize = availableSizes.some((size) => size.label === selectedSize) ? selectedSize : (availableSizes[0]?.label ?? '')
  const selectedSizeInfo = sizesForColor.find((size) => size.label === resolvedSelectedSize)
  const selectedVariant = getVariantForSelection(product, selectedColor, resolvedSelectedSize)
  const averageRating = getReviewAverage(product)
  const reviewCount = product.reviews.length
  const soldScale = getSoldScale(product.salesCount)
  const installmentPrice = getInstallmentPrice(product.price)
  const variantStockNotice = getVariantStockNotice(selectedSizeInfo?.stock)
  const [cartFeedback, setCartFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [mobileButtonInView, setMobileButtonInView] = useState(false)
  const activeGalleryItem =
    gallery.find((item) => item.id === selectedGalleryId) ??
    gallery[0] ??
    (mainImage ? ({ kind: 'image', id: mainImage.id ?? `main-${mainImage.url}`, image: mainImage } as ProductGalleryItem) : null)

  const onColorChange = (colorName: string) => {
    setSelectedColor(colorName)
    setSelectedSize(getAvailableSizes(product, colorName)[0]?.label ?? '')
    const nextGallery = getGalleryForColor(product, colorName)
    const firstColorImage = nextGallery.find((item) => item.kind === 'image' && item.image.type === 'COLOR')
    setSelectedGalleryId(firstColorImage?.id ?? nextGallery[0]?.id ?? mainImage?.id ?? '')
  }

  const infoImages = product.images.filter((image) => image.type === 'INFO' || image.type === 'LIFESTYLE')
  const canAddToCart = Boolean(selectedVariant && !(resolvedSelectedSize && selectedSizeInfo && !selectedSizeInfo.inStock))

  const showPreviousGalleryItem = () => {
    if (gallery.length <= 1) return
    const currentIndex = gallery.findIndex((item) => item.id === activeGalleryItem?.id)
    const nextIndex = (currentIndex + gallery.length - 1) % gallery.length
    setSelectedGalleryId(gallery[nextIndex]?.id ?? gallery[0].id)
  }

  const showNextGalleryItem = () => {
    if (gallery.length <= 1) return
    const currentIndex = gallery.findIndex((item) => item.id === activeGalleryItem?.id)
    const nextIndex = (currentIndex + 1) % gallery.length
    setSelectedGalleryId(gallery[nextIndex]?.id ?? gallery[0].id)
  }

  const handleGalleryTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null
  }

  const handleGalleryTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current
    const endX = event.changedTouches[0]?.clientX ?? null
    touchStartXRef.current = null

    if (startX == null || endX == null) {
      return
    }

    const deltaX = endX - startX

    if (Math.abs(deltaX) < 36) {
      return
    }

    if (deltaX > 0) {
      showPreviousGalleryItem()
      return
    }

    showNextGalleryItem()
  }

  const handleAddToCart = async () => {
    if (isAddingToCart) {
      return
    }

    if (!selectedVariant || !canAddToCart) {
      setCartFeedback({ type: 'error', message: 'Seleccioná una variante disponible para agregar.' })
      window.setTimeout(() => setCartFeedback(null), 2400)
      return
    }

    setIsAddingToCart(true)
    const selectedColorImage =
      product.images.find((image) => image.type === 'COLOR' && image.colorName === selectedColor) ??
      mainImage ??
      undefined

    window.setTimeout(() => {
      addItem({
        id: `${product.id}:${selectedVariant.sku}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        imageUrl: selectedColorImage?.url ?? product.mainImageUrl,
        imageAlt: selectedColorImage?.alt ?? product.name,
        colorName: selectedVariant.colorName,
        colorHex: selectedVariant.colorHex,
        size: selectedVariant.size,
        sku: selectedVariant.sku,
        quantity: 1,
        maxStock: selectedVariant.stock,
      })

      setCartFeedback({ type: 'success', message: 'Lo sumamos al carrito. Podés seguir comprando o cerrar la compra cuando quieras.' })
      setIsAddingToCart(false)
      window.setTimeout(() => setCartFeedback(null), 2600)
    }, 820)
  }

  const scrollReviews = (direction: 'left' | 'right') => {
    const container = reviewsScrollRef.current
    if (!container) return
    const amount = Math.max(280, Math.floor(container.clientWidth * 0.8))
    container.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  useEffect(() => {
    const element = mobileAddToCartRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMobileButtonInView(entry.isIntersecting)
      },
      {
        threshold: 0.4,
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [resolvedSelectedSize, selectedColor, canAddToCart])

  return (
    <div className="space-y-10 pb-28 md:pb-0">
      <div className="space-y-6 md:hidden">
        <div className="card-surface px-6 py-6">
          {(soldScale || averageRating > 0) ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-black/58">
              {soldScale ? <span>{soldScale} vendidos</span> : null}
              {averageRating > 0 ? (
                <div className="flex items-center gap-2">
                  <RatingStars value={averageRating} size="h-3.5 w-3.5" />
                  <Link href="#opiniones" className="font-medium text-black/74 underline-offset-4 hover:underline">
                    {averageRating.toFixed(1)} ({reviewCount}) opiniones
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          <h1 className="mt-3 font-display text-3xl tracking-[-0.05em] text-black">{product.name}</h1>
          <div className="mt-5 flex items-start justify-between gap-4">
            <p className="text-[2.1rem] font-semibold leading-none text-black">{formatPrice(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="pt-1 text-sm text-black/40 line-through">{formatPrice(product.compareAtPrice)}</p>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-emerald-700">
            Mismo precio en 3 cuotas de {formatPrice(installmentPrice)}
          </p>
          <p className="mt-4 max-w-[28rem] text-sm leading-7 text-black/62">{product.shortDescription}</p>
        </div>

        <div className="space-y-3">
          <div
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-neutral-100 touch-pan-y"
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            {activeGalleryItem?.kind === 'video' ? (
              isYoutubeUrl(activeGalleryItem.url) ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeGalleryItem.url)}
                  title={`${product.name} video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeGalleryItem.url} controls className="h-full w-full object-cover" />
              )
            ) : activeGalleryItem?.kind === 'image' ? (
              <Image
                src={activeGalleryItem.image.url}
                alt={activeGalleryItem.image.alt}
                width={1400}
                height={1750}
                className={`h-full w-full transition duration-300 ${getMobileImageFit(activeGalleryItem.image)}`}
              />
            ) : null}

            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPreviousGalleryItem}
                  className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-black shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition hover:bg-white"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={showNextGalleryItem}
                  className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-black shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition hover:bg-white"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="-mx-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-3">
                {gallery.map((item, index) => (
                  <button
                    key={`${item.id}-mobile-thumb`}
                    type="button"
                    onClick={() => setSelectedGalleryId(item.id)}
                    className={`relative h-18 w-18 shrink-0 overflow-hidden rounded-[18px] border bg-[#f3f3ef] ${
                      activeGalleryItem?.id === item.id ? 'border-black shadow-[0_10px_24px_rgba(0,0,0,0.08)]' : 'border-black/10'
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    {item.kind === 'image' ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.alt}
                        fill
                        className={getMobileImageFit(item.image)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/56">
                        Video
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="card-surface p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Color: {selectedColor || 'Elegí una variante'}</p>
          <div className="mt-4 -mx-1 flex gap-3 overflow-x-auto px-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {colors.map((color) => (
              <button
                key={`mobile-${color.name}`}
                type="button"
                onClick={() => onColorChange(color.name)}
                className={`w-[106px] shrink-0 overflow-hidden rounded-[18px] border text-left transition ${
                  selectedColor === color.name ? 'border-[#3483fa] bg-white shadow-[0_8px_20px_rgba(52,131,250,0.14)]' : 'border-black/10 bg-white'
                }`}
              >
                <div className="relative aspect-[4/4.6] w-full overflow-hidden bg-[#f3f3ef]">
                  <Image
                    src={(getColorImages(product, color.name)[0] ?? mainImage)?.url ?? '/hero-header.png'}
                    alt={(getColorImages(product, color.name)[0] ?? mainImage)?.alt ?? `${product.name} ${color.name}`}
                    fill
                    className={getColorImages(product, color.name)[0] ? getMobileImageFit(getColorImages(product, color.name)[0]!) : 'object-contain scale-[0.92]'}
                  />
                </div>
                <div className="space-y-1 px-2.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border border-black/12" style={{ backgroundColor: color.hex }} />
                    <span className="truncate text-[12px] font-medium text-black/86">{color.name}</span>
                  </div>
                  {isColorOutOfStock(product, color.name) ? <p className="text-[10px] leading-4 text-black/52">Sin stock</p> : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">Talle</p>
            <button
              type="button"
              onClick={() => setSizeGuideOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
              aria-label="Abrir guía de talles"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sizesForColor.length > 0 ? (
              sizesForColor.map((size) => (
                <button
                  key={`mobile-size-${size.label}`}
                  type="button"
                  onClick={() => setSelectedSize(size.label)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] ${
                    resolvedSelectedSize === size.label
                      ? size.inStock
                        ? 'border-black bg-black text-white'
                        : 'border-black bg-[#ecece7] text-black'
                      : size.inStock
                        ? 'border-black/10'
                        : 'border-black/10 bg-[#f3f3ef] text-black/52'
                  }`}
                >
                  {size.label}
                  {!size.inStock ? <span className="ml-2 text-[10px] normal-case tracking-normal">Sin stock</span> : null}
                </button>
              ))
            ) : (
              <span className="text-sm text-black/56">No hay talles disponibles para este color.</span>
            )}
          </div>
          {resolvedSelectedSize && selectedSizeInfo?.inStock && variantStockNotice ? (
            <p className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${variantStockNotice.className}`}>
              {variantStockNotice.label}
            </p>
          ) : null}
        </div>

        <div className="card-surface p-5">
          <div className="space-y-3">
            {settings.barilocheEnabled ? (
              <PurchaseBenefitRow icon={Clock3} title="" accent="text-emerald-600">
                <BarilocheDeliveryCountdown variant="block" copyMode="arrival" />
              </PurchaseBenefitRow>
            ) : null}
            <PurchaseBenefitRow icon={Truck} title="Envíos a todo el país" compact>
              Despacho inmediato y logística de envíos cuidada.
            </PurchaseBenefitRow>
            {settings.barilocheEnabled ? (
              <PurchaseBenefitRow
                icon={WalletCards}
                title="Pago contra entrega"
                compact
                action={(
                  <button
                    type="button"
                    onClick={() => setDeliveryInfoOpen(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                    aria-label="Más información sobre pago contra entrega"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                )}
              >
                Disponible en Bariloche para entrega local.
              </PurchaseBenefitRow>
            ) : null}
            {resolvedSelectedSize && selectedSizeInfo ? (
              selectedSizeInfo.inStock && variantStockNotice ? (
                <p
                  className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${variantStockNotice.className}`}
                >
                  {variantStockNotice.label}
                </p>
              ) : (
                <p className="text-base font-medium text-black/86">Sin stock</p>
              )
            ) : null}
            <button
              ref={mobileAddToCartRef}
              type="button"
              disabled={!canAddToCart || isAddingToCart}
              onClick={handleAddToCart}
              className={`relative mt-2 w-full overflow-hidden rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                !canAddToCart
                  ? 'cursor-not-allowed bg-black/12 text-black/44'
                  : isAddingToCart
                    ? 'cursor-wait bg-[#d9d9d4] text-white'
                    : 'button-primary'
              }`}
            >
              {isAddingToCart ? (
                <span className="absolute inset-y-0 left-0 bg-black transition-[width] duration-700 ease-out" style={{ width: '100%' }} />
              ) : null}
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {isAddingToCart ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                {canAddToCart ? (isAddingToCart ? 'Agregando...' : 'Agregar al carrito') : 'Sin stock'}
              </span>
            </button>
            <AddToCartFeedback feedback={cartFeedback} />
          </div>
        </div>
      </div>

      <div className="hidden gap-8 md:grid xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-[36px] bg-neutral-100">
            {activeGalleryItem?.kind === 'video' ? (
              isYoutubeUrl(activeGalleryItem.url) ? (
                <iframe
                  src={getYoutubeEmbedUrl(activeGalleryItem.url)}
                  title={`${product.name} video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeGalleryItem.url} controls className="h-full w-full object-cover" />
              )
            ) : activeGalleryItem?.kind === 'image' ? (
              <Image
                src={activeGalleryItem.image.url}
                alt={activeGalleryItem.image.alt}
                width={1400}
                height={1400}
                className={`h-full w-full ${getImageFit(activeGalleryItem.image)}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-black/50">
                No hay imágenes disponibles para este producto.
              </div>
            )}
          </div>

          {gallery.length > 1 ? (
            <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
              {gallery.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedGalleryId(item.id)}
                  className={`relative aspect-square overflow-hidden rounded-[18px] border bg-[#f3f3ef] text-left ${
                    activeGalleryItem?.id === item.id ? 'border-black' : 'border-black/10'
                  }`}
                >
                  {item.kind === 'image' ? (
                    <Image
                      src={item.image.url}
                      alt={item.image.alt}
                      fill
                      className={getImageFit(item.image)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/62">
                      Video
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="card-surface p-7 md:p-9">
          <p className="eyebrow">{product.category}</p>
          {(soldScale || averageRating > 0) ? (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/58">
              {soldScale ? <span>{soldScale} vendidos</span> : null}
              {averageRating > 0 ? (
                <div className="flex items-center gap-2">
                  <RatingStars value={averageRating} />
                  <Link href="#opiniones" className="font-medium text-black/74 underline-offset-4 hover:underline">
                    {averageRating.toFixed(1)} ({reviewCount}) opiniones
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl tracking-[-0.05em] md:text-5xl">{product.name}</h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-black/62">{product.shortDescription}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
              {product.compareAtPrice ? (
                <p className="mt-1 text-sm text-black/40 line-through">{formatPrice(product.compareAtPrice)}</p>
              ) : null}
              <p className="mt-2 text-sm font-medium leading-6 text-emerald-700">
                3 cuotas de {formatPrice(installmentPrice)}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-black/50">Color</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => onColorChange(color.name)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.12em] sm:px-4 sm:text-sm ${
                    selectedColor === color.name ? 'border-black bg-black text-white' : 'border-black/10 bg-white text-black/72'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full border border-black/15" style={{ backgroundColor: color.hex }} />
                  {color.name}
                  {isColorOutOfStock(product, color.name) ? <span className="ml-1 text-[10px] font-semibold normal-case tracking-normal">Sin stock</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-black/50">Talle</p>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                aria-label="Abrir guía de talles"
              >
                <CircleHelp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-black/52">
              Talles disponibles para el color <span className="font-medium text-black/78">{selectedColor || 'seleccionado'}</span>.
              {selectedColorOutOfStock ? <span className="ml-2 font-semibold text-black/82">Este color está sin stock.</span> : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizesForColor.length > 0 ? (
                sizesForColor.map((size) => (
                  <button
                    key={size.label}
                    type="button"
                    onClick={() => setSelectedSize(size.label)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] ${
                      resolvedSelectedSize === size.label
                        ? size.inStock
                          ? 'border-black bg-black text-white'
                          : 'border-black bg-[#ecece7] text-black'
                        : size.inStock
                          ? 'border-black/10'
                          : 'border-black/10 bg-[#f3f3ef] text-black/52'
                    }`}
                  >
                    {size.label}
                    {!size.inStock ? <span className="ml-2 text-[10px] normal-case tracking-normal">Sin stock</span> : null}
                  </button>
                ))
              ) : (
                <span className="text-sm text-black/56">No hay talles disponibles para este color.</span>
              )}
            </div>
            {resolvedSelectedSize && selectedSizeInfo?.inStock && variantStockNotice ? (
              <p className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${variantStockNotice.className}`}>
                {variantStockNotice.label}
              </p>
            ) : null}
          </div>

          <div className="mt-6 space-y-3 border-t border-black/8 pt-5">
            {settings.barilocheEnabled ? (
              <PurchaseBenefitRow icon={Clock3} title="" accent="text-emerald-600">
                <BarilocheDeliveryCountdown variant="block" copyMode="arrival" />
              </PurchaseBenefitRow>
            ) : null}

            <PurchaseBenefitRow icon={Truck} title="Envíos a todo el país">
              Despacho inmediato y logística de envíos cuidada.
            </PurchaseBenefitRow>

            {settings.barilocheEnabled ? (
              <PurchaseBenefitRow
                icon={WalletCards}
                title="Pago contra entrega"
                action={(
                  <button
                    type="button"
                    onClick={() => setDeliveryInfoOpen(true)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                    aria-label="Más información sobre pago contra entrega"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                )}
              >
                Disponible en Bariloche para compras con entrega local.
              </PurchaseBenefitRow>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <PurchaseBenefitRow icon={LockKeyhole} title="Pago seguro" compact>
                Tus datos se procesan de forma protegida.
              </PurchaseBenefitRow>

              <PurchaseBenefitRow icon={CreditCard} title="3 cuotas sin interés" compact>
                Una forma más cómoda de resolver el abrigo de invierno.
              </PurchaseBenefitRow>
            </div>
          </div>

          <button
            type="button"
            disabled={!canAddToCart || isAddingToCart}
            onClick={handleAddToCart}
            className={`relative mt-8 w-full overflow-hidden rounded-full px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition ${
              !canAddToCart
                ? 'cursor-not-allowed bg-black/12 text-black/44'
                : isAddingToCart
                  ? 'cursor-wait bg-[#d9d9d4] text-white'
                  : 'button-primary'
            }`}
          >
            {isAddingToCart ? (
              <span className="absolute inset-y-0 left-0 bg-black transition-[width] duration-700 ease-out" style={{ width: '100%' }} />
            ) : null}
            <span className="relative z-10 inline-flex items-center justify-center gap-2">
              {isAddingToCart ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              {canAddToCart ? (isAddingToCart ? 'Agregando...' : 'Agregar al carrito') : 'Sin stock'}
            </span>
          </button>
          <AddToCartFeedback feedback={cartFeedback} />

        </div>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-6">
        <section className="card-surface p-7 md:p-9">
          <p className="eyebrow">Descripción</p>
          <p className="mt-5 max-w-4xl text-sm leading-8 text-black/62 md:text-[15px]">
            {product.description}
          </p>
        </section>

        <section className="card-surface p-7 md:p-9">
          <p className="eyebrow">Características principales</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featureChips.map((chip) => (
              <div
                key={`${chip.label}-${chip.text}`}
                className="rounded-[24px] border border-black/8 bg-[#f7f7f4] px-5 py-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/76">
                  {chip.label}
                </p>
                {chip.text ? <p className="mt-2 text-sm leading-6 text-black/58">{chip.text}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="card-surface p-7 md:p-9">
          <p className="eyebrow">Guía y recomendación</p>
          <div className="mt-5">
            <div className="rounded-[24px] bg-[#f7f7f4] px-5 py-5">
              <p className="text-sm leading-7 text-black/62">
                Si tu perro está entre dos talles, recomendamos elegir el talle más grande para mayor comodidad.
              </p>
            </div>
          </div>
        </section>

        {infoImages.length > 0 || product.videoUrl ? (
          <section className="card-surface p-7 md:p-9">
            <p className="eyebrow">Detalles de producto</p>
            <div className="mt-5">
            {infoImages.length > 0 || product.videoUrl ? (
              <div className="grid gap-3 md:grid-cols-2">
                {infoImages.map((image) => (
                  <div key={image.id ?? image.url} className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-[#f3f3ef]">
                    <Image src={image.url} alt={image.alt} fill className={getImageFit(image)} />
                  </div>
                ))}
                {product.videoUrl ? (
                  <div className="overflow-hidden rounded-[24px] bg-[#f3f3ef]">
                    {isYoutubeUrl(product.videoUrl) ? (
                      <iframe
                        src={getYoutubeEmbedUrl(product.videoUrl)}
                        title={`${product.name} video detalle`}
                        className="aspect-[4/3] h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={product.videoUrl} controls className="aspect-[4/3] h-full w-full object-cover" />
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            </div>
          </section>
        ) : null}

        {product.reviews.length > 0 ? (
          <section id="opiniones" className="card-surface p-7 md:p-9">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Opiniones de clientes</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-black/62">
                  <RatingStars value={averageRating} />
                  <span className="font-medium text-black/82">{averageRating.toFixed(1)}</span>
                  <span>({reviewCount}) opiniones</span>
                </div>
              </div>
              {product.reviews.length > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollReviews('left')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/72 transition hover:bg-black hover:text-white"
                    aria-label="Ver opiniones anteriores"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollReviews('right')}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/72 transition hover:bg-black hover:text-white"
                    aria-label="Ver más opiniones"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
            <div ref={reviewsScrollRef} className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {product.reviews.map((review) => (
                <article key={review.id} className="w-[88%] shrink-0 snap-start rounded-[24px] border border-black/8 bg-[#f7f7f4] p-5 md:w-[440px]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium text-black/86">{review.authorName}</h3>
                        {review.authorLocation ? (
                          <span className="text-xs uppercase tracking-[0.16em] text-black/40">{review.authorLocation}</span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <RatingStars value={review.rating} />
                      </div>
                      {review.title ? (
                        <p className="mt-3 text-sm font-medium text-black/82">{review.title}</p>
                      ) : null}
                      <p className="mt-2 text-sm leading-7 text-black/62">{review.comment}</p>
                      <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-black/40">
                        {new Date(review.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    {review.imageUrl ? (
                      <div className="relative aspect-square w-full max-w-[130px] overflow-hidden rounded-[20px] bg-white md:w-[130px]">
                        <Image
                          src={review.imageUrl}
                          alt={review.imageAlt ?? review.authorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {sizeGuideOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-8">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/45">Guía de talles</p>
                <h3 className="mt-1 font-display text-2xl tracking-[-0.04em]">Elegí el talle ideal</h3>
              </div>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                aria-label="Cerrar guía de talles"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-[16/11] w-full bg-[#f6f6f2]">
              <Image
                src="/size-guide-modal.png"
                alt="Guía de talles con medidas de cuello, pecho y largo para XS, S, M y L"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      {settings.barilocheEnabled && deliveryInfoOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-8">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/45">Información de pago</p>
                <h3 className="mt-1 font-display text-2xl tracking-[-0.04em]">Pago contra entrega</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryInfoOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                aria-label="Cerrar información de pago"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 text-sm leading-7 text-black/64">
              <CashOnDeliveryInfo />
            </div>
          </div>
        </div>
      ) : null}

      {!mobileButtonInView ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/8 bg-white/96 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto max-w-[30rem]">
            <div className="mb-3 text-center">
              <p className="truncate text-sm font-medium text-black/84">{selectedColor || product.name}</p>
              <p className="mt-1 text-xs text-black/54">
                {resolvedSelectedSize ? `Talle ${resolvedSelectedSize}` : 'Elegí color y talle'}
              </p>
            </div>
            <button
              type="button"
              disabled={!canAddToCart || isAddingToCart}
              onClick={handleAddToCart}
              className={`relative w-full overflow-hidden rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                !canAddToCart
                  ? 'cursor-not-allowed bg-black/12 text-black/44'
                  : isAddingToCart
                    ? 'cursor-wait bg-[#d9d9d4] text-white'
                    : 'button-primary'
              }`}
            >
              {isAddingToCart ? (
                <span className="absolute inset-y-0 left-0 bg-black transition-[width] duration-700 ease-out" style={{ width: '100%' }} />
              ) : null}
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                {isAddingToCart ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                {canAddToCart ? (isAddingToCart ? 'Agregando...' : 'Agregar al carrito') : 'Sin stock'}
              </span>
            </button>
          </div>
        </div>
      ) : null}

    </div>
  )
}
