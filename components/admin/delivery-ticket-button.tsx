import Link from 'next/link'

export function DeliveryTicketButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/72 transition hover:bg-black hover:text-white"
    >
      Ticket interno
    </Link>
  )
}
