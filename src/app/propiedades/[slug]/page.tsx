import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bath, BedDouble, Car, Expand, MapPin, PlayCircle } from "lucide-react";
import { ImageSlider } from "@/components/public/image-slider";
import { InquiryForm } from "@/components/public/inquiry-form";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { formatCurrency, formatOperation } from "@/lib/format";
import { getProperties, getPropertyBySlug } from "@/lib/data";
import { propertyStatusLabels, propertyTypeLabels, siteConfig } from "@/lib/site";

type PropertyDetailProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const properties = await getProperties();
  return properties.map((property) => ({ slug: property.seoSlug }));
}

export async function generateMetadata({ params }: PropertyDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return { title: "Propiedad no encontrada" };
  }

  return {
    title: property.title,
    description: property.description,
    openGraph: {
      title: property.title,
      description: property.description,
      images: property.images?.[0] ? [property.images[0].url] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailProps) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-night text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-10 px-5 py-14 md:px-8">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em]">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-rose-gold">
              {formatOperation(property.operationType)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-champagne">
              {propertyStatusLabels[property.status as keyof typeof propertyStatusLabels]}
            </span>
          </div>
          <h1 className="max-w-5xl font-serif text-5xl leading-tight md:text-6xl">{property.title}</h1>
          <div className="flex items-center gap-2 text-base text-ivory/70">
            <MapPin className="h-4 w-4 text-rose-gold" />
            <span>
              {property.address}, {property.city}, {property.province}
            </span>
          </div>
        </div>

        <div className="grid gap-10 xl:grid-cols-[1.08fr_0.92fr]">
          <ImageSlider images={property.images} title={property.title} />

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-rose-gold">Valor</p>
              <div className="mt-3 font-serif text-5xl text-champagne">{formatCurrency(property.price)}</div>
              <p className="mt-3 text-sm leading-7 text-ivory/68">
                {propertyTypeLabels[property.propertyType as keyof typeof propertyTypeLabels]} en{" "}
                {formatOperation(property.operationType).toLowerCase()} con enfoque comercial premium.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:grid-cols-4">
              {[
                { icon: BedDouble, label: "Dorm.", value: property.bedrooms ?? "-" },
                { icon: Bath, label: "Baños", value: property.bathrooms ?? "-" },
                { icon: Car, label: "Coch.", value: property.garage ?? "-" },
                { icon: Expand, label: "m²", value: property.totalArea ? `${property.totalArea}` : "-" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <Icon className="mx-auto h-4 w-4 text-rose-gold" />
                    <p className="text-xs uppercase tracking-[0.22em] text-ivory/55">{item.label}</p>
                    <p className="text-lg text-ivory">{item.value}</p>
                  </div>
                );
              })}
            </div>

            <InquiryForm propertyId={property.id} propertyTitle={property.title} />
          </div>
        </div>

        <div className="grid gap-10 xl:grid-cols-[1fr_0.92fr]">
          <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/5 p-7">
            <h2 className="font-serif text-4xl">Descripción</h2>
            <p className="text-base leading-9 text-ivory/76">{property.description}</p>
            {property.videoUrl && (
              <a
                href={property.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm uppercase tracking-[0.24em] text-champagne"
              >
                <PlayCircle className="h-4 w-4" />
                Ver video
              </a>
            )}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
            <iframe
              src={
                property.latitude && property.longitude
                  ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}&output=embed`
                  : siteConfig.mapEmbed
              }
              title="Mapa de ubicación de la propiedad"
              width="100%"
              height="420"
              loading="lazy"
              className="w-full"
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
