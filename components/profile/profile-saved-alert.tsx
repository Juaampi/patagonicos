'use client'

import { useEffect, useState } from 'react'

export function ProfileSavedAlert({
  saved,
  savedMessage,
}: {
  saved?: string
  savedMessage?: string
}) {
  const [visible, setVisible] = useState(Boolean(savedMessage))

  useEffect(() => {
    if (!savedMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setVisible(false)
    }, 6500)

    return () => window.clearTimeout(timeout)
  }, [savedMessage])

  if (!savedMessage || !visible) {
    return null
  }

  return (
    <div className="mb-6 rounded-[28px] border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-900">
      {saved === 'created' ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Compra confirmada</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.05em] text-emerald-950">
            Gracias por elegirnos para vestir a tu mascota.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-900/82">
            Con tu compra ayudás también a los refugios de animales en toda Argentina.
          </p>
        </>
      ) : (
        <p className="text-sm">{savedMessage}</p>
      )}
    </div>
  )
}
