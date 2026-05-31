'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  markDeliveryDeliveredAction,
  markDeliveryFailedAction,
  markDeliveryInRouteAction,
  markDeliveryRescheduledAction,
  sendDeliveryWhatsAppAction,
} from '@/lib/server/fulfillment-actions'
import { DeliveryTicketButton } from './delivery-ticket-button'

type DeliveryStopActionsProps = {
  orderId: string
  orderUrl: string
  ticketUrl: string
  mapsUrl: string
  pinUrl: string
  phoneUrl: string | null
  defaultWhatsappUrl: string
  compact?: boolean
}

export function DeliveryStopActions({
  orderId,
  orderUrl,
  ticketUrl,
  mapsUrl,
  pinUrl,
  phoneUrl,
  defaultWhatsappUrl,
  compact = false,
}: DeliveryStopActionsProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [manualWhatsappUrl, setManualWhatsappUrl] = useState<string>(defaultWhatsappUrl)
  const [isPending, startTransition] = useTransition()

  const openWhatsApp = (url: string) => {
    const popup = window.open(url, '_blank', 'noopener,noreferrer')

    if (!popup) {
      setManualWhatsappUrl(url)
      setFeedback('El navegador bloqueo la ventana. Usa el boton manual de WhatsApp.')
      return
    }

    setFeedback(null)
  }

  const runAction = (action: () => Promise<{ error?: string; whatsappUrl?: string; success?: boolean }>) => {
    startTransition(async () => {
      setFeedback(null)
      const result = await action()

      if (result.error) {
        setFeedback(result.error)
        return
      }

      if (result.whatsappUrl) {
        setManualWhatsappUrl(result.whatsappUrl)
        openWhatsApp(result.whatsappUrl)
      }

      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href={orderUrl}
          className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
        >
          Ver pedido
        </Link>
        <DeliveryTicketButton href={ticketUrl} />
        <Link
          href={mapsUrl}
          target="_blank"
          className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
        >
          Abrir mapa
        </Link>
        {pinUrl ? (
          <Link
            href={pinUrl}
            target="_blank"
            className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
          >
            Ver pin
          </Link>
        ) : null}
        {phoneUrl ? (
          <Link
            href={phoneUrl}
            className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
          >
            Llamar cliente
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => runAction(() => sendDeliveryWhatsAppAction(orderId))}
          className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
        >
          Enviar WhatsApp
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => markDeliveryInRouteAction(orderId))}
          className="rounded-full bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/82 disabled:opacity-60"
        >
          Marcar en camino
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => markDeliveryDeliveredAction(orderId))}
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
        >
          Marcar entregado
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => markDeliveryRescheduledAction(orderId))}
          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
        >
          Reprogramar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => markDeliveryFailedAction(orderId))}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-800 transition hover:bg-red-100 disabled:opacity-60"
        >
          Intento fallido
        </button>
        {manualWhatsappUrl ? (
          <Link
            href={manualWhatsappUrl}
            target="_blank"
            className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/72 transition hover:bg-black hover:text-white"
          >
            Abrir WhatsApp
          </Link>
        ) : null}
      </div>

      {feedback ? <p className={`${compact ? 'text-xs' : 'text-sm'} text-black/56`}>{feedback}</p> : null}
    </div>
  )
}
