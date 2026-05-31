import { LoadingBadge } from '@/components/layout/loading-badge'

export default function GlobalLoading() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[139] opacity-100">
        <div className="nav-loader-overlay h-full w-full" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-[141] flex items-center justify-center px-4">
        <LoadingBadge />
      </div>

      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-[140] h-[3px] opacity-100">
        <div className="nav-loader-shell h-full w-full">
          <div className="nav-loader-track h-full w-full" />
          <div className="nav-loader-sweep h-full" />
        </div>
      </div>
    </>
  )
}
