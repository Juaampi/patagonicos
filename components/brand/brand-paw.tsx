import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandPaw({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <span className={cn('relative inline-flex shrink-0 overflow-hidden', className)} aria-hidden="true">
      <Image
        src="/brand-mini-logo-tight.png"
        alt=""
        fill
        sizes="96px"
        className={cn('object-contain', inverted ? 'invert brightness-0' : 'invert-0')}
      />
    </span>
  )
}
