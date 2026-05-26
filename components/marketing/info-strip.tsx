const items = [
  'Campera térmica + botitas',
  'Envío gratis a todo Argentina',
  'Bariloche: entrega en el día antes de las 14:30 hs',
]

export function InfoStrip() {
  return (
    <section className="shell -mt-6 relative z-20">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:justify-center">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-full border border-black/8 bg-white/96 px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-black/72 backdrop-blur md:text-sm"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}
