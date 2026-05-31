import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { getAdminPropertyById } from "@/lib/data";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;
  const property = await getAdminPropertyById(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Edición</p>
        <h1 className="mt-3 font-serif text-5xl">Actualizar propiedad</h1>
      </div>
      <PropertyForm property={property} />
    </div>
  );
}
