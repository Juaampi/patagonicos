import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LogoMark } from './logo-mark'

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="inline-flex flex-col items-center text-center">
      <LogoMark className="h-4.5 w-10 md:h-6 md:w-12" />
      <div className="mt-1 leading-tight">
        <div
          className={cn(
            'font-display text-[11px] uppercase tracking-[0.28em] md:text-[1rem] md:tracking-[0.34em]',
            inverted ? 'text-white' : 'text-black',
          )}
          aria-label="Patagónicos"
        >
          PATAGÓNICOS
        </div>
        <div className={cn('mx-auto mt-1 h-px w-7 md:w-8', inverted ? 'bg-white/55' : 'bg-black/55')} />
        <p
          className={cn(
            'mt-1 text-[7px] uppercase tracking-[0.12em] md:text-[9px] md:tracking-[0.14em]',
            inverted ? 'text-white/72' : 'text-black/72',
          )}
        >
          Indumentaria para mascotas
        </p>
      </div>
    </Link>
  )
}
