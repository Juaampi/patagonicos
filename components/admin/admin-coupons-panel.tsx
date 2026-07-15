import { saveCouponAction } from '@/lib/server/coupon-actions'

type CouponRecord = {
  id: string
  code: string
  description: string | null
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minSubtotal: number
  maxUses: number | null
  startsAt: Date | null
  expiresAt: Date | null
  active: boolean
  _count: {
    orders: number
  }
}

function formatDateTimeLocal(value: Date | null) {
  if (!value) {
    return ''
  }

  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  const hours = `${value.getHours()}`.padStart(2, '0')
  const minutes = `${value.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function CouponForm({
  coupon,
  mode,
}: {
  coupon?: CouponRecord
  mode: 'create' | 'edit'
}) {
  return (
    <form action={saveCouponAction} className="rounded-[26px] border border-black/8 bg-white p-5">
      <input type="hidden" name="couponId" value={coupon?.id ?? ''} />
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-black/42">
            {mode === 'create' ? 'Nuevo cupón' : coupon?.code}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-black/84">
            {mode === 'create' ? 'Crear cupón' : 'Editar cupón'}
          </h3>
          {coupon ? (
            <p className="mt-2 text-sm text-black/56">
              Usos registrados: {coupon._count.orders}
            </p>
          ) : (
            <p className="mt-2 text-sm text-black/56">
              Definí código, descuento, vigencia y activación.
            </p>
          )}
        </div>

        <label className="flex items-center gap-3 rounded-full border border-black/10 bg-[#fafaf8] px-4 py-3 text-sm text-black/78">
          <input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} className="h-4 w-4" />
          Activo
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Código</span>
          <input
            name="code"
            defaultValue={coupon?.code ?? ''}
            placeholder="PATI10"
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm uppercase outline-none"
          />
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Tipo</span>
          <select
            name="type"
            defaultValue={coupon?.type ?? 'PERCENTAGE'}
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="PERCENTAGE">Porcentaje</option>
            <option value="FIXED">Monto fijo</option>
          </select>
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Valor</span>
          <input
            type="number"
            min="1"
            name="value"
            defaultValue={coupon?.value ?? 10}
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Compra mínima</span>
          <input
            type="number"
            min="0"
            name="minSubtotal"
            defaultValue={coupon?.minSubtotal ?? 0}
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Máximo de usos</span>
          <input
            type="number"
            min="0"
            name="maxUses"
            defaultValue={coupon?.maxUses ?? ''}
            placeholder="Sin límite"
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4 md:col-span-2 xl:col-span-1">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Descripción</span>
          <input
            name="description"
            defaultValue={coupon?.description ?? ''}
            placeholder="Campaña invierno"
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Empieza</span>
          <input
            type="datetime-local"
            name="startsAt"
            defaultValue={formatDateTimeLocal(coupon?.startsAt ?? null)}
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>
        <label className="rounded-[20px] border border-black/8 bg-[#fafaf8] p-4">
          <span className="text-xs uppercase tracking-[0.16em] text-black/42">Vence</span>
          <input
            type="datetime-local"
            name="expiresAt"
            defaultValue={formatDateTimeLocal(coupon?.expiresAt ?? null)}
            className="mt-3 w-full rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <button className="rounded-full bg-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/86">
          {mode === 'create' ? 'Crear cupón' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

export function AdminCouponsPanel({
  coupons,
  savedMessage,
  errorMessage,
}: {
  coupons: CouponRecord[]
  savedMessage?: string
  errorMessage?: string
}) {
  return (
    <div className="space-y-6">
      <div className="card-surface p-7">
        <p className="eyebrow">Cupones</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Descuentos configurables</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black/58">
          Creá códigos para campañas, clientes especiales o acciones puntuales y aplicalos directo en checkout.
        </p>
        {savedMessage ? (
          <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {savedMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <CouponForm mode="create" />

      <div className="grid gap-5">
        {coupons.map((coupon) => (
          <CouponForm key={coupon.id} coupon={coupon} mode="edit" />
        ))}
      </div>
    </div>
  )
}
