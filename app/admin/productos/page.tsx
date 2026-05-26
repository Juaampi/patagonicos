import Link from 'next/link'
import { AdminProductTable } from '@/components/admin/admin-product-table'
import { getAdminSnapshot } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

function getSavedMessage(saved?: string) {
  if (saved === 'created') return 'Producto creado correctamente.'
  if (saved === 'updated') return 'Producto actualizado correctamente.'
  if (saved === 'deleted') return 'Producto eliminado correctamente.'
  return undefined
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>
}) {
  const snapshot = await getAdminSnapshot()
  const params = searchParams ? await searchParams : undefined
  const savedMessage = getSavedMessage(params?.saved)

  return (
    <>
      <div className="card-surface p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Productos</p>
            <h2 className="mt-4 font-display text-5xl tracking-[-0.05em]">Catalogo</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
              Alta, edicion y control de stock del catalogo sin mezclarlo con pedidos o reparto.
            </p>
          </div>
          <Link href="/admin/productos/nuevo" className="button-primary">
            Agregar producto
          </Link>
        </div>
        {savedMessage ? (
          <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {savedMessage}
          </div>
        ) : null}
      </div>

      <AdminProductTable
        products={snapshot.products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          mainImageUrl: product.mainImageUrl ?? undefined,
          price: product.price,
          status: product.status,
          category: { name: product.category.name },
          variants: product.variants.map((variant) => ({
            stock: variant.stock,
            size: variant.size,
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            sku: variant.sku,
          })),
          images: product.images.map((image) => ({
            url: image.url,
            alt: image.alt,
            colorName: image.colorName ?? '',
            type: image.type,
            sortOrder: image.sortOrder,
          })),
        }))}
      />
    </>
  )
}
