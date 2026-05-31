'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const BARILOCHE_TIMEZONE = 'America/Argentina/Buenos_Aires'
const CUTOFF_HOUR = 14
const CUTOFF_MINUTE = 30

function getZonedParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BARILOCHE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

function getCountdownState(now: Date) {
  const zoned = getZonedParts(now)
  const nowVirtualUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second)
  const todayCutoffVirtualUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, CUTOFF_HOUR, CUTOFF_MINUTE, 0)
  const beforeCutoff = nowVirtualUtc <= todayCutoffVirtualUtc
  const targetVirtualUtc = beforeCutoff
    ? todayCutoffVirtualUtc
    : Date.UTC(zoned.year, zoned.month - 1, zoned.day + 1, CUTOFF_HOUR, CUTOFF_MINUTE, 0)

  const totalSeconds = Math.max(0, Math.floor((targetVirtualUtc - nowVirtualUtc) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    beforeCutoff,
    totalSeconds,
    countdownLabel: `${`${hours}`.padStart(2, '0')}h:${`${minutes}`.padStart(2, '0')}m:${`${seconds}`.padStart(2, '0')}s`,
    urgent: totalSeconds <= 60 * 60,
  }
}

type BarilocheDeliveryCountdownProps = {
  variant?: 'inline' | 'block'
  className?: string
  light?: boolean
  showStatusBadge?: boolean
  copyMode?: 'default' | 'arrival' | 'exclusive'
}

export function BarilocheDeliveryCountdown({
  variant = 'inline',
  className,
  light = false,
  showStatusBadge = false,
  copyMode = 'default',
}: BarilocheDeliveryCountdownProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const state = useMemo(() => getCountdownState(now), [now])
  const accentClass = state.urgent ? (light ? 'text-red-300' : 'text-red-600') : light ? 'text-white' : 'text-black'
  const mutedClass = light ? 'text-white/72' : 'text-black/62'
  const mainClass = light ? 'text-white' : 'text-black'

  if (!mounted) {
    if (variant === 'block') {
      if (copyMode === 'arrival') {
        return (
          <div className={cn('space-y-1', className)}>
            <p className={cn('font-semibold', mainClass)}>Calculando llegada</p>
            <p className={mutedClass}>En todo Bariloche.</p>
          </div>
        )
      }
      return (
        <div className={cn('space-y-1', className)}>
          {showStatusBadge ? (
            <span className="inline-flex rounded-full bg-black/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/72">
              Calculando ventana de entrega
            </span>
          ) : null}
          <p className={cn('font-semibold', mainClass)}>Entrega local en Bariloche</p>
          <p className={mutedClass}>Cargando disponibilidad comercial de hoy.</p>
        </div>
      )
    }

    return (
      <span className={cn(className)}>
        Bariloche: <span className={cn('font-semibold', mainClass)}>calculando ventana de entrega</span>
      </span>
    )
  }

  if (variant === 'block') {
    if (copyMode === 'arrival') {
      return state.beforeCutoff ? (
        <div className={cn('space-y-1', className)}>
          <p className="font-semibold text-emerald-600">Llega hoy.</p>
          <p className={mutedClass}>
            Comprando dentro de <span className={cn('font-semibold', accentClass)}>{state.countdownLabel}</span>
          </p>
          <p className={mutedClass}>En todo Bariloche.</p>
        </div>
      ) : (
        <div className={cn('space-y-1', className)}>
          <p className={cn('font-semibold', mainClass)}>Llega mañana.</p>
          <p className={mutedClass}>
            Nueva ventana en <span className={cn('font-semibold', accentClass)}>{state.countdownLabel}</span>
          </p>
          <p className={mutedClass}>En todo Bariloche.</p>
        </div>
      )
    }

    if (copyMode === 'exclusive') {
      return state.beforeCutoff ? (
        <div className={cn('space-y-1', className)}>
          <p className="font-semibold text-emerald-600">Llega hoy</p>
          <p className={mutedClass}>
            Comprando antes de las {`${CUTOFF_HOUR}`.padStart(2, '0')}:{`${CUTOFF_MINUTE}`.padStart(2, '0')}
          </p>
          <p className={mutedClass}>Exclusivo San Carlos de Bariloche</p>
          <p className={mutedClass}>
            Te queda: <span className={cn('font-semibold', accentClass)}>{state.countdownLabel}</span>
          </p>
        </div>
      ) : (
        <div className={cn('space-y-1', className)}>
          <p className={cn('font-semibold', mainClass)}>Llega mañana</p>
          <p className={mutedClass}>Exclusivo San Carlos de Bariloche</p>
          <p className={mutedClass}>
            Nueva ventana en <span className={cn('font-semibold', accentClass)}>{state.countdownLabel}</span>
          </p>
        </div>
      )
    }

    return state.beforeCutoff ? (
      <div className={cn('space-y-1', className)}>
        {showStatusBadge ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Envíos en el día en Bariloche: activo
          </span>
        ) : null}
        <p className={cn('font-semibold', accentClass)}>
          Comprando dentro de {state.countdownLabel}
        </p>
        <p className={mutedClass}>en Bariloche se entrega en el día.</p>
      </div>
    ) : (
      <div className={cn('space-y-1', className)}>
        {showStatusBadge ? (
          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">
            Envíos en el día en Bariloche: inactivo
          </span>
        ) : null}
        <p className={cn('font-semibold', mainClass)}>En Bariloche llega mañana.</p>
        <p className={mutedClass}>
          Nueva ventana en <span className={cn('font-semibold', accentClass)}>{state.countdownLabel}</span>.
        </p>
      </div>
    )
  }

  return state.beforeCutoff ? (
    <span className={cn(className)}>
      Bariloche: <span className={cn('font-semibold', accentClass)}>comprando dentro de {state.countdownLabel}</span> llega en el día
    </span>
  ) : (
    <span className={cn(className)}>
      Bariloche: <span className={cn('font-semibold', mainClass)}>llega mañana</span> · nueva ventana en{' '}
      <span className={cn('font-semibold', accentClass)}>{state.countdownLabel}</span>
    </span>
  )
}
