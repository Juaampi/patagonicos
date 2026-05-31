'use client'

import { useActionState } from 'react'
import { formatPrice } from '@/lib/utils'
import {
  updateStoreSettingsAction,
  type UpdateStoreSettingsState,
} from '@/lib/server/fulfillment-actions'
import type { StoreSettingsSnapshot } from '@/lib/store-settings'

const initialState: UpdateStoreSettingsState = {
  status: 'idle',
  message: '',
}

function Field({
  label,
  name,
  defaultValue,
  helper,
}: {
  label: string
  name: keyof StoreSettingsSnapshot
  defaultValue: number
  helper?: string
}) {
  return (
    <label className="rounded-[22px] border border-black/8 bg-white p-4">
      <span className="text-xs uppercase tracking-[0.16em] text-black/42">{label}</span>
      <input
        type="number"
        name={name}
        min="0"
        defaultValue={defaultValue}
        className="mt-3 w-full rounded-[16px] border border-black/10 bg-[#f7f7f4] px-4 py-3 text-base font-semibold text-black outline-none"
      />
      {helper ? <span className="mt-2 block text-xs leading-5 text-black/48">{helper}</span> : null}
    </label>
  )
}

export function AdminSettingsPanel({ settings }: { settings: StoreSettingsSnapshot }) {
  const [state, formAction, isPending] = useActionState(updateStoreSettingsAction, initialState)

  return (
    <form action={formAction} className="card-surface p-7">
      <p className="eyebrow">Configuración</p>
      <h2 className="mt-4 font-display text-3xl tracking-[-0.05em]">Base operativa</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-black/58">
        Desde acá prendés o apagás toda la operación especial de Bariloche y ajustás costos, corte y descuento.
      </p>

      <div className="mt-6 rounded-[24px] border border-black/8 bg-[#fafaf8] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-black/42">Operación Bariloche</p>
            <p className="mt-2 text-lg font-semibold text-black/84">
              {settings.barilocheEnabled ? 'Activa' : 'Oculta en la tienda'}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/58">
              Si la apagás, desaparecen el envío en el día, el contra entrega, el countdown y el descuento Bariloche en toda la web.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-black/78">
            <input
              type="checkbox"
              name="barilocheEnabled"
              defaultChecked={settings.barilocheEnabled}
              className="peer sr-only"
            />
            <span
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                settings.barilocheEnabled ? 'bg-black' : 'bg-black/12'
              } peer-checked:bg-black`}
            >
              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:left-6" />
            </span>
            Activar Bariloche
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field
          label="Gratis Bariloche"
          name="localDeliveryFreeThreshold"
          defaultValue={settings.localDeliveryFreeThreshold}
          helper={`Hoy: ${formatPrice(settings.localDeliveryFreeThreshold)}`}
        />
        <Field
          label="Costo local"
          name="localDeliveryCost"
          defaultValue={settings.localDeliveryCost}
          helper={`Hoy: ${formatPrice(settings.localDeliveryCost)}`}
        />
        <Field
          label="Costo nacional"
          name="nationalShippingCost"
          defaultValue={settings.nationalShippingCost}
          helper={`Hoy: ${formatPrice(settings.nationalShippingCost)}`}
        />
        <Field
          label="Corte hora"
          name="barilocheCutoffHour"
          defaultValue={settings.barilocheCutoffHour}
        />
        <Field
          label="Corte minuto"
          name="barilocheCutoffMinute"
          defaultValue={settings.barilocheCutoffMinute}
        />
        <Field
          label="Descuento Bariloche"
          name="barilocheDiscountPercent"
          defaultValue={settings.barilocheDiscountPercent}
          helper="Se aplica cuando el cliente elige Río Negro + San Carlos de Bariloche."
        />
      </div>

      {state.status !== 'idle' ? (
        <div
          className={`mt-6 rounded-[22px] px-5 py-4 text-sm ${
            state.status === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black/86 disabled:cursor-wait disabled:bg-black/70"
        >
          {isPending ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  )
}
