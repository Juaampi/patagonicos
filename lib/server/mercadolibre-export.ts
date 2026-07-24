import path from 'node:path'
import ExcelJS from 'exceljs'
import { ProductStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'mercadolibre-publicar-template.xlsx')
const TEMPLATE_FIRST_DATA_ROW = 9
const MERCADO_LIBRE_PRICE_MULTIPLIER = 1.3
const BRAND_NAME = 'Patagónicos'
const OUT_OF_STOCK_PLACEHOLDER_SIZE = '__OUT_OF_STOCK__'
const SHEET_NAME_BY_CATEGORY: Record<string, string> = {
  Accesorios: 'Manuales',
  Buzos: 'Buzos y Hoodies',
  Camperas: 'Camperas, Tapados y Trenchs',
  Capas: 'Capas Impermeables',
  Chalecos: '(1) Abrigos',
  Parkas: '(2) Abrigos',
}

type ExportProductRecord = Awaited<ReturnType<typeof getProductsForMercadoLibreExport>>[number]

async function getProductsForMercadoLibreExport() {
  return prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
    },
    include: {
      category: true,
      variants: {
        orderBy: [{ colorName: 'asc' }, { size: 'asc' }],
      },
      images: {
        orderBy: [{ sortOrder: 'asc' }, { position: 'asc' }],
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

function calculateMercadoLibreExportPrice(webPrice: number) {
  return Math.round(webPrice * MERCADO_LIBRE_PRICE_MULTIPLIER)
}

function normalizeText(value?: string | null) {
  return value?.trim() ?? ''
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildCommaList(values: string[]) {
  return uniq(values).join(', ')
}

function inferProductType(product: ExportProductRecord) {
  const categoryName = normalizeText(product.category.name)

  if (categoryName === 'Camperas') return 'Campera'
  if (categoryName === 'Capas') return 'Capa'
  if (categoryName === 'Buzos') return 'Buzo'
  if (categoryName === 'Chalecos') return 'Chaleco'
  if (categoryName === 'Parkas') return 'Parka'
  if (categoryName === 'Accesorios') return 'Manual'

  return categoryName.slice(0, -1) || categoryName
}

function buildMlTitle(product: ExportProductRecord) {
  const animalLabel = product.animalType === 'DOG' ? 'para perro' : 'para gato'
  const hasBrandAlready = product.name.toLowerCase().includes(BRAND_NAME.toLowerCase())
  const rawTitle = `${product.name}${hasBrandAlready ? '' : ` ${BRAND_NAME}`} ${animalLabel}`.replace(/\s+/g, ' ').trim()

  if (rawTitle.length <= 60) {
    return rawTitle
  }

  const truncated = rawTitle.slice(0, 60)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated).trim()
}

function getAllProductImageUrls(product: ExportProductRecord) {
  const mainUrls = product.mainImageUrl ? [product.mainImageUrl] : []
  const galleryUrls = product.images.map((image) => image.url)
  return uniq([...mainUrls, ...galleryUrls])
}

function getProductPhotosValue(product: ExportProductRecord) {
  return getAllProductImageUrls(product).join(',')
}

function getCategorySheetName(product: ExportProductRecord) {
  return SHEET_NAME_BY_CATEGORY[product.category.name] ?? '(2) Abrigos'
}

function getProductColors(product: ExportProductRecord) {
  return buildCommaList(product.variants.map((variant) => normalizeText(variant.colorName)))
}

function getProductSizes(product: ExportProductRecord) {
  return buildCommaList(
    product.variants
      .map((variant) => normalizeText(variant.size))
      .filter((size) => size && size !== OUT_OF_STOCK_PLACEHOLDER_SIZE),
  )
}

function getTotalStock(product: ExportProductRecord) {
  return product.variants.reduce((total, variant) => total + Math.max(variant.stock, 0), 0)
}

function hasFeature(product: ExportProductRecord, search: string) {
  const haystack = [
    product.name,
    ...product.featureTags,
    ...product.materials,
    ...product.useTags,
    product.description,
    product.shortDescription,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(search.toLowerCase())
}

function booleanLabel(value: boolean) {
  return value ? 'Sí' : 'No'
}

function getHeaderMap(worksheet: ExcelJS.Worksheet) {
  const rowValues = worksheet.getRow(4).values
  const values = Array.isArray(rowValues) ? rowValues : []
  const headers = values.slice(1).map((value) => String(value ?? '').trim())
  return new Map(headers.map((header, index) => [header, index + 1]))
}

function clearSheetData(worksheet: ExcelJS.Worksheet, headerMap: Map<string, number>) {
  const preserveHeaders = new Set([
    'Cantidad de caracteres',
    'Cargo por vender ',
    'Costo por ofrecer cuotas',
    'BUYBOX_FORMULA',
    'HIDDEN_PICTURES',
  ])

  for (let rowIndex = TEMPLATE_FIRST_DATA_ROW; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex)
    for (const [header, columnIndex] of headerMap.entries()) {
      if (preserveHeaders.has(header)) {
        continue
      }

      row.getCell(columnIndex).value = null
    }
  }
}

function setCellValue(
  worksheet: ExcelJS.Worksheet,
  headerMap: Map<string, number>,
  rowIndex: number,
  header: string,
  value: string | number | null,
) {
  const columnIndex = headerMap.get(header)
  if (!columnIndex) {
    return
  }

  worksheet.getRow(rowIndex).getCell(columnIndex).value = value
}

function populateCommonPublicationFields(
  worksheet: ExcelJS.Worksheet,
  headerMap: Map<string, number>,
  rowIndex: number,
  product: ExportProductRecord,
) {
  const meliPrice = calculateMercadoLibreExportPrice(product.price)

  setCellValue(worksheet, headerMap, rowIndex, 'Errores', null)
  setCellValue(worksheet, headerMap, rowIndex, 'Título: incluí producto, marca, modelo y destaca sus características principales', buildMlTitle(product))
  setCellValue(worksheet, headerMap, rowIndex, 'Condición', 'Nuevo')
  setCellValue(worksheet, headerMap, rowIndex, 'Varía por: Nombre comercial del color', getProductColors(product) || 'No especificado')
  setCellValue(worksheet, headerMap, rowIndex, 'Fotos', getProductPhotosValue(product))
  setCellValue(worksheet, headerMap, rowIndex, 'SKU', product.variants[0]?.sku ?? product.slug)
  setCellValue(worksheet, headerMap, rowIndex, 'Stock', getTotalStock(product))
  setCellValue(worksheet, headerMap, rowIndex, 'Precio [$]', meliPrice)
  setCellValue(worksheet, headerMap, rowIndex, 'Descripción', normalizeText(product.description))
  setCellValue(worksheet, headerMap, rowIndex, 'Cuotas', 'No agregar cuotas')
  setCellValue(worksheet, headerMap, rowIndex, 'Forma de envío', 'Mercado Envíos')
  setCellValue(worksheet, headerMap, rowIndex, 'Costo de envío', 'A cargo del comprador')
  setCellValue(worksheet, headerMap, rowIndex, 'Retiro en persona', 'No acepto')
  setCellValue(worksheet, headerMap, rowIndex, 'Tipo de garantía', 'Sin garantía')
  setCellValue(worksheet, headerMap, rowIndex, 'Marca', BRAND_NAME)
  setCellValue(worksheet, headerMap, rowIndex, 'Código universal de producto', 'El producto no tiene código registrado')
}

function populateBuzosSheet(
  worksheet: ExcelJS.Worksheet,
  headerMap: Map<string, number>,
  rowIndex: number,
  product: ExportProductRecord,
) {
  populateCommonPublicationFields(worksheet, headerMap, rowIndex, product)

  setCellValue(worksheet, headerMap, rowIndex, 'Varía por: Diseño de la tela', hasFeature(product, 'peluche') ? 'Peluche' : 'Liso')
  setCellValue(worksheet, headerMap, rowIndex, 'Talle', getProductSizes(product))
  setCellValue(worksheet, headerMap, rowIndex, 'Género', 'Sin género')
  setCellValue(worksheet, headerMap, rowIndex, 'Modelo', product.name)
  setCellValue(worksheet, headerMap, rowIndex, 'Tipo de prenda', 'Buzo')
  setCellValue(worksheet, headerMap, rowIndex, 'Deportiva', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Capucha', booleanLabel(hasFeature(product, 'capucha')))
  setCellValue(worksheet, headerMap, rowIndex, 'Material principal', 'Poliéster')
  setCellValue(worksheet, headerMap, rowIndex, 'Composición', buildCommaList(product.materials))
  setCellValue(worksheet, headerMap, rowIndex, 'Forma del calce', 'Regular')
  setCellValue(worksheet, headerMap, rowIndex, 'Tipo de cuello', 'Redondo')
  setCellValue(worksheet, headerMap, rowIndex, 'Oversize', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Materiales reciclados', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Apto para embarazo', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Usos recomendados', buildCommaList(product.useTags))
}

function populateCamperasSheet(
  worksheet: ExcelJS.Worksheet,
  headerMap: Map<string, number>,
  rowIndex: number,
  product: ExportProductRecord,
  typeLabel: string,
) {
  populateCommonPublicationFields(worksheet, headerMap, rowIndex, product)

  setCellValue(worksheet, headerMap, rowIndex, 'Varía por: Diseño de la tela', 'Liso')
  setCellValue(worksheet, headerMap, rowIndex, 'Talle', getProductSizes(product))
  setCellValue(worksheet, headerMap, rowIndex, 'Género', 'Sin género')
  setCellValue(worksheet, headerMap, rowIndex, 'Modelo', product.name)
  setCellValue(worksheet, headerMap, rowIndex, 'Tipo de prenda', typeLabel)
  setCellValue(worksheet, headerMap, rowIndex, 'Temporada de lanzamiento', 'Otoño/Invierno')
  setCellValue(worksheet, headerMap, rowIndex, 'Material principal', 'Poliéster')
  setCellValue(worksheet, headerMap, rowIndex, 'Composición', buildCommaList(product.materials))
  setCellValue(worksheet, headerMap, rowIndex, 'Usos recomendados', buildCommaList(product.useTags))
  setCellValue(worksheet, headerMap, rowIndex, 'Bolsillos', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Materiales reciclados', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Deportiva', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Capucha', booleanLabel(hasFeature(product, 'capucha')))
  setCellValue(worksheet, headerMap, rowIndex, 'Impermeable', booleanLabel(hasFeature(product, 'impermeable')))
  setCellValue(worksheet, headerMap, rowIndex, 'Térmica', booleanLabel(hasFeature(product, 'térmica') || hasFeature(product, 'termica') || hasFeature(product, 'polar')))
  setCellValue(worksheet, headerMap, rowIndex, 'Ultra liviana', 'No')
}

function populateAbrigosSheet(
  worksheet: ExcelJS.Worksheet,
  headerMap: Map<string, number>,
  rowIndex: number,
  product: ExportProductRecord,
) {
  populateCommonPublicationFields(worksheet, headerMap, rowIndex, product)

  setCellValue(worksheet, headerMap, rowIndex, 'Talle', getProductSizes(product))
  setCellValue(worksheet, headerMap, rowIndex, 'Modelo', product.name)
  setCellValue(worksheet, headerMap, rowIndex, 'Tipo de producto', inferProductType(product))
  setCellValue(worksheet, headerMap, rowIndex, 'Nombre del diseño', 'Liso')
  setCellValue(worksheet, headerMap, rowIndex, 'Mascotas recomendadas', product.animalType === 'DOG' ? 'Perros' : 'Gatos')
  setCellValue(worksheet, headerMap, rowIndex, 'Materiales', buildCommaList(product.materials))
  setCellValue(worksheet, headerMap, rowIndex, 'Apto para lavarropas', 'Sí')
  setCellValue(worksheet, headerMap, rowIndex, 'Apto para secarropas', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Apto para planchado', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Apto para blanqueador', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Reversible', 'No')
  setCellValue(worksheet, headerMap, rowIndex, 'Impermeable', booleanLabel(hasFeature(product, 'impermeable')))
  setCellValue(worksheet, headerMap, rowIndex, 'Correas ajustables', booleanLabel(hasFeature(product, 'ajuste')))
  setCellValue(worksheet, headerMap, rowIndex, 'Velcro', booleanLabel(hasFeature(product, 'velcro')))
  setCellValue(worksheet, headerMap, rowIndex, 'Apertura para correa', booleanLabel(hasFeature(product, 'correa')))
}

function populateManualesSheet(
  worksheet: ExcelJS.Worksheet,
  headerMap: Map<string, number>,
  rowIndex: number,
  product: ExportProductRecord,
) {
  populateCommonPublicationFields(worksheet, headerMap, rowIndex, product)

  setCellValue(worksheet, headerMap, rowIndex, 'Formato de venta', 'Unidad')
  setCellValue(worksheet, headerMap, rowIndex, 'Unidades por pack', 1)
  setCellValue(worksheet, headerMap, rowIndex, 'Modelo', product.name)
  setCellValue(worksheet, headerMap, rowIndex, 'Adhesivo', 'No')
}

function populateSheetRow(
  worksheet: ExcelJS.Worksheet,
  product: ExportProductRecord,
  rowIndex: number,
) {
  const headerMap = getHeaderMap(worksheet)

  if (worksheet.name === 'Buzos y Hoodies') {
    populateBuzosSheet(worksheet, headerMap, rowIndex, product)
    return
  }

  if (worksheet.name === 'Camperas, Tapados y Trenchs') {
    populateCamperasSheet(worksheet, headerMap, rowIndex, product, 'Campera')
    return
  }

  if (worksheet.name === 'Capas Impermeables') {
    populateCamperasSheet(worksheet, headerMap, rowIndex, product, 'Capa')
    return
  }

  if (worksheet.name === '(1) Abrigos' || worksheet.name === '(2) Abrigos' || worksheet.name === 'Chalecos Salvavidas') {
    populateAbrigosSheet(worksheet, headerMap, rowIndex, product)
    return
  }

  if (worksheet.name === 'Manuales') {
    populateManualesSheet(worksheet, headerMap, rowIndex, product)
  }
}

export async function buildMercadoLibreExportWorkbook() {
  const products = await getProductsForMercadoLibreExport()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(TEMPLATE_PATH)

  const editableSheets = workbook.worksheets.filter((worksheet) =>
    !['Ayuda', 'extra info', 'Legales'].includes(worksheet.name),
  )

  editableSheets.forEach((worksheet) => {
    clearSheetData(worksheet, getHeaderMap(worksheet))
  })

  const rowIndexBySheet = new Map<string, number>()

  for (const product of products) {
    const sheetName = getCategorySheetName(product)
    const worksheet = workbook.getWorksheet(sheetName)

    if (!worksheet) {
      continue
    }

    const nextRowIndex = rowIndexBySheet.get(sheetName) ?? TEMPLATE_FIRST_DATA_ROW
    populateSheetRow(worksheet, product, nextRowIndex)
    rowIndexBySheet.set(sheetName, nextRowIndex + 1)
  }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}
