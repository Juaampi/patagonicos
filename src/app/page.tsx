import Link from "next/link";
import { Award, ChevronRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { PropertyCard } from "@/components/public/property-card";
import { SearchBar } from "@/components/public/search-bar";
import { SectionHeading } from "@/components/shared/section-heading";
import { getFeaturedProperties, getSearchMeta } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default async function Home() {
  const [featuredProperties, searchMeta] = await Promise.all([getFeaturedProperties(), getSearchMeta()]);

  return (
    <div className="min-h-screen bg-night text-ivory">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(215,177,124,0.18),_transparent_35%),linear-gradient(120deg,rgba(20,15,19,0.95),rgba(20,15,19,0.75))]" />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center xl:py-28">
            <div className="relative z-10 space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-rose-gold">
                <Sparkles className="h-4 w-4" />
                Luxury Real Estate Experience
              </div>
              <div className="space-y-6">
                <h1 className="max-w-4xl font-serif text-6xl leading-none md:text-7xl xl:text-[6rem]">
                  Inmobiliaria premium con visión estratégica y atención personalizada.
                </h1>
                <p className="max-w-2xl text-lg leading-9 text-ivory/72">
                  {siteConfig.name} combina criterio comercial, presentación de alto nivel y una plataforma
                  moderna para venta, alquiler e inversión en Tristán Suárez, Ezeiza y alrededores.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/propiedades"
                  className="inline-flex items-center gap-2 rounded-full bg-champagne px-6 py-4 text-sm font-semibold uppercase tracking-[0.26em] text-night transition hover:brightness-105"
                >
                  Ver propiedades
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <a
                  href={`https://wa.me/${siteConfig.phoneLink}?text=${encodeURIComponent(siteConfig.whatsappMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-white/15 px-6 py-4 text-sm font-semibold uppercase tracking-[0.26em] text-ivory transition hover:bg-white/5"
                >
                  Hablar por WhatsApp
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Ubicación", value: "Tristán Suárez / Ezeiza" },
                  { label: "Atención", value: "Personalizada y directa" },
                  { label: "Matrícula", value: "4551 CPMCLZ" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-rose-gold">{item.label}</p>
                    <p className="mt-3 text-lg text-ivory">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_35px_90px_rgba(0,0,0,0.28)]">
              <div className="aspect-[4/5] rounded-[1.7rem] border border-white/10 bg-[linear-gradient(155deg,rgba(215,177,124,0.18),rgba(199,139,153,0.08)),url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
              <div className="-mt-16 ml-auto max-w-sm rounded-[1.8rem] border border-white/10 bg-night/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <p className="text-xs uppercase tracking-[0.28em] text-champagne">Búsqueda inteligente</p>
                <h2 className="mt-3 font-serif text-3xl">Propiedades curadas con presentación de alto nivel.</h2>
                <p className="mt-4 text-sm leading-7 text-ivory/70">
                  Una plataforma diseñada para exhibir cada propiedad con narrativa, imagen, contexto y performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-10 max-w-7xl px-5 md:px-8">
          <SearchBar cities={searchMeta.cities} propertyTypes={searchMeta.propertyTypes} />
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-20 md:grid-cols-3 md:px-8">
          {[
            {
              icon: ShieldCheck,
              title: "Confianza profesional",
              text: "Asesoramiento serio, transparencia operativa y respaldo matriculado en cada gestión.",
            },
            {
              icon: Search,
              title: "Marketing inmobiliario",
              text: "Presentación premium de propiedades, foco en conversión y experiencia moderna para cada consulta.",
            },
            {
              icon: Award,
              title: "Experiencia diferencial",
              text: "Un servicio boutique para clientes que valoran atención, criterio y posicionamiento.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
                <Icon className="h-5 w-5 text-champagne" />
                <h3 className="mt-6 font-serif text-3xl">{item.title}</h3>
                <p className="mt-4 text-sm leading-8 text-ivory/70">{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="mx-auto max-w-7xl space-y-10 px-5 py-12 md:px-8">
          <SectionHeading
            eyebrow="Propiedades destacadas"
            title="Selección premium para venta y alquiler"
            description="Cada publicación está pensada para transmitir valor, contexto y deseo. La plataforma prioriza calidad visual, claridad comercial y navegación fluida."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8" id="nosotros">
          <div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(215,177,124,0.08),rgba(255,255,255,0.02))] p-5">
              <div className="aspect-[4/5] rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(203,164,106,0.08),rgba(141,101,70,0.04)),url('/brand/brancd.png')] bg-cover bg-center" />
            </div>

            <div className="space-y-8">
              <SectionHeading
                eyebrow="Nosotros"
                title="LG Leonor Granados, una marca inmobiliaria con posicionamiento premium."
                description="Pensada para una experiencia contemporánea, elegante y confiable, con foco en relaciones duraderas y resultados reales."
              />

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Venta",
                    text: "Comercialización cuidada, estrategia visual y seguimiento cercano de cada oportunidad.",
                  },
                  {
                    title: "Alquiler",
                    text: "Gestión ágil, filtros claros y una experiencia ordenada tanto para propietarios como para interesados.",
                  },
                  {
                    title: "Inversión",
                    text: "Lectura comercial del activo, análisis de potencial y acompañamiento con criterio profesional.",
                  },
                  {
                    title: "Marca & confianza",
                    text: "Diseño premium, tecnología y comunicación seria al servicio de la captación y la conversión.",
                  },
                ].map((item) => (
                  <article key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                    <h3 className="font-serif text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm leading-8 text-ivory/70">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <SectionHeading
            eyebrow="Opiniones"
            title="Testimonios que refuerzan confianza"
            description="Una marca premium también se construye desde la experiencia del cliente."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              "La atención fue impecable desde la primera consulta. Se nota una propuesta mucho más cuidada y profesional.",
              "Nos acompañaron con claridad y criterio durante toda la operación. Muy buena experiencia.",
              "La presentación de las propiedades y la rapidez de respuesta hacen una gran diferencia.",
            ].map((quote, index) => (
              <blockquote key={quote} className="rounded-[2rem] border border-white/10 bg-white/5 p-7">
                <p className="text-lg leading-9 text-ivory/78">“{quote}”</p>
                <footer className="mt-6 text-xs uppercase tracking-[0.28em] text-rose-gold">Cliente {index + 1}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <div className="grid gap-10 xl:grid-cols-[1fr_0.9fr] xl:items-start">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Contacto"
                title="Conectemos tu próxima propiedad con una estrategia a la altura."
                description="Consulta directa por WhatsApp, ubicación física y presencia digital preparada para generar confianza desde el primer contacto."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-rose-gold">Dirección</p>
                  <p className="mt-3 text-base leading-8 text-ivory/75">{siteConfig.address}</p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-rose-gold">WhatsApp</p>
                  <p className="mt-3 text-base leading-8 text-ivory/75">{siteConfig.phoneDisplay}</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              <iframe src={siteConfig.mapEmbed} title="Ubicación de la inmobiliaria" width="100%" height="460" loading="lazy" className="w-full" />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
