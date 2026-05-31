import Link from "next/link";
import { deletePropertyAction, updatePropertyStatusAction } from "@/actions/admin";
import { getProperties } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { propertyStatusLabels } from "@/lib/site";

export default async function AdminPropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Propiedades</p>
          <h1 className="mt-3 font-serif text-5xl">Gestión integral del catálogo</h1>
        </div>
        <Link
          href="/admin/propiedades/nueva"
          className="rounded-full bg-champagne px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-night"
        >
          Nueva propiedad
        </Link>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-ivory/55">
            <tr>
              <th className="px-5 py-4">Propiedad</th>
              <th className="px-5 py-4">Operación</th>
              <th className="px-5 py-4">Precio</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property.id} className="border-b border-white/10 align-top">
                <td className="px-5 py-5">
                  <div>
                    <p className="text-base text-ivory">{property.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-rose-gold">
                      {property.city}, {property.province}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-5 text-ivory/70">{property.operationType}</td>
                <td className="px-5 py-5 text-champagne">{formatCurrency(property.price)}</td>
                <td className="px-5 py-5 text-ivory/70">
                  <form action={updatePropertyStatusAction.bind(null, property.id, "AVAILABLE")}>
                    <button className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                      {propertyStatusLabels[property.status as keyof typeof propertyStatusLabels]}
                    </button>
                  </form>
                </td>
                <td className="px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/propiedades/${property.id}/editar`} className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-champagne">
                      Editar
                    </Link>
                    <form action={deletePropertyAction.bind(null, property.id)}>
                      <button className="rounded-full border border-red-300/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-red-200">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
