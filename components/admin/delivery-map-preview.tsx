import Link from 'next/link'

type DeliveryMapPreviewProps = {
  originAddress: string
  googleMapsUrls: string[]
  stopAddresses: string[]
}

export function DeliveryMapPreview({ originAddress, googleMapsUrls, stopAddresses }: DeliveryMapPreviewProps) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-black/10 px-7 py-6">
        <p className="eyebrow">Recorrido sugerido</p>
        <h2 className="mt-4 font-display text-3xl tracking-[-0.05em]">Mapa y orden inicial</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-black/58">
          Placeholder operativo listo para evolucionar a Google Directions o Distance Matrix sin cambiar la UI.
        </p>
      </div>

      <div className="grid gap-6 p-7 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-dashed border-black/12 bg-[radial-gradient(circle_at_top,rgba(249,250,244,0.95),rgba(240,241,234,0.55)_40%,rgba(255,255,255,1)_100%)] p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Origen fijo</p>
          <p className="mt-3 text-xl font-semibold text-black/88">{originAddress}</p>
          <div className="mt-6 space-y-3">
            {stopAddresses.length === 0 ? (
              <p className="text-sm text-black/50">No hay repartos pendientes para esta fecha.</p>
            ) : (
              stopAddresses.map((address, index) => (
                <div key={`${address}-${index}`} className="flex items-start gap-3 rounded-[18px] border border-black/8 bg-white/78 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-black/82">Parada {index + 1}</p>
                    <p className="mt-1 text-sm text-black/58">{address}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[24px] border border-black/8 bg-[#f8f8f5] p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Integracion preparada</p>
            <p className="mt-3 text-sm leading-7 text-black/58">
              La lista ya queda ordenada por cercania aproximada y segmentada para Google Maps cuando haya muchas paradas.
            </p>
          </div>

          {googleMapsUrls.map((url, index) => (
            <Link
              key={url}
              href={url}
              target="_blank"
              className="block rounded-[24px] border border-black/8 bg-white px-5 py-4 transition hover:bg-[#f8f8f5]"
            >
              <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">Tramo {index + 1}</p>
              <p className="mt-2 text-sm text-black/68">
                {index === 0 ? 'Abrir recorrido principal en Google Maps.' : 'Abrir tramo adicional por limite de paradas.'}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
