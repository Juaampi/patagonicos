import { PropertyForm } from "@/components/admin/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Nueva publicación</p>
        <h1 className="mt-3 font-serif text-5xl">Crear propiedad</h1>
      </div>
      <PropertyForm />
    </div>
  );
}
