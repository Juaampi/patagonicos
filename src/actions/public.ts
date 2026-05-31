"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/validators";

export type InquiryActionState = {
  success?: boolean;
  error?: string;
};

export async function createInquiryAction(
  _: InquiryActionState,
  formData: FormData
): Promise<InquiryActionState> {
  const parsed = inquirySchema.safeParse({
    propertyId: formData.get("propertyId") || undefined,
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "No pudimos enviar tu consulta." };
  }

  if (!process.env.DATABASE_URL) {
    return { success: true };
  }

  await prisma.inquiry.create({
    data: parsed.data,
  });

  revalidatePath("/admin/consultas");
  return { success: true };
}
