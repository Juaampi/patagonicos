export function BrandStory() {
  return (
    <section className="shell mt-16 md:mt-20">
      <div className="relative overflow-hidden rounded-[36px] border border-black/8 bg-[#f5f5f2] px-6 py-10 md:px-10 md:py-14">
        <div className="pointer-events-none absolute -right-6 top-8 opacity-[0.08]">
          <svg viewBox="0 0 120 120" className="h-24 w-24 text-black md:h-32 md:w-32" fill="currentColor" aria-hidden="true">
            <circle cx="60" cy="70" r="18" />
            <circle cx="34" cy="42" r="9" />
            <circle cx="52" cy="26" r="9" />
            <circle cx="68" cy="26" r="9" />
            <circle cx="86" cy="42" r="9" />
          </svg>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-4 opacity-[0.06]">
          <svg viewBox="0 0 120 120" className="h-20 w-20 -rotate-12 text-black md:h-24 md:w-24" fill="currentColor" aria-hidden="true">
            <circle cx="60" cy="70" r="18" />
            <circle cx="34" cy="42" r="9" />
            <circle cx="52" cy="26" r="9" />
            <circle cx="68" cy="26" r="9" />
            <circle cx="86" cy="42" r="9" />
          </svg>
        </div>

        <div className="relative grid gap-8 xl:grid-cols-[0.82fr_1.18fr] xl:gap-12">
          <div>
          <p className="eyebrow">Quiénes somos</p>
          <h2 className="mt-4 max-w-[12ch] font-display text-4xl tracking-[-0.06em] text-black md:text-5xl">
            Una marca nacida desde el cuidado real.
          </h2>
          </div>

          <div className="max-w-3xl space-y-5 text-[15px] leading-8 text-black/68 md:text-base">
            <p>
              Somos una marca que nace desde el amor y la empatía hacia los animales.
            </p>
            <p>
              Entendemos que ellos sienten igual que nosotros. Si una persona siente frío, un animal
              también puede sentirlo.
            </p>
            <p>
              Hoy en día muchos perros pasan la mayor parte del tiempo dentro del hogar, por lo que
              los cambios bruscos de temperatura pueden afectarles físicamente al salir al exterior.
            </p>
            <p>
              En climas fríos, el viento, la lluvia y las bajas temperaturas pueden generar tensión
              muscular, incomodidad y enfermedades, especialmente durante paseos o actividades al
              aire libre.
            </p>
            <p>
              Por eso diseñamos productos cómodos, funcionales y preparados para acompañarlos en
              cualquier aventura.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
