import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { AdminShell } from './admin-shell'
import { AdminProductTable } from './admin-product-table'
import { AdminReviewsPanel } from './admin-reviews-panel'
import { AdminOrdersPanel } from './admin-orders-panel'
import { AdminPrintJobsPanel } from './admin-print-jobs-panel'

type AdminDashboardProps = {
  products: Array<{
    id: string
    name: string
    slug: string
    mainImageUrl?: string
    price: number
    status: 'ACTIVE' | 'INACTIVE'
    category: { name: string }
    variants: Array<{ stock: number; size: string; colorName: string; colorHex: string; sku: string }>
    images: Array<{ url: string; alt: string; colorName: string; type: 'MAIN' | 'COLOR' | 'INFO' | 'LIFESTYLE'; sortOrder: number }>
  }>
  orders: Array<{
    id: string
    orderNumber: string
    shortCode?: string
    status: string
    paymentStatus: string
    paymentMethod: string
    shippingMethod: string
    shippingStatus: string
    total: number
    createdAt: string
    customerName: string
    customerPhone?: string
    city?: string
    printJobs: Array<{ id: string; status: string; type: string }>
  }>
  printJobs: Array<{
    id: string
    orderId: string
    type: string
    status: string
    fileUrl?: string
    createdAt: string
    printedAt?: string
    orderShortCode?: string
    customerName: string
  }>
  reviews: Array<{
    id: string
    productId: string
    productName: string
    authorName: string
    rating: number
    comment: string
    createdAt: string
    imageUrl?: string
  }>
  settings: {
    localDeliveryFreeThreshold: number
    localDeliveryCost: number
    nationalShippingCost: number
    barilocheCutoffHour: number
    barilocheCutoffMinute: number
  }
  savedMessage?: string
}

export function AdminDashboard({ products, orders, printJobs, reviews, settings, savedMessage }: AdminDashboardProps) {
  return (
    <AdminShell>
      <div className="card-surface p-7">
        <p className="eyebrow">Panel privado</p>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="mt-4 font-display text-5xl tracking-[-0.05em]">Productos</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-black/62">
              Desde acá ves el catálogo y elegís cuándo crear, editar o eliminar.
            </p>
          </div>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/82"
          >
            Agregar producto
          </Link>
        </div>
        {savedMessage ? (
          <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {savedMessage}
          </div>
        ) : null}
      </div>

      <section id="productos">
        <AdminProductTable products={products} />
      </section>

      <div className="card-surface p-7">
        <p className="eyebrow">Configuración logística</p>
        <h2 className="mt-4 font-display text-3xl tracking-[-0.05em]">Base operativa</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-black/8 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-black/42">Gratis Bariloche</p>
            <p className="mt-3 text-2xl font-semibold">{formatPrice(settings.localDeliveryFreeThreshold)}</p>
          </div>
          <div className="rounded-[22px] border border-black/8 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-black/42">Costo local</p>
            <p className="mt-3 text-2xl font-semibold">{formatPrice(settings.localDeliveryCost)}</p>
          </div>
          <div className="rounded-[22px] border border-black/8 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-black/42">Costo nacional</p>
            <p className="mt-3 text-2xl font-semibold">{formatPrice(settings.nationalShippingCost)}</p>
          </div>
          <div className="rounded-[22px] border border-black/8 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-black/42">Corte Bariloche</p>
            <p className="mt-3 text-2xl font-semibold">
              {`${`${settings.barilocheCutoffHour}`.padStart(2, '0')}:${`${settings.barilocheCutoffMinute}`.padStart(2, '0')} hs`}
            </p>
          </div>
        </div>
      </div>

      <section id="pedidos">
        <AdminOrdersPanel orders={orders} />
      </section>

      <AdminPrintJobsPanel printJobs={printJobs} />

      <AdminReviewsPanel reviews={reviews} />
    </AdminShell>
  )
}
