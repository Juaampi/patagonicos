import { BrandPaw } from '@/components/brand/brand-paw'

export const dynamic = 'force-dynamic'

export default function TerminosYCondicionesPage() {
  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <div className="card-surface overflow-hidden p-7 md:p-9">
        <div className="flex items-center gap-3">
          <BrandPaw className="h-9 w-9 opacity-90" />
          <p className="eyebrow">Información legal</p>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] md:text-5xl">Términos y condiciones</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62 md:text-base md:leading-8">
          Estas condiciones regulan el uso del sitio, la compra de productos y la relación comercial con Patagónicos.
        </p>

        <div className="mt-8 grid gap-4">
          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Compras y aceptación</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Al realizar una compra, el cliente declara haber leído la descripción del producto, sus características y sus medidas antes de confirmar el pedido.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Medidas y cambios</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Realizamos cambios dentro de las 48 hs hábiles de haber recibido el producto. El cambio por sistema aplica únicamente para la misma prenda, en un talle mayor o menor, sujeto a disponibilidad.
            </p>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Si el cliente desea cambiar por una prenda distinta, deberá comunicarse por WhatsApp antes de avanzar, para que podamos revisar el caso de forma personalizada.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Envíos y operador logístico</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Los tiempos de traslado, incidencias de distribución, demoras, pérdidas o fallas atribuibles exclusivamente al proveedor logístico no dependen de Patagónicos. Hacemos el seguimiento correspondiente desde nuestro lado, pero el servicio de transporte es prestado por terceros.
            </p>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Esta política se informa sin perjuicio de los derechos que pudieran corresponder según la legislación aplicable y de los reclamos que el cliente pueda efectuar ante el transportista cuando corresponda.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Disponibilidad y stock</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Todos los pedidos están sujetos a disponibilidad de stock. Si existiera una diferencia excepcional entre el stock publicado y el real, nos contactaremos para ofrecer una alternativa o resolver el reintegro correspondiente.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Medios de contacto</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Ante cualquier consulta vinculada con una compra, el cliente puede comunicarse con nosotros a través de los canales publicados en la sección de contacto del sitio.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
