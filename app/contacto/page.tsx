export default function ContactPage() {
  return (
    <section className="shell pb-12 pt-40">
      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card-surface p-7 md:p-9">
          <p className="eyebrow">Contacto</p>
          <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Hablemos de abrigo real para clima real</h1>
          <p className="mt-5 text-base leading-8 text-black/62">
            Consultas sobre talles, stock, entregas en Bariloche o preparación de la colección. Sin estética de petshop, con foco total en producto y clima.
          </p>
        </div>
        <form className="card-surface p-7 md:p-9">
          <div className="grid gap-4 md:grid-cols-2">
            {['Nombre', 'Email', 'Teléfono', 'Mensaje'].map((field) =>
              field === 'Mensaje' ? (
                <textarea key={field} placeholder={field} className="min-h-40 rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none md:col-span-2" />
              ) : (
                <input key={field} placeholder={field} className="rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none" />
              ),
            )}
          </div>
          <button className="button-primary mt-5">Enviar consulta</button>
        </form>
      </div>
    </section>
  )
}
