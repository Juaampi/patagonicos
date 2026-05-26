import Image from 'next/image'
import Link from 'next/link'
import { ProductStatus } from '@prisma/client'
import { deleteProductAction } from '@/lib/server/catalog'
import { formatPrice } from '@/lib/utils'

type AdminProduct = {
  id: string
  name: string
  slug: string
  mainImageUrl?: string
  price: number
  status: ProductStatus
  category: { name: string }
  variants: Array<{ stock: number; size: string; colorName: string; colorHex: string; sku: string }>
  images: Array<{ url: string; alt: string; colorName: string; type: 'MAIN' | 'COLOR' | 'INFO' | 'LIFESTYLE'; sortOrder: number }>
}

export function AdminProductTable({ products }: { products: AdminProduct[] }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-6 py-4">
        <p className="eyebrow">Catalogo</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f7f7f4] text-[11px] uppercase tracking-[0.16em] text-black/50">
            <tr>
              <th className="px-5 py-3 font-medium">Producto</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-black/8 align-middle">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-[14px] bg-[#f3f3ef]">
                        {product.mainImageUrl || product.images[0] ? (
                          <Image src={product.mainImageUrl ?? product.images[0].url} alt={product.name} fill className="object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-black/84">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-black/45">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-black/66">{product.category.name}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full border border-black/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em]">
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-black/82">{product.variants.reduce((total, variant) => total + variant.stock, 0)}</td>
                  <td className="px-5 py-3 font-medium text-black/82">{formatPrice(product.price)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
                      >
                        Editar
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="productId" value={product.id} />
                        <button className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
