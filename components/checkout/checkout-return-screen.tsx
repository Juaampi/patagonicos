'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCheck, Clock3 } from 'lucide-react'
import { hasTrackedPurchase, markPurchaseTracked, trackPurchase } from '@/lib/client/analytics'

type ConfirmedOrderPayload = {
  id: string
  orderNumber?: string | null
  shortCode?: string | null
  customerEmail?: string | null
  currency?: string
  total: number
  shippingAmount?: number
  items: Array<{
    item_id: string
    item_name: string
    item_variant?: string
    price: number
    quantity: number
  }>
}

type CheckoutReturnScreenProps = {
  email?: string
  orderId?: string
  orderNumber?: string
  shortCode?: string
  paymentId?: string
  status: 'success' | 'pending' | 'failure'
}

export function CheckoutReturnScreen({
  email,
  orderId,
  orderNumber,
  shortCode,
  paymentId,
  status,
}: CheckoutReturnScreenProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderPayload | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<'idle' | 'confirming' | 'confirmed' | 'failed'>(
    paymentId ? 'confirming' : 'idle',
  )
  const resolvedOrderId = confirmedOrder?.id ?? orderId
  const resolvedEmail = confirmedOrder?.customerEmail ?? email
  const resolvedOrderNumber = confirmedOrder?.orderNumber ?? orderNumber
  const resolvedShortCode = confirmedOrder?.shortCode ?? shortCode

  useEffect(() => {
    if (status !== 'success' || !paymentId) {
      return
    }

    const url = new URL('/api/checkout/confirm', window.location.origin)
    url.searchParams.set('payment_id', paymentId)
    if (orderId) {
      url.searchParams.set('order', orderId)
    }

    let cancelled = false

    async function confirmPayment() {
      setConfirmationStatus('confirming')

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store',
            keepalive: true,
          })
          const data = (await response.json()) as { ok?: boolean; approved?: boolean; order?: ConfirmedOrderPayload | null }

          if (!cancelled && response.ok && data.ok) {
            setConfirmedOrder(data.order ?? null)
            setConfirmationStatus('confirmed')
            return
          }
        } catch {
          // Retry once before giving up. The webhook can still reconcile later.
        }

        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200))
        }
      }

      if (!cancelled) {
        setConfirmationStatus('failed')
      }
    }

    void confirmPayment()

    return () => {
      cancelled = true
    }
  }, [orderId, paymentId, status])

  useEffect(() => {
    const safeOrderId = resolvedOrderId

    if (status !== 'success' || confirmationStatus !== 'confirmed' || !confirmedOrder || !safeOrderId) {
      return
    }

    if (hasTrackedPurchase(safeOrderId)) {
      return
    }

    trackPurchase({
      orderId: safeOrderId,
      orderNumber: confirmedOrder.orderNumber ?? confirmedOrder.shortCode ?? undefined,
      currency: confirmedOrder.currency ?? 'ARS',
      shipping: confirmedOrder.shippingAmount ?? 0,
      total: confirmedOrder.total,
      items: confirmedOrder.items,
    })
    markPurchaseTracked(safeOrderId)
  }, [confirmationStatus, confirmedOrder, resolvedOrderId, status])

  useEffect(() => {
    if (status !== 'success' || !resolvedEmail || !resolvedOrderId) {
      return
    }

    if (paymentId && confirmationStatus === 'confirming') {
      return
    }

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          return 0
        }

        return current - 1
      })
    }, 1000)

    const timeout = window.setTimeout(() => {
      router.push(`/perfil?email=${encodeURIComponent(resolvedEmail)}&saved=created&order=${encodeURIComponent(resolvedOrderId)}`)
    }, 5000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [confirmationStatus, paymentId, resolvedEmail, resolvedOrderId, router, status])

  if (status === 'success') {
    return (
      <section className="relative min-h-[calc(100vh-120px)] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#16a34a_0%,#22c55e_48%,rgba(34,197,94,0.18)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[56vh] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.3),transparent_55%)]" />
        <div className="shell relative flex min-h-[calc(100vh-120px)] items-center justify-center py-10">
          <div className="w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/30 bg-white shadow-[0_40px_120px_rgba(4,120,87,0.35)]">
            <div className="bg-[linear-gradient(135deg,#15803d_0%,#22c55e_55%,#86efac_100%)] px-6 py-10 text-white md:px-10 md:py-14">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/35 bg-white/14 shadow-[0_16px_40px_rgba(255,255,255,0.18)] md:h-24 md:w-24">
                  <CheckCheck className="h-10 w-10 md:h-12 md:w-12" />
                </div>
                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/82">Pago confirmado</p>
                <h1 className="mt-4 font-display text-4xl tracking-[-0.06em] md:text-6xl">Gracias por tu compra</h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/88 md:text-base md:leading-8">
                  Recibimos la confirmación de Mercado Pago y ya dejamos listo el acceso para seguir el estado de tu pedido.
                </p>
                {paymentId && confirmationStatus === 'confirming' ? (
                  <p className="mx-auto mt-4 max-w-2xl text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                    Confirmando pago en el sistema…
                  </p>
                ) : null}
                {paymentId && confirmationStatus === 'failed' ? (
                  <p className="mx-auto mt-4 max-w-2xl text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                    El pago fue aprobado. Si la cuenta tarda en actualizar, refrescá en unos segundos.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Redirección automática</p>
                <h2 className="mt-3 font-display text-3xl tracking-[-0.05em] text-black md:text-4xl">
                  Te vamos a llevar a tu panel de control para ver el estado de tu pedido en {countdown}.
                </h2>
                <p className="mt-4 text-sm leading-7 text-black/62 md:text-base md:leading-8">
                  Ahí vas a poder revisar la compra, confirmar el estado del pago y seguir el avance del envío.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {[5, 4, 3, 2, 1].map((value) => {
                    const active = countdown === value
                    const done = countdown < value

                    return (
                      <div
                        key={value}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-base font-semibold transition md:h-14 md:w-14 md:text-lg ${
                          active
                            ? 'scale-110 border-emerald-500 bg-emerald-500 text-white shadow-[0_18px_40px_rgba(34,197,94,0.28)]'
                            : done
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-black/10 bg-[#f6f8f3] text-black/48'
                        }`}
                      >
                        {value}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-[#edf6ee]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#16a34a_0%,#22c55e_50%,#86efac_100%)] transition-[width] duration-1000"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="rounded-[30px] border border-emerald-100 bg-[#f6fff7] p-6 shadow-[0_16px_50px_rgba(17,24,39,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Resumen de compra</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-black/44">Estado</p>
                    <p className="mt-1 text-lg font-semibold text-black">Pago acreditado</p>
                  </div>
                  {resolvedShortCode ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-black/44">Código</p>
                      <p className="mt-1 text-lg font-semibold text-black">{resolvedShortCode}</p>
                    </div>
                  ) : null}
                  {resolvedOrderNumber ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-black/44">Pedido</p>
                      <p className="mt-1 text-lg font-semibold text-black">{resolvedOrderNumber}</p>
                    </div>
                  ) : null}
                  {resolvedEmail && resolvedOrderId ? (
                    <Link
                      href={`/perfil?email=${encodeURIComponent(resolvedEmail)}&saved=created&order=${encodeURIComponent(resolvedOrderId)}`}
                      className="button-primary w-full justify-center"
                    >
                      Ver mi pedido ahora
                    </Link>
                  ) : null}
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                    <ArrowRight className="h-4 w-4" />
                    Redirigiendo a tu panel ahora
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const isPending = status === 'pending'

  return (
    <section className="shell pb-12 pt-32">
      <div className="card-surface mx-auto max-w-3xl p-8 text-center">
        <div className={`mx-auto flex h-18 w-18 items-center justify-center rounded-full ${
          isPending ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        }`}>
          {isPending ? <Clock3 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
        </div>
        <p className="eyebrow mt-6">{isPending ? 'Pago pendiente' : 'Pago no completado'}</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">
          {isPending ? 'Estamos esperando la confirmación de Mercado Pago' : 'No pudimos confirmar el pago'}
        </h1>
        <p className="mt-4 text-sm leading-7 text-black/60">
          {isPending
            ? 'Cuando Mercado Pago termine de procesarlo vas a poder verlo reflejado en tu cuenta.'
            : 'Podés volver al carrito para intentarlo de nuevo o revisar otra forma de pago.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/carrito" className="button-primary">
            Volver al carrito
          </Link>
          {email ? (
            <Link href={`/perfil?email=${encodeURIComponent(email)}`} className="button-secondary">
              Ver mi cuenta
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
