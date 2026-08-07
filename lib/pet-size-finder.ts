import type { Product } from '@/types/store'

export type PetBreedPreset = {
  slug: string
  label: string
  chest: number
  back: number
  neck: number
  weightKg?: number
}

export type PetFinderInput = {
  breed?: string | null
  dogName?: string | null
  chest?: number | null
  back?: number | null
  neck?: number | null
  weightKg?: number | null
}

export type ProductSizeRecommendation = {
  sizeLabel: string
  score: number
}

export const petBreedPresets: PetBreedPreset[] = [
  { slug: 'bulldog-frances', label: 'Bulldog Francés', chest: 58, back: 33, neck: 38, weightKg: 12 },
  { slug: 'salchicha', label: 'Salchicha / Dachshund', chest: 42, back: 38, neck: 28, weightKg: 8 },
  { slug: 'caniche-toy', label: 'Caniche Toy', chest: 30, back: 24, neck: 20, weightKg: 4 },
  { slug: 'beagle', label: 'Beagle', chest: 54, back: 38, neck: 34, weightKg: 13 },
  { slug: 'cocker-spaniel', label: 'Cocker Spaniel', chest: 56, back: 40, neck: 35, weightKg: 14 },
  { slug: 'border-collie', label: 'Border Collie', chest: 66, back: 50, neck: 40, weightKg: 19 },
  { slug: 'labrador', label: 'Labrador', chest: 78, back: 57, neck: 48, weightKg: 30 },
  { slug: 'golden-retriever', label: 'Golden Retriever', chest: 80, back: 60, neck: 49, weightKg: 32 },
  { slug: 'ovejero-aleman', label: 'Ovejero Alemán', chest: 82, back: 63, neck: 50, weightKg: 34 },
  { slug: 'pastor-belga', label: 'Pastor Belga', chest: 76, back: 61, neck: 44, weightKg: 28 },
  { slug: 'mestizo-mediano', label: 'Mestizo mediano', chest: 58, back: 42, neck: 35, weightKg: 15 },
  { slug: 'mestizo-grande', label: 'Mestizo grande', chest: 74, back: 56, neck: 43, weightKg: 26 },
]

function toPositiveNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function getBreedPreset(slug?: string | null) {
  if (!slug) {
    return null
  }

  return petBreedPresets.find((preset) => preset.slug === slug) ?? null
}

export function resolvePetFinderInput(input: PetFinderInput) {
  const preset = getBreedPreset(input.breed)

  return {
    breed: input.breed ?? '',
    dogName: input.dogName?.trim() ?? '',
    chest: toPositiveNumber(input.chest) ?? preset?.chest ?? null,
    back: toPositiveNumber(input.back) ?? preset?.back ?? null,
    neck: toPositiveNumber(input.neck) ?? preset?.neck ?? null,
    weightKg: toPositiveNumber(input.weightKg) ?? preset?.weightKg ?? null,
    preset,
  }
}

function isWithinRange(value: number | null, min?: number, max?: number) {
  if (value == null) {
    return true
  }

  if (typeof min === 'number' && value < min) {
    return false
  }

  if (typeof max === 'number' && value > max) {
    return false
  }

  return true
}

function getRangeMidpoint(min?: number, max?: number) {
  if (typeof min === 'number' && typeof max === 'number') {
    return (min + max) / 2
  }

  return min ?? max ?? null
}

function getDistanceScore(value: number | null, min?: number, max?: number) {
  if (value == null) {
    return 0
  }

  const midpoint = getRangeMidpoint(min, max)
  if (midpoint == null) {
    return 0
  }

  return Math.abs(value - midpoint)
}

export function getProductSizeRecommendation(product: Product, rawInput: PetFinderInput): ProductSizeRecommendation | null {
  const input = resolvePetFinderInput(rawInput)
  const sizeGuides = product.sizeGuides ?? []

  if (sizeGuides.length === 0) {
    return null
  }

  const candidates = sizeGuides
    .filter((guide) => isWithinRange(input.chest, guide.chestMin, guide.chestMax))
    .filter((guide) => isWithinRange(input.back, guide.backMin, guide.backMax))
    .filter((guide) => isWithinRange(input.neck, guide.neckMin, guide.neckMax))
    .filter((guide) => isWithinRange(input.weightKg, guide.weightMinKg, guide.weightMaxKg))
    .map((guide) => ({
      sizeLabel: guide.sizeLabel,
      score:
        getDistanceScore(input.chest, guide.chestMin, guide.chestMax) * 4 +
        getDistanceScore(input.back, guide.backMin, guide.backMax) * 2 +
        getDistanceScore(input.neck, guide.neckMin, guide.neckMax) +
        getDistanceScore(input.weightKg, guide.weightMinKg, guide.weightMaxKg),
    }))
    .sort((left, right) => left.score - right.score)

  return candidates[0] ?? null
}

export function hasPetFinderCriteria(rawInput: PetFinderInput) {
  const input = resolvePetFinderInput(rawInput)
  return Boolean(input.breed || input.dogName || input.chest || input.back || input.neck || input.weightKg)
}
