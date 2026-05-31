import Link from 'next/link'

export function TrackingInfo() {
  return (
    <div className="space-y-4 text-sm leading-7 text-black/66">
      <p>
        Despachamos por <strong>Andreani</strong> el mismo día cuando la compra entra dentro de la
        ventana operativa. Apenas sale el pedido, se genera tu código de seguimiento.
      </p>
      <p>
        Con ese código podés consultar el estado del envío, ver por dónde va tu pedido y seguir cada
        actualización desde nuestro buscador.
      </p>
      <Link
        href="/seguimiento"
        className="inline-flex rounded-full border border-black/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-black/78 transition hover:bg-black hover:text-white"
      >
        Ir al buscador de pedidos
      </Link>
    </div>
  )
}
