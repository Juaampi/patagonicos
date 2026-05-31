"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { savePropertyAction } from "@/actions/admin";
import { propertyStatusLabels, propertyTypeLabels } from "@/lib/site";

type PropertyFormProps = {
  property?: {
    id: string;
    title: string;
    description: string;
    price: number;
    operationType: string;
    propertyType: string;
    address: string;
    city: string;
    province: string;
    latitude: number | null;
    longitude: number | null;
    rooms: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    garage: number | null;
    coveredArea: number | null;
    totalArea: number | null;
    status: string;
    featured: boolean;
    videoUrl?: string | null;
    seoSlug: string;
    images: Array<{ url: string }>;
  } | null;
};

type PropertyActionState = {
  success?: boolean;
  error?: string;
};

const initialState: PropertyActionState = {};

export function PropertyForm({ property }: PropertyFormProps) {
  const [state, action, pending] = useActionState(savePropertyAction, initialState);
  const [images, setImages] = useState<string[]>(property?.images.map((image) => image.url) || [""]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrlsValue = useMemo(() => JSON.stringify(images.filter((item) => item.trim() !== "")), [images]);

  async function uploadFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const payload = new FormData();
      Array.from(fileList).forEach((file) => payload.append("files", file));

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: payload,
      });

      const data = (await response.json()) as {
        error?: string;
        images?: Array<{ url: string; publicId: string }>;
      };

      const uploadedImages = data.images ?? [];

      if (!response.ok || uploadedImages.length === 0) {
        throw new Error(data.error || "No pudimos subir las imágenes.");
      }

      setImages((prev) => [...prev.filter((item) => item.trim() !== ""), ...uploadedImages.map((image) => image.url)]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "No pudimos subir las imágenes.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="propertyId" value={property?.id || ""} />
      <input type="hidden" name="imageUrls" value={imageUrlsValue} />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="font-serif text-3xl text-ivory">Ficha principal</h2>
          <input name="title" defaultValue={property?.title} placeholder="Título" className="form-input" />
          <textarea
            name="description"
            defaultValue={property?.description}
            placeholder="Descripción"
            rows={7}
            className="form-input min-h-44 resize-none"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="price" type="number" defaultValue={property?.price} placeholder="Precio" className="form-input" />
            <input name="seoSlug" defaultValue={property?.seoSlug} placeholder="Slug SEO" className="form-input" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="operationType" defaultValue={property?.operationType || "SALE"} className="form-input">
              <option value="SALE">Venta</option>
              <option value="RENT">Alquiler</option>
            </select>
            <select name="propertyType" defaultValue={property?.propertyType || "HOUSE"} className="form-input">
              {Object.entries(propertyTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select name="status" defaultValue={property?.status || "AVAILABLE"} className="form-input">
              {Object.entries(propertyStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ivory/80">
              <input type="checkbox" name="featured" defaultChecked={property?.featured} />
              Marcar como destacada
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <h2 className="font-serif text-3xl text-ivory">Ubicación y detalles</h2>
          <input name="address" defaultValue={property?.address} placeholder="Dirección" className="form-input" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="city" defaultValue={property?.city} placeholder="Ciudad" className="form-input" />
            <input name="province" defaultValue={property?.province} placeholder="Provincia" className="form-input" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="latitude" type="number" step="0.0000001" defaultValue={property?.latitude || ""} placeholder="Latitud" className="form-input" />
            <input name="longitude" type="number" step="0.0000001" defaultValue={property?.longitude || ""} placeholder="Longitud" className="form-input" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input name="rooms" type="number" defaultValue={property?.rooms || ""} placeholder="Ambientes" className="form-input" />
            <input name="bedrooms" type="number" defaultValue={property?.bedrooms || ""} placeholder="Dormitorios" className="form-input" />
            <input name="bathrooms" type="number" defaultValue={property?.bathrooms || ""} placeholder="Baños" className="form-input" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input name="garage" type="number" defaultValue={property?.garage || ""} placeholder="Cocheras" className="form-input" />
            <input name="coveredArea" type="number" defaultValue={property?.coveredArea || ""} placeholder="m² cubiertos" className="form-input" />
            <input name="totalArea" type="number" defaultValue={property?.totalArea || ""} placeholder="m² totales" className="form-input" />
          </div>
          <input name="videoUrl" defaultValue={property?.videoUrl || ""} placeholder="URL de video opcional" className="form-input" />
        </div>
      </div>

      <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl text-ivory">Galería</h2>
            <p className="text-sm text-ivory/65">
              Subí imágenes reales a Cloudinary o pegá URLs manuales. Después podés reordenarlas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-champagne"
            >
              {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Subir a Cloudinary
            </button>
            <button
              type="button"
              onClick={() => setImages((prev) => [...prev, ""])}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-champagne"
            >
              <Plus className="h-4 w-4" />
              Agregar URL
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => void uploadFiles(event.target.files)}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center transition hover:border-champagne/50 hover:bg-white/5"
        >
          <ImagePlus className="h-6 w-6 text-rose-gold" />
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-champagne">
              Subí imágenes profesionales
            </p>
            <p className="text-sm text-ivory/60">
              Seleccioná varias fotos y se guardarán en Cloudinary listas para la propiedad.
            </p>
          </div>
        </button>

        {uploadError && <p className="text-sm text-red-300">{uploadError}</p>}

        <div className="space-y-3">
          {images.map((image, index) => (
            <div
              key={`${index}-${image}`}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 lg:flex-row lg:items-center"
            >
              {image.trim() !== "" && (
                <div className="relative h-20 w-full overflow-hidden rounded-2xl lg:w-32">
                  <Image
                    src={image}
                    alt={`Vista previa ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
              <input
                value={image}
                onChange={(event) =>
                  setImages((prev) => prev.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                }
                placeholder={`URL de imagen ${index + 1}`}
                className="form-input flex-1"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => {
                      if (index === 0) return prev;
                      const copy = [...prev];
                      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
                      return copy;
                    })
                  }
                  className="rounded-xl border border-white/10 p-3 text-ivory/70"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImages((prev) => {
                      if (index === prev.length - 1) return prev;
                      const copy = [...prev];
                      [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
                      return copy;
                    })
                  }
                  className="rounded-xl border border-white/10 p-3 text-ivory/70"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                  className="rounded-xl border border-white/10 p-3 text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-red-300">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-night transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar propiedad"}
      </button>
    </form>
  );
}
