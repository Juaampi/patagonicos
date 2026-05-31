import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/data";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();

  return [
    {
      url: siteConfig.siteUrl,
      lastModified: new Date(),
    },
    {
      url: `${siteConfig.siteUrl}/propiedades`,
      lastModified: new Date(),
    },
    ...properties.map((property) => ({
      url: `${siteConfig.siteUrl}/propiedades/${property.seoSlug}`,
      lastModified: new Date(property.updatedAt),
    })),
  ];
}
