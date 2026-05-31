import { Search } from "lucide-react";
import { propertyTypeLabels } from "@/lib/site";

type SearchBarProps = {
  cities: string[];
  propertyTypes: string[];
  defaultValues?: {
    q?: string;
    city?: string;
    operationType?: string;
    propertyType?: string;
  };
};

export function SearchBar({ cities, propertyTypes, defaultValues }: SearchBarProps) {
  return (
    <form
      action="/propiedades"
      className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur sm:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_auto]"
    >
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
        <Search className="h-4 w-4 text-rose-gold" />
        <input
          name="q"
          defaultValue={defaultValues?.q}
          placeholder="Buscar por zona, barrio o título"
          className="w-full bg-transparent text-sm text-ivory outline-none placeholder:text-ivory/40"
        />
      </label>

      <select
        name="operationType"
        defaultValue={defaultValues?.operationType || ""}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ivory outline-none"
      >
        <option value="">Operación</option>
        <option value="SALE">Venta</option>
        <option value="RENT">Alquiler</option>
      </select>

      <select
        name="city"
        defaultValue={defaultValues?.city || ""}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ivory outline-none"
      >
        <option value="">Ciudad</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <select
        name="propertyType"
        defaultValue={defaultValues?.propertyType || ""}
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ivory outline-none"
      >
        <option value="">Tipo</option>
        {propertyTypes.map((type) => (
          <option key={type} value={type}>
            {propertyTypeLabels[type as keyof typeof propertyTypeLabels]}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="rounded-2xl bg-champagne px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-night transition hover:brightness-105"
      >
        Buscar
      </button>
    </form>
  );
}
