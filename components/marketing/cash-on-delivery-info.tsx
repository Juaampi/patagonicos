export function CashOnDeliveryInfo() {
  return (
    <div className="space-y-4 text-sm leading-7 text-black/66">
      <p>
        En Bariloche podés elegir <strong>pago contra entrega</strong>. Confirmamos tu pedido ahora y
        lo abonás cuando llega a tu domicilio, de la forma que te resulte más cómoda.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-black/8 bg-[#fafaf8] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42">QR Mercado Pago</p>
          <p className="mt-2 text-sm leading-6 text-black/66">
            Te mostramos un QR al momento de la entrega para pagar rápido desde el celular.
          </p>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-[#fafaf8] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42">Transferencia</p>
          <p className="mt-2 text-sm leading-6 text-black/66">
            También podés transferir en el momento y esperar la confirmación con el repartidor.
          </p>
        </div>
        <div className="rounded-[18px] border border-black/8 bg-[#fafaf8] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/42">Efectivo</p>
          <p className="mt-2 text-sm leading-6 text-black/66">
            Si preferís, también podés abonarlo en efectivo cuando recibís tu pedido.
          </p>
        </div>
      </div>

      <p className="text-sm leading-6 text-black/56">
        La idea es que tengas una compra simple y tranquila: reservás ahora y pagás recién cuando te lo entregamos.
      </p>
    </div>
  )
}
