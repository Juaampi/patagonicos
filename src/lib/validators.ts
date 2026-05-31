import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresá un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const inquirySchema = z.object({
  propertyId: z.string().optional(),
  name: z.string().min(2, "Ingresá tu nombre."),
  phone: z.string().min(6, "Ingresá un teléfono válido."),
  email: z.email("Ingresá un email válido."),
  message: z.string().min(8, "Contanos un poco más sobre tu consulta."),
});

export const propertySchema = z.object({
  title: z.string().min(4),
  description: z.string().min(20),
  price: z.coerce.number().min(1),
  operationType: z.enum(["SALE", "RENT"]),
  propertyType: z.enum([
    "HOUSE",
    "APARTMENT",
    "LAND",
    "COMMERCIAL",
    "OFFICE",
    "COUNTRY_HOUSE",
    "WAREHOUSE",
  ]),
  address: z.string().min(3),
  city: z.string().min(2),
  province: z.string().min(2),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  rooms: z.coerce.number().nullable().optional(),
  bedrooms: z.coerce.number().nullable().optional(),
  bathrooms: z.coerce.number().nullable().optional(),
  garage: z.coerce.number().nullable().optional(),
  coveredArea: z.coerce.number().nullable().optional(),
  totalArea: z.coerce.number().nullable().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "RENTED", "DRAFT"]),
  featured: z.boolean().default(false),
  videoUrl: z.string().url().nullable().optional().or(z.literal("")),
  seoSlug: z.string().optional(),
  imageUrls: z.array(z.url()).min(1, "Agregá al menos una imagen."),
});
