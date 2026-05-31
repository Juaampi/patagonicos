import Image from 'next/image'
import { cn } from '@/lib/utils'

export function LoadingBadge({ animated = true }: { animated?: boolean }) {
  return (
    <div className="nav-loader-stack">
      <div className="nav-loader-logo-wrap" aria-hidden="true">
        <div className={cn('nav-loader-logo-ring', animated && 'nav-loader-logo-ring-animated')} />
        <div className="nav-loader-logo-core">
          <Image
            src="/brand-mini-logo-light.png"
            alt=""
            width={1024}
            height={1024}
            sizes="72px"
            className="nav-loader-logo-image"
          />
        </div>
      </div>

      <div className="nav-loader-badge">
        <span className="nav-loader-badge-dot" />
        Cargando
      </div>
    </div>
  )
}
