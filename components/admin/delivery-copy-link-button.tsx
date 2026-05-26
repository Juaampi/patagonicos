'use client'

import { useState, useTransition } from 'react'

export function DeliveryCopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1800)
          } catch {
            setCopied(false)
          }
        })
      }
      className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/72 transition hover:bg-black hover:text-white"
    >
      {isPending ? 'Copiando...' : copied ? 'Link copiado' : 'Copiar link'}
    </button>
  )
}
