import { formatDate } from "@/lib/format";
import { getRecentInquiries } from "@/lib/data";

export default async function AdminInquiriesPage() {
  const inquiries = await getRecentInquiries();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Consultas</p>
        <h1 className="mt-3 font-serif text-5xl">Mensajes y oportunidades</h1>
      </div>

      <div className="grid gap-4">
        {inquiries.length === 0 && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-ivory/60">
            No hay consultas registradas por el momento.
          </div>
        )}

        {inquiries.map((inquiry) => (
          <article key={inquiry.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl text-ivory">{inquiry.name}</h2>
                <p className="mt-1 text-sm text-ivory/70">
                  {inquiry.email} · {inquiry.phone}
                </p>
              </div>
              <span className="text-xs uppercase tracking-[0.24em] text-rose-gold">{formatDate(inquiry.createdAt)}</span>
            </div>
            <p className="mt-5 text-sm leading-8 text-ivory/72">{inquiry.message}</p>
            {inquiry.property && (
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-champagne">
                Propiedad vinculada: {inquiry.property.title}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
