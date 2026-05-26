import { internalAccessLoginAction } from '@/lib/server/internal-access'

export default async function DeliveryLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const nextPath = params?.next ? decodeURIComponent(params.next) : '/delivery/orders'

  return (
    <section className="shell pb-12 pt-40">
      <div className="mx-auto max-w-lg card-surface p-7">
        <p className="eyebrow">Acceso interno</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Ingreso repartos y fulfillment</h1>
        <p className="mt-4 text-sm leading-7 text-black/60">
          Usá el código interno para abrir pedidos escaneados desde QR y operar reparto desde el celular.
        </p>
        {params?.error ? (
          <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            El código no coincide. Probá de nuevo.
          </div>
        ) : null}
        <form action={internalAccessLoginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <input
            name="code"
            type="password"
            placeholder="Código interno"
            className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
          />
          <button className="button-primary w-full">Entrar</button>
        </form>
      </div>
    </section>
  )
}
