import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary no está configurado. Completá las variables de entorno." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No se recibieron imágenes." }, { status: 400 });
  }

  try {
    const cloudinary = getCloudinary();
    const uploads = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: "leonor-granados/properties",
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error("No se pudo subir la imagen."));
                return;
              }

              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          );

          upload.end(buffer);
        });
      })
    );

    return NextResponse.json({ images: uploads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al subir imágenes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
