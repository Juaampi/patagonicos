import { BrandPaw } from '@/components/brand/brand-paw'

export const dynamic = 'force-dynamic'

export default function PoliticasDePrivacidadPage() {
  return (
    <section className="shell pb-12 pt-8 md:pt-12">
      <div className="card-surface overflow-hidden p-7 md:p-9">
        <div className="flex items-center gap-3">
          <BrandPaw className="h-9 w-9 opacity-90" />
          <p className="eyebrow">Información legal</p>
        </div>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em] md:text-5xl">Políticas de privacidad</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-black/62 md:text-base md:leading-8">
          Esta política describe cómo recopilamos y usamos la información que compartís con Patagónicos al navegar o comprar en el sitio.
        </p>

        <div className="mt-8 grid gap-4">
          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Datos que recopilamos</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Podemos solicitar nombre, correo electrónico, teléfono, dirección de entrega y datos necesarios para procesar compras, coordinar envíos y responder consultas.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Uso de la información</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Utilizamos los datos para gestionar pedidos, coordinar pagos, despachos, soporte postventa y comunicación relacionada con el estado de la compra.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Terceros vinculados</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Algunos datos pueden compartirse con proveedores de pago, logística o herramientas técnicas que intervienen en la operación del sitio, únicamente en la medida necesaria para prestar el servicio.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Conservación y resguardo</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Mantenemos medidas razonables de resguardo para proteger la información almacenada y limitar accesos no autorizados dentro de nuestra operación.
            </p>
          </article>

          <article className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-6">
            <h2 className="font-display text-2xl tracking-[-0.04em]">Consultas</h2>
            <p className="mt-3 text-sm leading-7 text-black/62">
              Si necesitás hacer una consulta sobre tus datos, actualizar información o solicitar más detalles sobre esta política, podés escribirnos por los medios de contacto publicados en el sitio.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
