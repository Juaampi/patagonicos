import { ShippingMethod, ShippingStatus } from '@prisma/client'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

const ANDREANI_TRACKING_URL = 'https://www.andreani.com/envio/W'
const BUZO_WEIGHT_GRAMS = 300
const DISPATCHED_SHIPPING_STATUSES: ShippingStatus[] = [
  ShippingStatus.DESPACHADO,
  ShippingStatus.EN_TRANSITO,
  ShippingStatus.EN_SUCURSAL,
  ShippingStatus.ENTREGADO,
]

const ANDREANI_COLUMNS = [
  { key: 'package', width: 9.14, header: 'Paquete Guardado' },
  { key: 'weight', width: 9.57, header: 'Peso (grs)\nEj:' },
  { key: 'height', width: 8.85, header: 'Alto (cm)\nEj:' },
  { key: 'width', width: 10.85, header: 'Ancho (cm)\nEj:' },
  { key: 'depth', width: 16.42, header: 'Profundidad (cm)\nEj:' },
  { key: 'declaredValue', width: 24.71, header: 'Valor declarado ($ C/IVA) *\nEj:' },
  { key: 'internalNumber', width: 15.42, header: 'Numero Interno\nEj:' },
  { key: 'firstName', width: 9.71, header: 'Nombre *\nEj:' },
  { key: 'lastName', width: 9.57, header: 'Apellido *\nEj:' },
  { key: 'dni', width: 5.57, header: 'DNI *\nEj:' },
  { key: 'email', width: 7.28, header: 'Email *\nEj:' },
  { key: 'phoneAreaCode', width: 15, header: 'Celular código *\nEj:' },
  { key: 'phoneNumber', width: 16.14, header: 'Celular número *\nEj:' },
  { key: 'streetName', width: 6.42, header: 'Calle *\nEj:' },
  { key: 'streetNumber', width: 9.71, header: 'Número *\nEj:' },
  { key: 'floor', width: 4.57, header: 'Piso\nEj:' },
  { key: 'apartment', width: 14.14, header: 'Departamento\nEj:' },
  { key: 'provinceCityPostalCode', width: 41.42, header: 'Provincia / Localidad / CP *\nEj: BUENOS AIRES / 11 DE SEPTIEMBRE / 1657' },
  { key: 'notes', width: 14.14, header: 'Observaciones\nEj:' },
] as const

type PendingOrderRecord = Awaited<ReturnType<typeof getAndreaniOrdersRaw>>[number]

function splitFullName(fullName?: string | null) {
  const normalized = (fullName ?? '').trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  }
}

function parseStreetAddress(line1?: string | null) {
  const raw = (line1 ?? '').trim()
  if (!raw) {
    return { streetName: '', streetNumber: '' }
  }

  const match = raw.match(/^(.*?)(?:\s+(\d+[A-Za-z0-9/-]*))?$/)
  return {
    streetName: (match?.[1] ?? raw).trim(),
    streetNumber: (match?.[2] ?? '').trim(),
  }
}

function getAndreaniMissingFields(order: PendingOrderRecord) {
  const derivedName = splitFullName(order.customer.fullName)
  const derivedStreet = parseStreetAddress(order.address?.line1)
  const missing: string[] = []

  if (!order.address?.recipientFirstName?.trim() && !derivedName.firstName) {
    missing.push('Nombre')
  }

  if (!order.address?.recipientLastName?.trim() && !derivedName.lastName) {
    missing.push('Apellido')
  }

  if (!order.address?.recipientDni?.trim()) {
    missing.push('DNI')
  }

  if (!order.address?.phoneAreaCode?.trim()) {
    missing.push('Código celular')
  }

  if (!order.address?.phoneNumber?.trim()) {
    missing.push('Número celular')
  }

  if (!order.address?.streetName?.trim() && !derivedStreet.streetName) {
    missing.push('Calle')
  }

  if (!order.address?.streetNumber?.trim() && !derivedStreet.streetNumber) {
    missing.push('Número')
  }

  if (!order.address?.province?.trim() || !order.address?.city?.trim() || !order.address?.postalCode?.trim()) {
    missing.push('Provincia / Localidad / CP')
  }

  if (!order.customer.email?.trim()) {
    missing.push('Email')
  }

  return missing
}

function getOrderWeight(order: PendingOrderRecord) {
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)
  return totalUnits * BUZO_WEIGHT_GRAMS
}

async function getAndreaniOrdersRaw() {
  return prisma.order.findMany({
    where: {
      shippingMethod: ShippingMethod.NATIONAL_SHIPPING,
      shippingStatus: {
        notIn: [ShippingStatus.CANCELADO],
      },
    },
    include: {
      customer: true,
      address: true,
      items: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getAndreaniShipmentSnapshot() {
  const orders = await getAndreaniOrdersRaw()

  const shipments = orders.map((order) => {
    const missingFields = getAndreaniMissingFields(order)
    const isDispatched = DISPATCHED_SHIPPING_STATUSES.includes(order.shippingStatus)

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      shortCode: order.shortCode ?? undefined,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customer.fullName ?? order.customer.email,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone ?? undefined,
      city: order.address?.city ?? '',
      province: order.address?.province ?? '',
      postalCode: order.address?.postalCode ?? '',
      addressLine: order.address?.line1 ?? '',
      total: order.total,
      shippingStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber ?? undefined,
      carrier: order.carrier ?? undefined,
      missingFields,
      readyToExport: !isDispatched && missingFields.length === 0,
      isDispatched,
      totalUnits: order.items.reduce((sum, item) => sum + item.quantity, 0),
      totalWeightGrams: getOrderWeight(order),
    }
  })

  return {
    shipments,
    readyToExport: shipments.filter((shipment) => shipment.readyToExport),
    missingData: shipments.filter((shipment) => !shipment.isDispatched && shipment.missingFields.length > 0),
    dispatched: shipments.filter((shipment) => shipment.isDispatched),
    trackerUrl: ANDREANI_TRACKING_URL,
  }
}

export async function buildAndreaniExportWorkbook() {
  const orders = await getAndreaniOrdersRaw()
  const exportableOrders = orders.filter((order) => {
    const isDispatched = DISPATCHED_SHIPPING_STATUSES.includes(order.shippingStatus)

    return !isDispatched && getAndreaniMissingFields(order).length === 0
  })

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('A domicilio')

  worksheet.columns = ANDREANI_COLUMNS.map((column) => ({
    key: column.key,
    width: column.width,
  }))

  worksheet.mergeCells('A1:G1')
  worksheet.mergeCells('H1:M1')
  worksheet.mergeCells('N1:S1')

  const sectionStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF1F2937' },
    },
  }

  worksheet.getCell('A1').value = 'Características'
  worksheet.getCell('H1').value = 'Destinatario'
  worksheet.getCell('N1').value = 'Domicilio destino'
  worksheet.getRow(1).height = 22

  ;['A1', 'H1', 'N1'].forEach((cellRef) => {
    Object.assign(worksheet.getCell(cellRef), sectionStyle)
  })

  const headerRow = worksheet.getRow(2)
  ANDREANI_COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1)
    cell.value = column.header
    cell.font = { bold: true, color: { argb: 'FF111827' }, size: 10 }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    }
  })
  headerRow.height = 42

  exportableOrders.forEach((order, index) => {
    const derivedName = splitFullName(order.customer.fullName)
    const derivedStreet = parseStreetAddress(order.address?.line1)
    const firstName = order.address?.recipientFirstName?.trim() || derivedName.firstName
    const lastName = order.address?.recipientLastName?.trim() || derivedName.lastName
    const streetName = order.address?.streetName?.trim() || derivedStreet.streetName
    const streetNumber = order.address?.streetNumber?.trim() || derivedStreet.streetNumber

    const row = worksheet.addRow({
      package: '',
      weight: getOrderWeight(order),
      height: '',
      width: '',
      depth: '',
      declaredValue: order.total,
      internalNumber: order.shortCode ?? order.orderNumber,
      firstName,
      lastName,
      dni: order.address?.recipientDni ?? '',
      email: order.customer.email,
      phoneAreaCode: order.address?.phoneAreaCode ?? '',
      phoneNumber: order.address?.phoneNumber ?? '',
      streetName,
      streetNumber,
      floor: order.address?.floor ?? '',
      apartment: order.address?.apartment ?? '',
      provinceCityPostalCode: `${order.address?.province ?? ''} / ${order.address?.city ?? ''} / ${order.address?.postalCode ?? ''}`.trim(),
      notes: order.notes ?? '',
    })

    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })

    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        }
      })
    }
  })

  worksheet.views = [{ state: 'frozen', ySplit: 2 }]

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

export function getAndreaniTrackingUrl(trackingNumber?: string | null) {
  const normalized = trackingNumber?.trim()

  if (!normalized) {
    return ANDREANI_TRACKING_URL
  }

  return `${ANDREANI_TRACKING_URL}${encodeURIComponent(normalized)}`
}

export async function findTrackedOrder(code: string) {
  const normalized = code.trim()
  if (!normalized) {
    return null
  }

  return prisma.order.findFirst({
    where: {
      OR: [
        { trackingNumber: normalized },
        { shortCode: normalized },
        { orderNumber: normalized },
      ],
    },
    include: {
      customer: true,
      address: true,
      items: true,
    },
  })
}
