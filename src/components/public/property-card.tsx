import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, Car, Expand, MapPin } from "lucide-react";
import { formatCurrency, formatOperation } from "@/lib/format";
import { propertyStatusLabels, propertyTypeLabels } from "@/lib/site";

type PropertyCardProps = {
  property: {
    id: string;
    title: string;
    price: number;
    city: string;
    province: string;
    address: string;
    bedrooms: number | null;
    bathrooms: number | null;
    garage: number | null;
    totalArea: number | null;
    operationType: string;
    propertyType: string;
    status: string;
    seoSlug: string;
    images: Array<{ url: string; alt: string | null }>;
  };
};

export function PropertyCard({ property }: PropertyCardProps) {
  const image = property.images[0]?.url;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        {image && (
          <Image
            src={image}
            alt={property.images[0]?.alt || property.title}
            fill
            className="object-cover transition duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-5 top-5 inline-flex rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-ivory">
          {formatOperation(property.operationType)}
        </div>
        <div className="absolute bottom-5 left-5 rounded-full bg-champagne px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-night">
          {propertyStatusLabels[property.status as keyof typeof propertyStatusLabels]}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-rose-gold">
            {propertyTypeLabels[property.propertyType as keyof typeof propertyTypeLabels]}
          </p>
          <Link href={`/propiedades/${property.seoSlug}`} className="block font-serif text-3xl leading-tight text-ivory">
            {property.title}
          </Link>
          <div className="flex items-center gap-2 text-sm text-ivory/70">
            <MapPin className="h-4 w-4 text-rose-gold" />
            <span>
              {property.address}, {property.city}, {property.province}
            </span>
          </div>
        </div>

        <div className="text-2xl font-semibold text-champagne">{formatCurrency(property.price)}</div>

        <div className="grid grid-cols-4 gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-center text-xs text-ivory/70">
          <div className="space-y-2">
            <BedDouble className="mx-auto h-4 w-4 text-rose-gold" />
            <p>{property.bedrooms ?? "-"}</p>
          </div>
          <div className="space-y-2">
            <Bath className="mx-auto h-4 w-4 text-rose-gold" />
            <p>{property.bathrooms ?? "-"}</p>
          </div>
          <div className="space-y-2">
            <Car className="mx-auto h-4 w-4 text-rose-gold" />
            <p>{property.garage ?? "-"}</p>
          </div>
          <div className="space-y-2">
            <Expand className="mx-auto h-4 w-4 text-rose-gold" />
            <p>{property.totalArea ? `${property.totalArea}m²` : "-"}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
