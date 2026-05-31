import Link from "next/link";
import { Building2, MessageSquareText, Star, WalletCards } from "lucide-react";
import { getDashboardStats, getProperties, getRecentInquiries } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [stats, properties, inquiries] = await Promise.all([
    getDashboardStats(),
    getProperties(),
    getRecentInquiries(),
  ]);

  const topValue = properties[0]?.price ? formatCurrency(properties[0].price) : "--";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Dashboard</p>
          <h1 className="mt-3 font-serif text-5xl">Panel de gestión premium</h1>
        </div>
        <Link
          href="/admin/propiedades/nueva"
          className="rounded-full bg-champagne px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-night"
        >
          Nueva propiedad
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Propiedades", value: stats.properties, icon: Building2 },
          { label: "Consultas", value: stats.inquiries, icon: MessageSquareText },
          { label: "Destacadas", value: stats.featured, icon: Star },
          { label: "Ticket premium", value: topValue, icon: WalletCards },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <Icon className="h-5 w-5 text-champagne" />
              <p className="mt-5 text-xs uppercase tracking-[0.28em] text-rose-gold">{item.label}</p>
              <p className="mt-2 font-serif text-4xl">{item.value}</p>
            </article>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-3xl">Últimas propiedades</h2>
            <Link href="/admin/propiedades" className="text-sm text-champagne">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg text-ivory">{property.title}</h3>
                    <p className="mt-1 text-sm text-ivory/60">
                      {property.city} · {property.operationType}
                    </p>
                  </div>
                  <span className="text-sm text-champagne">{formatCurrency(property.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-3xl">Consultas recientes</h2>
            <Link href="/admin/consultas" className="text-sm text-champagne">
              Ver más
            </Link>
          </div>
          <div className="space-y-3">
            {inquiries.length === 0 && <p className="text-sm text-ivory/60">Todavía no hay consultas registradas.</p>}
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-ivory">{inquiry.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-rose-gold">{inquiry.email}</p>
                <p className="mt-3 line-clamp-2 text-sm text-ivory/68">{inquiry.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
