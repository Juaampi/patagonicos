import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminSnapshot } from '@/lib/server/catalog'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const snapshot = await getAdminSnapshot()
  const product = snapshot.products.find((item) => item.id === id)

  if (!product) {
    notFound()
  }

  return (
    <AdminShell>
      <div className="card-surface p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Producto</p>
            <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">{product.name}</h1>
            <p className="mt-3 text-sm text-black/58">{product.slug}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/productos/${product.id}/editar`}
              className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
            >
              Editar
            </Link>
            <Link
              href={`/productos/${product.slug}`}
              className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
            >
              Ver publico
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Resumen</h2>
              <div className="mt-4 space-y-3 text-sm text-black/64">
                <div className="flex items-center justify-between"><span>Categoria</span><strong>{product.category.name}</strong></div>
                <div className="flex items-center justify-between"><span>Estado</span><strong>{product.status}</strong></div>
                <div className="flex items-center justify-between"><span>Precio</span><strong>{formatPrice(product.price)}</strong></div>
                <div className="flex items-center justify-between"><span>Stock total</span><strong>{product.variants.reduce((total, variant) => total + variant.stock, 0)}</strong></div>
              </div>
            </div>

            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Descripcion</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-black/64">{product.shortDescription}</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-black/58">{product.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-black/8 p-5">
              <h2 className="text-lg font-semibold text-black/82">Variantes</h2>
              <div className="mt-4 overflow-x-auto rounded-[20px] border border-black/8">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#f6f6f3] text-[11px] uppercase tracking-[0.16em] text-black/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Color</th>
                      <th className="px-4 py-3 font-medium">Talle</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => (
                      <tr key={variant.sku} className="border-t border-black/8">
                        <td className="px-4 py-3">{variant.colorName}</td>
                        <td className="px-4 py-3">{variant.size}</td>
                        <td className="px-4 py-3">{variant.stock}</td>
                        <td className="px-4 py-3 text-black/52">{variant.sku}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
