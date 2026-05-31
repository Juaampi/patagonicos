import { Droplets, ShieldCheck, Sparkles, Thermometer, Wind } from 'lucide-react'

export type FeatureChip = {
  label: string
  text: string
}

export type MaterialSpec = {
  title: string
  description: string
  icon: typeof Droplets
}

const featureMap: Record<string, FeatureChip> = {
  impermeable: { label: 'IMPERMEABLE', text: 'Lluvia y nieve' },
  térmica: { label: 'TÉRMICA', text: 'Conserva el calor' },
  termica: { label: 'TÉRMICA', text: 'Conserva el calor' },
  cortaviento: { label: 'CORTAVIENTO', text: 'Bloquea el frío' },
  liviana: { label: 'LIVIANA', text: 'Máxima comodidad' },
  cómoda: { label: 'LIVIANA', text: 'Máxima comodidad' },
  comoda: { label: 'LIVIANA', text: 'Máxima comodidad' },
  lavable: { label: 'LAVABLE', text: 'Cuidado simple' },
}

const materialMap: Record<string, MaterialSpec> = {
  'Exterior impermeable': {
    title: 'EXTERIOR',
    description: 'Impermeable y resistente a la nieve',
    icon: Droplets,
  },
  'Interior térmico': {
    title: 'INTERIOR',
    description: 'Polar térmico que mantiene el calor',
    icon: Thermometer,
  },
  'Ajuste seguro': {
    title: 'AJUSTE',
    description: 'Calce firme, cómodo y estable',
    icon: ShieldCheck,
  },
  'Cobertura total': {
    title: 'COBERTURA',
    description: 'Protección amplia sobre lomo y pecho',
    icon: Wind,
  },
  'Exterior técnico': {
    title: 'EXTERIOR',
    description: 'Tela técnica lista para clima frío',
    icon: Droplets,
  },
  'Cierre rápido': {
    title: 'CIERRE',
    description: 'Sistema frontal práctico y seguro',
    icon: ShieldCheck,
  },
  'Cuello alto': {
    title: 'CUELLO',
    description: 'Más abrigo frente a ráfagas y viento',
    icon: Wind,
  },
  'Microfibra térmica': {
    title: 'INTERIOR',
    description: 'Textura térmica con tacto suave',
    icon: Thermometer,
  },
  'Textura doble cara': {
    title: 'TEXTURA',
    description: 'Acabado premium de uso diario',
    icon: Sparkles,
  },
  'Neopreno suave': {
    title: 'EXTERIOR',
    description: 'Estructura flexible y confortable',
    icon: Droplets,
  },
}

export function getFeatureChips(featureTags: string[]): FeatureChip[] {
  return featureTags.map((tag) => {
    const mapped = featureMap[tag.toLowerCase()]
    if (mapped) return mapped

    return {
      label: tag.toUpperCase(),
      text: '',
    }
  })
}

export function getMaterialSpecs(materials: string[]): MaterialSpec[] {
  return materials.map((material) => {
    return (
      materialMap[material] ?? {
        title: material.toUpperCase(),
        description: '',
        icon: Sparkles,
      }
    )
  })
}
