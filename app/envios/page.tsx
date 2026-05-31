import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { ensureStoreSettings } from '@/lib/server/fulfillment'

export default async function ShippingPage() {
  const settings = await ensureStoreSettings()

  return (
    <section className="shell pb-12 pt-40">
      <div className="card-surface p-7 md:p-9">
        <p className="eyebrow">Envíos</p>
        <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">
          {settings.barilocheEnabled ? 'Operación pensada para Bariloche y para todo el país' : 'Operación pensada para todo el país'}
        </h1>
        <div className={`mt-6 grid gap-5 ${settings.barilocheEnabled ? 'md:grid-cols-2' : ''}`}>
          {settings.barilocheEnabled ? (
            <div className="rounded-[24px] bg-[#f7f7f4] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-black/50">Same day</p>
              <div className="mt-3 text-sm leading-7 text-black/72">
                <BarilocheDeliveryCountdown variant="block" />
              </div>
            </div>
          ) : null}
          <div className="rounded-[24px] bg-[#f7f7f4] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-black/50">Nacional</p>
            <p className="mt-3 text-sm leading-7 text-black/72">La tienda queda preparada para despacho nacional con actualización de estado en la orden.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
