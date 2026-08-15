import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

type StoredBranch = {
  id: string
  label: string
  branchName: string
  addressLine: string
  province?: string
  city?: string
  postalCode?: string
}

type BranchStore = {
  updatedAt?: string
  totalBranches?: number
  postalCodes?: Record<string, StoredBranch[]>
  branches?: StoredBranch[]
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')?.trim() ?? ''
  const province = searchParams.get('province')?.trim() ?? ''
  const postalCode = searchParams.get('postalCode')?.trim() ?? ''

  if (city.length < 2 || province.length < 2 || postalCode.length < 3) {
    return NextResponse.json({ branches: [], message: 'Faltan datos para buscar sucursales.' }, { status: 400 })
  }

  try {
    const storePath = path.join(process.cwd(), 'data', 'andreani-branches.json')
    const raw = await readFile(storePath, 'utf8')
    const store = JSON.parse(raw) as BranchStore
    const postalMatches = store.postalCodes?.[postalCode] ?? []

    if (postalMatches.length > 0) {
      return NextResponse.json({
        branches: postalMatches,
        message: `Encontramos ${postalMatches.length} sucursales para el código postal ${postalCode}.`,
      })
    }

    const normalizedCity = normalizeText(city)
    const normalizedProvince = normalizeText(province)
    const fallbackMatches = (store.branches ?? []).filter((branch) => {
      const branchCity = normalizeText(branch.city ?? '')
      const branchProvince = normalizeText(branch.province ?? '')

      return branchCity.includes(normalizedCity) && branchProvince.includes(normalizedProvince)
    })

    return NextResponse.json({
      branches: fallbackMatches,
      message:
        fallbackMatches.length > 0
          ? `Encontramos ${fallbackMatches.length} sucursales en ${city}.`
          : 'No encontramos sucursales para esa búsqueda en el archivo local.',
    })
  } catch {
    return NextResponse.json(
      {
        branches: [],
        message: 'No pudimos leer el archivo local de sucursales.',
      },
      { status: 500 },
    )
  }
}
