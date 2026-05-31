import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function toBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export function toNullableNumber(value: FormDataEntryValue | null) {
  if (!value || `${value}`.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function toDecimalString(value: FormDataEntryValue | null) {
  return `${value ?? "0"}`.replace(/\./g, "").replace(",", ".");
}
