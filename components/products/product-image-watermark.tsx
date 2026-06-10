'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

export function ProductImageWatermark({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-3 right-3 z-[2] rounded-full border border-white/28 bg-white/14 backdrop-blur-[6px]',
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
        className,
      )}
      aria-hidden="true"
    >
      <div className={cn('relative', compact ? 'h-[16px] w-[72px]' : 'h-[18px] w-[88px] md:h-[22px] md:w-[102px]')}>
        <Image
          src="/brand-logo-tight.png"
          alt=""
          fill
          sizes={compact ? '72px' : '(min-width: 768px) 102px, 88px'}
          className="object-contain invert brightness-[2.2] opacity-80"
        />
      </div>
    </div>
  )
}
