export function LogoMark({ className = 'h-8 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 42" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 30L22 12L34 24L48 8L64 24L76 14L84 22"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27 30H61"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.88"
      />
    </svg>
  )
}
