import Link from 'next/link'
import { AdminProductForm } from './admin-product-form'
import { AdminShell } from './admin-shell'

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
  freeShippingUpsell: boolean
  productStar: boolean
  variants: Array<{ colorName: string; colorHex: string; size: string; stock: number; sku: string }>
  images: Array<{ id: string; url: string; alt: string; colorName?: string; type: 'MAIN' | 'COLOR' | 'INFO' | 'LIFESTYLE'; sortOrder: number }>
}

export function AdminProductEditorPage({
  categories,
  editProduct,
  mode,
}: {
  categories: CategoryOption[]
  editProduct?: EditProduct
  mode: 'create' | 'edit'
}) {
  return (
    <AdminShell>
      <div className="card-surface p-7">
        <p className="eyebrow">Productos</p>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mt-4 font-display text-5xl tracking-[-0.05em]">
              {mode === 'edit' ? 'Editar producto' : 'Agregar producto'}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
              Esta pantalla es solo para carga y edición. La lista del catálogo queda separada en el panel principal.
            </p>
          </div>
          <Link
            href="/admin/productos"
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/78 transition hover:bg-black hover:text-white"
          >
            Volver a productos
          </Link>
        </div>
      </div>

      <AdminProductForm categories={categories} editProduct={editProduct} mode={mode} />
    </AdminShell>
  )
}
