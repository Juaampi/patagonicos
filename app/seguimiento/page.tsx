import Link from 'next/link'
import { findMockTrackingOrder } from '@/lib/mock-order-tracking'

export const dynamic = 'force-dynamic'

export default async function TrackingPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const code = params?.code?.trim() ?? ''
  const order = code ? findMockTrackingOrder(code) : null

  return (
    <section className="shell pb-12 pt-40">
      <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="card-surface p-7 md:p-9">
          <p className="eyebrow">Seguimiento de pedidos</p>
          <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Buscá tu envío con el código de seguimiento</h1>
          <p className="mt-5 text-base leading-8 text-black/62">
            Por ahora esta vista muestra datos mockeados hasta integrar la API de Andreani, pero ya queda lista para el flujo real.
          </p>

          <form action="/seguimiento" className="mt-8 space-y-4">
            <input
              name="code"
              defaultValue={code}
              placeholder="Ej: AND-PA-24001"
              className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
            />
            <button className="button-primary w-full md:w-auto">Buscar pedido</button>
          </form>

          <div className="mt-8 rounded-[22px] border border-black/8 bg-[#f7f7f4] px-5 py-5 text-sm text-black/60">
            <p className="font-medium text-black/82">Códigos demo para probar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['AND-PA-24001', 'AND-PA-24002', 'AND-PA-24003'].map((sample) => (
                <Link
                  key={sample}
                  href={`/seguimiento?code=${sample}`}
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/74 transition hover:bg-black hover:text-white"
                >
                  {sample}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface p-7 md:p-9">
          {!code ? (
            <div className="rounded-[24px] bg-[#f7f7f4] px-6 py-8 text-sm leading-7 text-black/58">
              Ingresá tu código de seguimiento para ver por dónde va el pedido.
            </div>
          ) : !order ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-8 text-sm leading-7 text-red-700">
              No encontramos el código <strong>{code}</strong>. Revisalo o probá con uno de los códigos demo.
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-black/46">{order.code}</p>
                <h2 className="mt-3 font-display text-4xl tracking-[-0.05em] text-black">{order.status}</h2>
                <p className="mt-3 text-sm leading-7 text-black/60">
                  {order.eta} · {order.carrier} · destino {order.destination}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Cliente</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{order.customerName}</p>
                </div>
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Correo</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{order.carrier}</p>
                </div>
                <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/46">Entrega estimada</p>
                  <p className="mt-2 text-sm font-medium text-black/82">{order.eta}</p>
                </div>
              </div>

              <div className="space-y-3">
                {order.events.map((event, index) => (
                  <div key={`${event.label}-${index}`} className="rounded-[22px] border border-black/8 bg-white px-5 py-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-black/86">{event.label}</p>
                        <p className="mt-1 text-sm leading-6 text-black/60">{event.description}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-black/42">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
