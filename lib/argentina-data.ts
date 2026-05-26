export const argentinaProvinces = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const

export const provinceCitySuggestions: Record<string, string[]> = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 'San Nicolás de los Arroyos'],
  Catamarca: ['San Fernando del Valle de Catamarca', 'Belén', 'Tinogasta'],
  Chaco: ['Resistencia', 'Presidencia Roque Sáenz Peña', 'Villa Ángela'],
  Chubut: ['Rawson', 'Puerto Madryn', 'Comodoro Rivadavia', 'Trelew', 'Esquel'],
  'Córdoba': ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'Alta Gracia'],
  Corrientes: ['Corrientes', 'Goya', 'Paso de los Libres'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú'],
  Formosa: ['Formosa', 'Clorinda', 'Pirané'],
  Jujuy: ['San Salvador de Jujuy', 'Palpalá', 'Perico'],
  'La Pampa': ['Santa Rosa', 'General Pico', 'Toay'],
  'La Rioja': ['La Rioja', 'Chilecito', 'Aimogasta'],
  Mendoza: ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Maipú', 'Luján de Cuyo'],
  Misiones: ['Posadas', 'Oberá', 'Puerto Iguazú'],
  'Neuquén': ['Neuquén', 'San Martín de los Andes', 'Villa La Angostura', 'Plottier', 'Cutral Co'],
  'Río Negro': ['San Carlos de Bariloche', 'Bariloche', 'General Roca', 'Cipolletti', 'El Bolsón', 'Viedma'],
  Salta: ['Salta', 'San Ramón de la Nueva Orán', 'Tartagal'],
  'San Juan': ['San Juan', 'Rawson', 'Rivadavia'],
  'San Luis': ['San Luis', 'Villa Mercedes', 'Merlo'],
  'Santa Cruz': ['Río Gallegos', 'Caleta Olivia', 'El Calafate'],
  'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto'],
  'Santiago del Estero': ['Santiago del Estero', 'La Banda', 'Termas de Río Hondo'],
  'Tierra del Fuego': ['Ushuaia', 'Río Grande', 'Tolhuin'],
  Tucumán: ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo'],
}

export function normalizeProvinceName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export function getProvinceCitySuggestions(province: string) {
  const normalizedProvince = normalizeProvinceName(province)
  const exactKey = Object.keys(provinceCitySuggestions).find(
    (key) => normalizeProvinceName(key) === normalizedProvince,
  )

  return exactKey ? provinceCitySuggestions[exactKey] : []
}

export function getCanonicalProvince(value: string) {
  const normalizedProvince = normalizeProvinceName(value)
  return argentinaProvinces.find((province) => normalizeProvinceName(province) === normalizedProvince)
}

export function getCanonicalCity(province: string, value: string) {
  const normalizedCity = normalizeProvinceName(value)
  return getProvinceCitySuggestions(province).find((city) => normalizeProvinceName(city) === normalizedCity)
}
