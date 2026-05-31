"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PropertyStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth";
import { ensureSlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { toBoolean, toNullableNumber } from "@/lib/utils";
import { propertySchema } from "@/lib/validators";

type AdminActionState = {
  success?: boolean;
  error?: string;
};

function readImageUrls(formData: FormData) {
  try {
    const raw = `${formData.get("imageUrls") || "[]"}`;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function propertyPayload(formData: FormData) {
  return propertySchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    operationType: formData.get("operationType"),
    propertyType: formData.get("propertyType"),
    address: formData.get("address"),
    city: formData.get("city"),
    province: formData.get("province"),
    latitude: toNullableNumber(formData.get("latitude")),
    longitude: toNullableNumber(formData.get("longitude")),
    rooms: toNullableNumber(formData.get("rooms")),
    bedrooms: toNullableNumber(formData.get("bedrooms")),
    bathrooms: toNullableNumber(formData.get("bathrooms")),
    garage: toNullableNumber(formData.get("garage")),
    coveredArea: toNullableNumber(formData.get("coveredArea")),
    totalArea: toNullableNumber(formData.get("totalArea")),
    status: formData.get("status"),
    featured: toBoolean(formData.get("featured")),
    videoUrl: formData.get("videoUrl") || null,
    seoSlug: formData.get("seoSlug") || undefined,
    imageUrls: readImageUrls(formData),
  });
}

export async function savePropertyAction(
  _: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const user = await requireAdminSession();

  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    return { error: "Configurá Neon PostgreSQL en las variables de entorno para guardar propiedades." };
  }

  const parsed = propertyPayload(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "No pudimos guardar la propiedad." };
  }

  const propertyId = `${formData.get("propertyId") || ""}` || null;
  const slug = ensureSlug(parsed.data.seoSlug || parsed.data.title, parsed.data.title);
  const payload = {
    title: parsed.data.title,
    description: parsed.data.description,
    price: parsed.data.price,
    operationType: parsed.data.operationType,
    propertyType: parsed.data.propertyType,
    address: parsed.data.address,
    city: parsed.data.city,
    province: parsed.data.province,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    rooms: parsed.data.rooms,
    bedrooms: parsed.data.bedrooms,
    bathrooms: parsed.data.bathrooms,
    garage: parsed.data.garage,
    coveredArea: parsed.data.coveredArea,
    totalArea: parsed.data.totalArea,
    status: parsed.data.status,
    featured: parsed.data.featured,
    videoUrl: parsed.data.videoUrl || null,
    seoSlug: slug,
    authorId: user.id,
  };

  if (propertyId) {
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...payload,
        images: {
          deleteMany: {},
          create: parsed.data.imageUrls.map((url, index) => ({
            url,
            alt: parsed.data.title,
            sortOrder: index,
            isFeatured: index === 0,
          })),
        },
      },
    });
  } else {
    await prisma.property.create({
      data: {
        ...payload,
        images: {
          create: parsed.data.imageUrls.map((url, index) => ({
            url,
            alt: parsed.data.title,
            sortOrder: index,
            isFeatured: index === 0,
          })),
        },
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/propiedades");
  revalidatePath("/admin");
  revalidatePath("/admin/propiedades");
  redirect("/admin/propiedades");
}

export async function deletePropertyAction(id: string) {
  await requireAdminSession();
  await prisma.property.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/propiedades");
  revalidatePath("/admin/propiedades");
}

export async function updatePropertyStatusAction(id: string, status: PropertyStatus) {
  await requireAdminSession();
  await prisma.property.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/propiedades");
  revalidatePath("/propiedades");
}
