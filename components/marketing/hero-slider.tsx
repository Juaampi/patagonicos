import Image from 'next/image'

export function HeroSlider() {
  return (
    <section className="relative isolate bg-black text-white">
      <div className="relative min-h-[calc(100svh-96px)] md:min-h-[calc(100svh-108px)]">
        <Image
          src="/hero-header-otono.png"
          alt="Perro con abrigo negro técnico en exterior durante temporada otoñal"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center] md:object-[76%_center] xl:object-[72%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.76)_0%,rgba(0,0,0,0.58)_34%,rgba(0,0,0,0.26)_62%,rgba(0,0,0,0.18)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.44)_36%,rgba(0,0,0,0.16)_66%,rgba(0,0,0,0.1)_100%)]" />

        <div className="relative z-10 flex min-h-[calc(100svh-96px)] items-center md:min-h-[calc(100svh-108px)]">
          <div className="shell w-full py-12 md:py-18">
            <div className="max-w-[33rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 md:text-[12px]">
                Indumentaria para mascotas
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/88 md:text-[15px]">
                Temporada otoño-invierno
              </p>
              <h1 className="mt-5 max-w-[11ch] font-display text-[clamp(2.45rem,8vw,5.1rem)] font-black leading-[0.92] tracking-[-0.075em] text-white">
                Protegé a tu mascota del frío.
              </h1>
              <p className="mt-5 max-w-[34rem] text-[14px] leading-6 text-white/84 md:mt-6 md:text-[17px] md:leading-8">
                En Patagónicos donamos el 10% de cada compra a refugios de animales de la Patagonia
                Argentina, porque sabemos que ellos también pasan frío y necesidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
