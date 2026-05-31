import { Metadata } from "next";
import { SearchBar } from "@/components/public/search-bar";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { PropertyCard } from "@/components/public/property-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { getProperties, getSearchMeta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Propiedades",
  description: "Explorá propiedades premium en venta y alquiler con filtros inteligentes.",
};

type PropertiesPageProps = {
  searchParams: Promise<{
    q?: string;
    city?: string;
    operationType?: string;
    propertyType?: string;
  }>;
};

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const filters = await searchParams;
  const [properties, meta] = await Promise.all([getProperties(filters), getSearchMeta()]);

  return (
    <div className="min-h-screen bg-night text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-10 px-5 py-16 md:px-8">
        <SectionHeading
          eyebrow="Catálogo dinámico"
          title="Propiedades con búsqueda avanzada y enfoque premium"
          description="Filtrá por operación, ciudad, tipo y búsqueda textual para encontrar la propiedad ideal."
        />

        <SearchBar cities={meta.cities} propertyTypes={meta.propertyTypes} defaultValues={filters} />

        <div className="grid gap-6 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {properties.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 px-8 py-14 text-center text-ivory/70">
            No encontramos propiedades con esos filtros.
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
