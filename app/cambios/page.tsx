import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardCheck, PackageCheck, Ruler, Shirt, Truck, Waypoints } from 'lucide-react'

const flowSteps = [
  {
    icon: Shirt,
    title: '1. Recibís la prenda y verificás el calce',
    copy:
      'Sabemos que no todas las mascotas tienen el mismo porte, aunque pesen parecido o usen el mismo talle en otras marcas. Por eso puede pasar que al probar una prenda necesites subir o bajar un talle.',
  },
  {
    icon: Waypoints,
    title: '2. Pedís el cambio desde tu panel',
    copy:
      'Cuando el pedido ya figura como entregado, se habilita el botón de cambio por sistema. Ahí elegís solamente un talle mayor o menor de la misma prenda y del mismo color.',
  },
  {
    icon: Truck,
    title: '3. El pedido queda en estado "en cambio"',
    copy:
      'Una vez enviada la solicitud, el pedido queda marcado como en cambio. Eso nos permite seguirlo sin perder el historial de la compra original y ordenar bien cada caso.',
  },
  {
    icon: ClipboardCheck,
    title: '4. Confirmás que despachaste la prenda original',
    copy:
      'Después de preparar el envío de la prenda que querés devolver, confirmás desde tu panel que ya la enviaste. Recién en ese momento nosotros avanzamos con la generación del recambio.',
  },
  {
    icon: PackageCheck,
    title: '5. Generamos un nuevo pedido de recambio',
    copy:
      'Cuando vemos la confirmación del cliente, desde administración generamos un nuevo pedido con la misma prenda y el nuevo talle. Ese pedido entra al circuito normal de preparación y envío.',
  },
]

const conditions = [
  'El cambio se puede solicitar dentro de las 48 hs hábiles de haber recibido el producto.',
  'El cambio por sistema aplica solamente para la misma prenda, en un talle mayor o menor.',
  'El recambio queda sujeto a disponibilidad del talle elegido al momento de procesarlo.',
  'Si querés cambiar por otra prenda distinta, lo resolvemos por WhatsApp de forma personalizada.',
]

const whySizingMatters = [
  'Hay mascotas compactas y anchas de pecho que necesitan un talle distinto al esperado.',
  'Algunas tienen mucho pelo, otras son más largas de lomo o más finitas de cuello.',
  'Incluso dentro de la misma raza, el calce puede variar bastante según contextura y postura.',
]

export default function ExchangesPage() {
  return (
    <section className="shell pb-12 pt-40">
      <div className="space-y-8">
        <div className="card-surface overflow-hidden p-7 md:p-9">
          <p className="eyebrow">Cambios de talle</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl tracking-[-0.05em]">
            Un sistema de cambios pensado para algo muy real: no todas las mascotas calzan igual.
          </h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-black/62">
            Aunque midamos, comparemos peso o revisemos una guía, cada mascota tiene su propio cuerpo. Algunas son más anchas de pecho, otras más largas de lomo, otras tienen mucho pelo o una contextura distinta. Por eso armamos un proceso claro para que, si el talle no quedó bien, puedas pedir un recambio sin perderte en mensajes ni dudas.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Ventana</p>
              <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-black/86">48 hs hábiles</p>
              <p className="mt-3 text-sm leading-7 text-black/62">
                Desde que recibís el producto, ese es el plazo para pedir el cambio por sistema.
              </p>
            </div>
            <div className="rounded-[26px] border border-emerald-200/80 bg-emerald-50/80 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/80">Alcance</p>
              <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-emerald-800">Misma prenda</p>
              <p className="mt-3 text-sm leading-7 text-emerald-900/75">
                El cambio automático es por el mismo modelo y color, sólo en un talle mayor o menor.
              </p>
            </div>
            <div className="rounded-[26px] border border-black/8 bg-[#f7f7f4] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Seguimiento</p>
              <p className="mt-3 text-2xl font-medium tracking-[-0.04em] text-black/86">Todo desde tu panel</p>
              <p className="mt-3 text-sm leading-7 text-black/62">
                La solicitud, la confirmación de envío y el nuevo pedido de recambio quedan registrados.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="card-surface p-7 md:p-9">
            <p className="eyebrow">Por qué puede pasar</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.05em]">
              Entendemos que elegir talle para una mascota no siempre es exacto.
            </h2>
            <div className="mt-6 space-y-3">
              {whySizingMatters.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[22px] border border-black/8 bg-[#fafaf8] px-4 py-4 text-sm leading-7 text-black/66">
                  <Ruler className="mt-1 h-4.5 w-4.5 shrink-0 text-black/70" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-[26px] border border-black/8 bg-white px-5 py-5">
              <p className="text-sm leading-7 text-black/62">
                La idea no es complicarte el proceso. Si el talle no resultó como esperabas, queremos que tengas una forma clara de resolverlo y que sepas exactamente qué pasa en cada etapa.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-surface p-7">
              <p className="eyebrow">Condiciones</p>
              <div className="mt-5 space-y-3">
                {conditions.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[20px] bg-[#f7f7f4] px-4 py-3 text-sm leading-7 text-black/72">
                    <CheckCircle2 className="mt-1 h-4.5 w-4.5 shrink-0 text-emerald-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-7">
              <p className="eyebrow">Accesos rápidos</p>
              <div className="mt-5 grid gap-3">
                <Link href="/guia-de-talles" className="flex items-center justify-between rounded-[20px] border border-black/8 bg-[#fafaf8] px-4 py-3 text-sm font-medium text-black/78 transition hover:bg-white hover:text-black">
                  Ver guía de talles
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link href="/perfil" className="flex items-center justify-between rounded-[20px] border border-black/8 bg-[#fafaf8] px-4 py-3 text-sm font-medium text-black/78 transition hover:bg-white hover:text-black">
                  Ir a mi panel
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
                <Link href="/contacto" className="flex items-center justify-between rounded-[20px] border border-black/8 bg-[#fafaf8] px-4 py-3 text-sm font-medium text-black/78 transition hover:bg-white hover:text-black">
                  Hablar por WhatsApp
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface p-7 md:p-9">
          <p className="eyebrow">Paso a paso</p>
          <h2 className="mt-4 max-w-4xl font-display text-4xl tracking-[-0.05em]">
            Así funciona el flujo completo del cambio, desde que lo pedís hasta que sale el recambio.
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {flowSteps.map((step) => (
              <article key={step.title} className="rounded-[26px] border border-black/8 bg-[#fafaf8] p-5">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-black/88">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-black/62">{step.copy}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card-surface overflow-hidden border border-emerald-200 bg-[linear-gradient(135deg,#0e8c5a_0%,#1ea36b_50%,#54c98e_100%)] p-7 text-white md:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Resumen simple</p>
          <h2 className="mt-4 max-w-4xl font-display text-4xl tracking-[-0.05em]">
            Si el talle no fue el ideal, no estás solo: lo pensamos para resolverlo sin vueltas.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/84">
            Pedís el cambio desde tu panel, el pedido pasa a estado de cambio, confirmás cuando despachás la prenda original y nosotros generamos el nuevo pedido de recambio para enviarte el talle correcto.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-900 transition hover:bg-black hover:text-white"
            >
              Ir a mi panel
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 rounded-full border border-white/22 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-emerald-900"
            >
              Seguir comprando
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
