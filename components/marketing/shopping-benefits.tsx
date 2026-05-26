'use client'

import Link from 'next/link'
import { CircleHelp, Clock3, CreditCard, LockKeyhole, Truck, WalletCards, X } from 'lucide-react'
import { useState } from 'react'
import { BarilocheDeliveryCountdown } from '@/components/marketing/bariloche-delivery-countdown'
import { CashOnDeliveryInfo } from '@/components/marketing/cash-on-delivery-info'
import { TrackingInfo } from '@/components/marketing/tracking-info'
import { formatPrice } from '@/lib/utils'

export function ShoppingBenefits({
  localDeliveryFreeThreshold,
  barilocheEnabled,
}: {
  localDeliveryFreeThreshold: number
  barilocheEnabled: boolean
}) {
  const [infoModal, setInfoModal] = useState<'tracking' | 'delivery' | null>(null)

  return (
    <section className="shell mt-18">
      <div className="rounded-[36px] border border-black/8 bg-[#f7f7f4] px-6 py-8 md:px-8 md:py-10">
        <div className="max-w-2xl">
          <p className="eyebrow">Beneficios de comprar en Patagónicos</p>
          <h2 className="mt-4 font-display text-3xl tracking-[-0.05em] text-black md:text-4xl">
            Compra simple, logística real y seguimiento pensado para cada pedido.
          </h2>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f7f4]">
                <Truck className="h-4.5 w-4.5 text-black/82" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-medium text-black/86">Envío gratis</h3>
                  <button
                    type="button"
                    onClick={() => setInfoModal('tracking')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                    aria-label="Más información sobre seguimiento"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  Envío gratis con tu compra superior a {formatPrice(localDeliveryFreeThreshold)}.
                </p>
                <p className="mt-1 text-sm leading-6 text-black/60">Despacho en el día, sin demoras.</p>
                <p className="mt-1 text-sm leading-6 text-black/60">Seguimiento en todo momento.</p>
              </div>
            </div>
          </article>

          {barilocheEnabled ? (
            <article className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f7f4]">
                  <Clock3 className="h-4.5 w-4.5 text-black/82" />
                </div>
                <div className="min-w-0 flex-1 text-sm leading-6">
                  <BarilocheDeliveryCountdown variant="block" copyMode="exclusive" />
                </div>
              </div>
            </article>
          ) : null}

          {barilocheEnabled ? (
            <article className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f7f4]">
                  <WalletCards className="h-4.5 w-4.5 text-black/82" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-medium text-black/86">Pago contra entrega</h3>
                    <button
                      type="button"
                      onClick={() => setInfoModal('delivery')}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                      aria-label="Más información sobre pago contra entrega"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-black/60">
                    Disponible en Bariloche para compras con entrega local.
                  </p>
                </div>
              </div>
            </article>
          ) : null}

          <article className="rounded-[24px] border border-[#90a8ff]/30 bg-[#eef3ff] px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/88">
                <CreditCard className="h-4.5 w-4.5 text-[#2456d3]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-medium text-[#173a8d]">3 cuotas sin interés</h3>
                <p className="mt-1 text-sm leading-6 text-[#173a8d]/80">Comprá más cómodo y pagá en cuotas.</p>
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border border-black/8 bg-white px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f7f4]">
                <LockKeyhole className="h-4.5 w-4.5 text-black/82" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-medium text-black/86">Pago seguro</h3>
                <p className="mt-1 text-sm leading-6 text-black/60">
                  Pagás con Mercado Pago, 100% seguro.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-4 rounded-[28px] border border-black/8 bg-white px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-black/84">
                No realizamos cambios de prendas, por favor revisar bien las medidas.
              </p>
              <p className="mt-2 text-sm leading-6 text-black/58">
                Si tenés dudas con tu mascota, escribinos antes de comprar y te ayudamos a elegir.
              </p>
            </div>
            <Link
              href="/contacto"
              className="inline-flex shrink-0 rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/78 transition hover:bg-black hover:text-white"
            >
              Ir a WhatsApp
            </Link>
          </div>
        </div>
      </div>

      {infoModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-8">
          <div className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/45">
                  {infoModal === 'tracking' ? 'Seguimiento del pedido' : 'Información de pago'}
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-[-0.04em] text-black">
                  {infoModal === 'tracking' ? 'Despacho y tracking' : 'Pago contra entrega'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-black/62 transition hover:border-black hover:text-black"
                aria-label="Cerrar información"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              {infoModal === 'tracking' ? <TrackingInfo /> : <CashOnDeliveryInfo />}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
