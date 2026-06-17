import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type LogoVariant = 'header' | 'footer'

export function Logo({
  inverted = false,
  variant = 'header',
}: {
  inverted?: boolean
  variant?: LogoVariant
}) {
  const isHeader = variant === 'header'

  return (
    <Link
      href="/"
      className={cn(
        'inline-flex flex-col items-center text-center',
        isHeader ? 'gap-0' : 'gap-1.5 md:gap-2',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          isHeader ? 'h-[28px] w-[132px] md:h-[38px] md:w-[186px]' : 'h-[34px] w-[152px] md:h-[44px] md:w-[236px]',
        )}
      >
        <Image
          src="/brand-logo-tight.png"
          alt="Patagónicos"
          fill
          priority
          sizes={isHeader ? '(min-width: 768px) 186px, 132px' : '(min-width: 768px) 236px, 152px'}
          className={cn('brand-logo-image object-contain', inverted ? 'invert brightness-0' : 'invert-0')}
        />
      </div>

      {!isHeader ? (
        <span
          className={cn(
            'block whitespace-nowrap uppercase leading-none text-[9px] font-medium tracking-[0.2em] md:text-[11px] md:tracking-[0.22em]',
            inverted ? 'text-white/74' : 'text-black/68',
          )}
        >
          Indumentaria para mascotas
        </span>
      ) : null}
    </Link>
  )
}
