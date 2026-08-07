'use client'

import { Search, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { petBreedPresets } from '@/lib/pet-size-finder'

type PetSizeFinderCardProps = {
  compact?: boolean
  initialValues?: {
    breed?: string
    dogName?: string
    chest?: string
    back?: string
    neck?: string
    weightKg?: string
  }
}

export function PetSizeFinderCard({ compact = false, initialValues }: PetSizeFinderCardProps) {
  const router = useRouter()
  const [breed, setBreed] = useState(initialValues?.breed ?? '')
  const [dogName, setDogName] = useState(initialValues?.dogName ?? '')
  const [chest, setChest] = useState(initialValues?.chest ?? '')
  const [back, setBack] = useState(initialValues?.back ?? '')
  const [neck, setNeck] = useState(initialValues?.neck ?? '')
  const [weightKg, setWeightKg] = useState(initialValues?.weightKg ?? '')

  const applyBreedPreset = (slug: string) => {
    setBreed(slug)
    const preset = petBreedPresets.find((entry) => entry.slug === slug)
    if (!preset) {
      return
    }

    setChest(String(preset.chest))
    setBack(String(preset.back))
    setNeck(String(preset.neck))
    setWeightKg(preset.weightKg ? String(preset.weightKg) : '')
  }

  const handleSubmit = () => {
    const params = new URLSearchParams()

    if (breed) params.set('breed', breed)
    if (dogName.trim()) params.set('dogName', dogName.trim())
    if (chest.trim()) params.set('chest', chest.trim())
    if (back.trim()) params.set('back', back.trim())
    if (neck.trim()) params.set('neck', neck.trim())
    if (weightKg.trim()) params.set('weightKg', weightKg.trim())

    router.push(`/productos?${params.toString()}`)
  }

  return (
    <div
      className={`overflow-hidden rounded-[32px] border ${
        compact
          ? 'border-[#d5d0c7] bg-[linear-gradient(135deg,#fffdf9_0%,#f7f2ea_48%,#edf5ef_100%)] p-5'
          : 'border-[#d8d6cf] bg-[linear-gradient(135deg,#fffaf3_0%,#f2ede6_48%,#e6f0e6_100%)] p-6 md:p-7'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/78 text-black/76">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/46">Buscador de talle</p>
          <h3 className={`${compact ? 'mt-2 text-xl' : 'mt-2 text-2xl md:text-3xl'} font-display tracking-[-0.05em] text-black/88`}>
            Te ayudo a buscar la prenda para tu perruno
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-black/60">
            Elegí una raza para autocompletar medidas o cargalas vos. Te mostramos las prendas compatibles y el talle recomendado para ese perro.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="xl:col-span-2">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Raza</span>
          <select
            value={breed}
            onChange={(event) => applyBreedPreset(event.target.value)}
            className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Elegir raza orientativa</option>
            {petBreedPresets.map((preset) => (
              <option key={preset.slug} value={preset.slug}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="xl:col-span-2">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Nombre del perro</span>
          <input
            value={dogName}
            onChange={(event) => setDogName(event.target.value)}
            placeholder="Opcional"
            className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm outline-none"
          />
        </label>

        <label>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Pecho cm</span>
          <input value={chest} onChange={(event) => setChest(event.target.value)} placeholder="56" className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
        </label>

        <label>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Lomo cm</span>
          <input value={back} onChange={(event) => setBack(event.target.value)} placeholder="40" className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <label>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Cuello cm</span>
          <input value={neck} onChange={(event) => setNeck(event.target.value)} placeholder="34" className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/44">Peso kg</span>
          <input value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder="18" className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <div className="hidden xl:block" />
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1f3a2d] xl:w-auto"
          >
            <Search className="h-4 w-4" />
            Buscar prendas
          </button>
        </div>
      </div>
    </div>
  )
}
