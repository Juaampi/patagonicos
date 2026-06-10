'use client'

import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useState } from 'react'
import { saveProductAction } from '@/lib/server/catalog'
import { OUT_OF_STOCK_PLACEHOLDER_SIZE } from '@/lib/variant-utils'
import { AdminProductSubmit } from './admin-product-submit'

type CategoryOption = {
  id: string
  name: string
}

type EditProduct = {
  id: string
  name: string
  slug: string
  animalType: 'DOG' | 'CAT'
  mainImageUrl?: string | null
  videoUrl?: string | null
  price: number
  baseSalesCount: number
  compareAtPrice?: number | null
  shortDescription: string
  description: string
  categoryId: string
  status: 'ACTIVE' | 'INACTIVE'
  useTags: string[]
  featureTags: string[]
  materials: string[]
  careInstructions: string[]
  featured: boolean
  productStar: boolean
  variants: Array<{ colorName: string; colorHex: string; size: string; stock: number; sku: string }>
  images: Array<{ id: string; url: string; alt: string; colorName?: string; type: 'MAIN' | 'COLOR' | 'INFO' | 'LIFESTYLE'; sortOrder: number }>
}

type VariantDraft = {
  id: string
  colorName: string
  colorHex: string
  sizeStocks: string
  sku: string
  newImageName: string
}

type InfoImageDraft = {
  id: string
  fileName: string
  type: 'INFO' | 'LIFESTYLE'
  sortOrder: string
}

const initialState = {
  status: 'idle' as 'idle' | 'success' | 'error',
  message: '',
  redirectTo: undefined as string | undefined,
}

function createVariantDraft(): VariantDraft {
  return {
    id: crypto.randomUUID(),
    colorName: '',
    colorHex: '#0B0B0B',
    sizeStocks: '',
    sku: '',
    newImageName: '',
  }
}

function normalizeSize(value: string) {
  return value.trim().toUpperCase()
}

function parseSizeStockInput(value: string) {
  const entries = new Map<string, number>()
  const segments = value
    .split(/\r?\n|,/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    let size = ''
    let stock = 0

    if (segment.includes(':')) {
      const [rawSize, rawStock] = segment.split(':')
      size = normalizeSize(rawSize)
      stock = Number(rawStock?.trim() ?? '0')
    } else {
      const stockFirst = segment.match(/^(\d+)\s+(.+)$/)
      const sizeFirst = segment.match(/^(.+?)\s+(\d+)$/)

      if (stockFirst) {
        stock = Number(stockFirst[1])
        size = normalizeSize(stockFirst[2])
      } else if (sizeFirst) {
        size = normalizeSize(sizeFirst[1])
        stock = Number(sizeFirst[2])
      }
    }

    if (!size || !Number.isFinite(stock) || stock < 0) {
      continue
    }

    entries.set(size, stock)
  }

  return Array.from(entries.entries()).map(([size, stock]) => ({ size, stock }))
}

function formatSizeStockInput(entries: Array<{ size: string; stock: number }>) {
  return entries.map((entry) => `${normalizeSize(entry.size)}:${entry.stock}`).join(', ')
}

function getSkuBaseFromVariant(sku: string, size: string) {
  const normalizedSizeSuffix =
    size === OUT_OF_STOCK_PLACEHOLDER_SIZE ? 'sin-stock' : size.toLowerCase().replace(/\s+/g, '-')

  return sku.endsWith(`-${normalizedSizeSuffix}`) ? sku.slice(0, -(normalizedSizeSuffix.length + 1)) : sku
}

export function AdminProductForm({
  categories,
  editProduct,
  mode = 'create',
}: {
  categories: CategoryOption[]
  editProduct?: EditProduct
  mode?: 'create' | 'edit'
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(saveProductAction, initialState)
  const [variants, setVariants] = useState<VariantDraft[]>(
    editProduct?.variants.length
      ? Array.from(
          editProduct.variants.reduce((map, variant) => {
            const key = `${variant.colorName}__${variant.colorHex}`
            const current = map.get(key)

            if (current) {
              if (variant.size !== OUT_OF_STOCK_PLACEHOLDER_SIZE) {
                current.sizeStocks.set(variant.size, variant.stock)
              }
              if (!current.sku && variant.sku) {
                current.sku = getSkuBaseFromVariant(variant.sku, variant.size)
              }
              return map
            }

              map.set(key, {
                id: key,
                colorName: variant.colorName,
                colorHex: variant.colorHex,
                sizeStocks:
                  variant.size === OUT_OF_STOCK_PLACEHOLDER_SIZE
                    ? new Map<string, number>()
                    : new Map([[variant.size, variant.stock]]),
                sku: getSkuBaseFromVariant(variant.sku, variant.size),
              })

            return map
          }, new Map<string, { id: string; colorName: string; colorHex: string; sizeStocks: Map<string, number>; sku: string }>()),
        ).map(([, variant]) => ({
          id: variant.id,
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          sizeStocks: formatSizeStockInput(
            Array.from(variant.sizeStocks.entries()).map(([size, stock]) => ({ size, stock })),
          ),
          sku: variant.sku,
          newImageName: '',
        }))
      : [createVariantDraft()],
  )
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
  const [infoImages, setInfoImages] = useState<InfoImageDraft[]>([])

  const materialsValue = editProduct ? editProduct.materials.join('\n') : ''
  const careInstructionsValue = editProduct ? editProduct.careInstructions.join('\n') : ''
  const useTagsValue = editProduct ? editProduct.useTags.join(', ') : ''
  const featureTagsValue = editProduct ? editProduct.featureTags.join(', ') : ''
  const currentImagesByColor = useMemo(() => {
    const map = new Map<string, Array<{ id: string; url: string; alt: string; colorName?: string; type: 'MAIN' | 'COLOR' | 'INFO' | 'LIFESTYLE'; sortOrder: number }>>()
    for (const image of editProduct?.images ?? []) {
      if (image.type !== 'COLOR' || !image.colorName) {
        continue
      }
      if (removedImageIds.includes(image.id)) {
        continue
      }
      const current = map.get(image.colorName) ?? []
      current.push(image)
      map.set(image.colorName, current)
    }
    return map
  }, [editProduct, removedImageIds])
  const currentInfoImages = (editProduct?.images ?? []).filter(
    (image) => (image.type === 'INFO' || image.type === 'LIFESTYLE') && !removedImageIds.includes(image.id),
  )
  const variantPayload = variants
    .flatMap((variant) => {
      const colorName = variant.colorName.trim()
      const colorHex = variant.colorHex.trim() || '#0B0B0B'
      const skuBase = variant.sku.trim()
      const sizeStockEntries = parseSizeStockInput(variant.sizeStocks)

      if (!colorName && !skuBase && sizeStockEntries.length === 0) {
        return []
      }

      if (colorName && sizeStockEntries.length === 0) {
        return [[colorName, colorHex, OUT_OF_STOCK_PLACEHOLDER_SIZE, '0', skuBase ? `${skuBase}-sin-stock` : ''].join('|')]
      }

      return sizeStockEntries.map(({ size, stock }) =>
        [
          colorName,
          colorHex,
          size,
          String(stock),
          skuBase ? `${skuBase}-${size.toLowerCase().replace(/\s+/g, '-')}` : '',
        ].join('|'),
      )
    })
    .join('\n')

  const updateVariant = (id: string, field: keyof VariantDraft, value: string) => {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)),
    )
  }

  useEffect(() => {
    if (state.status === 'success' && state.redirectTo) {
      router.push(state.redirectTo)
      router.refresh()
    }
  }, [router, state.redirectTo, state.status])

  return (
    <form action={formAction} className="card-surface p-7">
      <p className="eyebrow">Productos</p>
      <h2 className="mt-4 font-display text-3xl tracking-[-0.05em]">
        {mode === 'edit' ? 'Editar producto y variantes' : 'Alta clara de producto'}
      </h2>
      <p className="mt-3 text-sm leading-7 text-black/62">
        Cada variante representa un color. Ahí definís nombre, hex, stock por talle y la imagen principal de ese color.
      </p>
      {mode === 'edit' && editProduct ? (
        <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Estás en modo edición. Si guardás ahora, se actualiza este producto y no se crea uno nuevo.
        </div>
      ) : null}
      {editProduct ? <input type="hidden" name="productId" value={editProduct.id} /> : null}
      <input type="hidden" name="variants" value={variantPayload} />
      {removedImageIds.map((imageId) => (
        <input key={imageId} type="hidden" name="deleteImageIds" value={imageId} />
      ))}

      {state.message ? (
        <div
          className={`mt-5 rounded-[18px] px-4 py-3 text-sm ${
            state.status === 'error'
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input name="name" defaultValue={editProduct?.name} placeholder="Nombre" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
        <input name="slug" defaultValue={editProduct?.slug} placeholder="Slug" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
        <select name="animalType" defaultValue={editProduct?.animalType ?? 'DOG'} className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none">
          <option value="DOG">Perros</option>
          <option value="CAT">Gatos</option>
        </select>
        <select name="categoryId" defaultValue={editProduct?.categoryId ?? ''} className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none">
          <option value="">Categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input name="price" type="number" defaultValue={editProduct?.price} placeholder="Precio" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
        <input
          name="baseSalesCount"
          type="number"
          min="0"
          defaultValue={editProduct?.baseSalesCount ?? 0}
          placeholder="Vendidos base manuales"
          className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <input name="compareAtPrice" type="number" defaultValue={editProduct?.compareAtPrice ?? ''} placeholder="Precio comparativo opcional" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
        <select name="status" defaultValue={editProduct?.status ?? 'ACTIVE'} className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none md:col-span-2">
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      <div className="mt-4 grid gap-4">
        <input name="shortDescription" defaultValue={editProduct?.shortDescription} placeholder="Descripción corta" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
        <textarea name="description" defaultValue={editProduct?.description} placeholder="Descripción completa" className="min-h-32 rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
      </div>

      <div className="mt-5 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-black/50">Imagen principal</p>
        <p className="mt-2 text-sm leading-6 text-black/58">
          Esta es la imagen global del producto. Se usa en cards, home, destacados y como primera imagen del detalle.
        </p>
        <input name="mainImage" type="file" accept="image/*" className="mt-4 block w-full text-sm" />
        {editProduct?.mainImageUrl ? (
          <div className="mt-3 rounded-[14px] border border-black/10 bg-white px-3 py-3 text-sm text-black/68">
            <p className="font-medium text-black/82">Imagen principal actual</p>
            <p className="mt-1 truncate text-xs text-black/46">{editProduct.mainImageUrl}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input name="useTags" defaultValue={useTagsValue} placeholder="Usos: Frío, Nieve, Lluvia" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
        <input name="featureTags" defaultValue={featureTagsValue} placeholder="Features: Impermeable, Térmica, Cortaviento" className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <textarea
          name="materials"
          defaultValue={materialsValue}
          placeholder={'Materiales, uno por línea\nExterior impermeable\nInterior térmico'}
          className="min-h-32 rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
        <textarea
          name="careInstructions"
          defaultValue={careInstructionsValue}
          placeholder={'Cuidados, uno por línea\nLavado suave\nSecado a la sombra'}
          className="min-h-32 rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
        />
      </div>

      <div className="mt-5 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Variantes completas</p>
            <p className="mt-2 text-sm leading-6 text-black/58">
              Cada tarjeta corresponde a un color. Cargá cada talle con su stock. Si querés dejar el color visible pero agotado, dejalo sin talles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setVariants((current) => [...current, createVariantDraft()])}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/76 transition hover:bg-black hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Agregar variante
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {variants.map((variant, index) => {
            const currentImages = currentImagesByColor.get(variant.colorName.trim()) ?? []

            return (
              <div key={variant.id} className="rounded-[24px] border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50">Variante {index + 1}</p>
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setVariants((current) => current.filter((item) => item.id !== variant.id))}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/58 transition hover:bg-black hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar variante
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Nombre de variante</p>
                    <input
                      value={variant.colorName}
                      onChange={(event) => updateVariant(variant.id, 'colorName', event.target.value)}
                      placeholder="Ej: Negro"
                      className="mt-2 w-full rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Código color web</p>
                    <div className="mt-2 flex items-center gap-2 rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-2">
                      <span className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: variant.colorHex || '#0B0B0B' }} />
                      <input
                        value={variant.colorHex}
                        onChange={(event) => updateVariant(variant.id, 'colorHex', event.target.value)}
                        placeholder="#0B0B0B"
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Talles y stock</p>
                    <input
                      value={variant.sizeStocks}
                      onChange={(event) => updateVariant(variant.id, 'sizeStocks', event.target.value)}
                      placeholder="XS:10, M:15, L:3"
                      className="mt-2 w-full rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-sm outline-none"
                    />
                    <p className="mt-2 text-xs text-black/45">
                      Podés escribir <span className="font-medium text-black/68">XS:10, M:15, L:3</span> o <span className="font-medium text-black/68">10 XS, 15 M, 3 L</span>.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">SKU base opcional</p>
                    <input
                      value={variant.sku}
                      onChange={(event) => updateVariant(variant.id, 'sku', event.target.value)}
                      placeholder="Ej: campera-negro"
                      className="mt-2 w-full rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-sm outline-none"
                    />
                    <p className="mt-2 text-xs text-black/45">Si lo completás, el sistema genera uno por talle automáticamente.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-black/8 bg-[#f7f7f4] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Vista previa de talles publicados</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseSizeStockInput(variant.sizeStocks).length > 0 ? (
                      parseSizeStockInput(variant.sizeStocks).map(({ size, stock }) => (
                          <span
                            key={`${variant.id}-${size}`}
                            className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black/72"
                          >
                            {size}: {stock}
                          </span>
                        ))
                    ) : (
                      <span className="text-sm text-black/50">Todavía no cargaste talles con stock para este color.</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-dashed border-black/12 bg-[#fbfbf8] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Archivo de esta variante</p>
                  <p className="mt-2 text-sm leading-6 text-black/56">
                    Subí la imagen principal que corresponde a esta variante. Se va a usar cuando el usuario elija este color.
                  </p>

                  <input type="hidden" name="imageColorAssignments" value={variant.newImageName ? variant.colorName : ''} />
                  <input
                    name="images"
                    type="file"
                    accept="image/*"
                    className="mt-4 block w-full text-sm"
                    onChange={(event) =>
                      updateVariant(
                        variant.id,
                        'newImageName',
                        event.target.files?.[0]?.name ?? '',
                      )
                    }
                  />

                  {variant.newImageName ? (
                    <div className="mt-3 rounded-[14px] border border-black/10 bg-white px-3 py-3 text-sm text-black/76">
                      {variant.newImageName}
                    </div>
                  ) : null}

                  {currentImages.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Imágenes actuales de esta variante</p>
                      <div className="mt-3 space-y-2">
                        {currentImages.map((image, imageIndex) => (
                          <div key={`${image.id}-${imageIndex}`} className="rounded-[14px] border border-black/10 bg-white px-3 py-3 text-sm text-black/68">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-black/82">{image.colorName}</p>
                                <p className="mt-1 truncate text-xs text-black/46">{image.url}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setRemovedImageIds((current) =>
                                    current.includes(image.id) ? current : [...current, image.id],
                                  )
                                }
                                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/58 transition hover:bg-black hover:text-white"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar imagen
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Imágenes informativas</p>
            <p className="mt-2 text-sm leading-6 text-black/58">
              Cargá guía de talles, materiales, detalles o lifestyle. No dependen del color seleccionado.
            </p>
          </div>
        </div>

        <input
          name="infoImages"
          type="file"
          accept="image/*"
          multiple
          className="mt-4 block w-full text-sm"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            setInfoImages(
              files.map((file, index) => ({
                id: `${file.name}-${index}`,
                fileName: file.name,
                type: 'INFO',
                sortOrder: String(index + 1),
              })),
            )
          }}
        />

        {infoImages.length > 0 ? (
          <div className="mt-4 space-y-4">
            {infoImages.map((image) => (
              <div key={image.id} className="rounded-[20px] border border-black/10 bg-white p-4">
                <input type="hidden" name="infoImageTypes" value={image.type} />
                <input type="hidden" name="infoImageSortOrders" value={image.sortOrder} />
                <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr_0.6fr]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Archivo</p>
                    <div className="mt-2 rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-sm text-black/76">
                      {image.fileName}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Tipo</p>
                    <select
                      value={image.type}
                      onChange={(event) =>
                        setInfoImages((current) =>
                          current.map((item) => (item.id === image.id ? { ...item, type: event.target.value as 'INFO' | 'LIFESTYLE' } : item)),
                        )
                      }
                      className="mt-2 w-full rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-sm outline-none"
                    >
                      <option value="INFO">Guía / Materiales / Detalles</option>
                      <option value="LIFESTYLE">Lifestyle</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Orden</p>
                    <input
                      value={image.sortOrder}
                      onChange={(event) =>
                        setInfoImages((current) =>
                          current.map((item) => (item.id === image.id ? { ...item, sortOrder: event.target.value } : item)),
                        )
                      }
                      className="mt-2 w-full rounded-[14px] border border-black/10 bg-[#f7f7f4] px-3 py-3 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {currentInfoImages.length > 0 ? (
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/45">Imágenes informativas actuales</p>
            <div className="mt-3 space-y-2">
              {currentInfoImages.map((image) => (
                <div key={image.id} className="rounded-[14px] border border-black/10 bg-white px-3 py-3 text-sm text-black/68">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-black/82">{image.type}</p>
                      <p className="mt-1 truncate text-xs text-black/46">{image.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemovedImageIds((current) => (current.includes(image.id) ? current : [...current, image.id]))}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/58 transition hover:bg-black hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-[24px] border border-black/10 bg-[#fafaf7] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-black/50">Video</p>
        <p className="mt-2 text-sm leading-6 text-black/58">
          URL opcional de Cloudinary, YouTube o archivo servido externamente.
        </p>
        <input
          name="videoUrl"
          defaultValue={editProduct?.videoUrl ?? ''}
          placeholder="https://..."
          className="mt-4 w-full rounded-[18px] border border-black/10 bg-white px-4 py-4 text-sm outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-5 text-sm text-black/68">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={editProduct?.featured} />
          Destacado
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="productStar" defaultChecked={editProduct?.productStar} />
          Producto más vendido
        </label>
        {editProduct ? (
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="replaceImages" />
            Reemplazar imágenes actuales
          </label>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AdminProductSubmit mode={mode} pending={isPending} />
        <Link
          href="/admin/productos"
          className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/70 transition hover:bg-black hover:text-white"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
