import { ShippingMethod, ShippingStatus } from '@prisma/client'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'

const ANDREANI_TRACKING_URL = 'https://www.andreani.com/envio/W'
const ANDREANI_TEMPLATE_PATH = path.join(process.cwd(), 'templates-andreani.xlsx')
const BUZO_WEIGHT_GRAMS = 300
const DISPATCHED_SHIPPING_STATUSES: ShippingStatus[] = [
  ShippingStatus.DESPACHADO,
  ShippingStatus.EN_TRANSITO,
  ShippingStatus.EN_SUCURSAL,
  ShippingStatus.ENTREGADO,
]

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

  const templateBuffer = await fs.readFile(ANDREANI_TEMPLATE_PATH)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(templateBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0])

  const worksheet = workbook.getWorksheet('A domicilio') ?? workbook.worksheets[0]
  const existingRows = Math.max(0, worksheet.rowCount - 2)
  if (existingRows > 0) {
    worksheet.spliceRows(3, existingRows)
  }

  exportableOrders.forEach((order, index) => {
    const rowIndex = index + 3
    const derivedName = splitFullName(order.customer.fullName)
    const derivedStreet = parseStreetAddress(order.address?.line1)
    const firstName = order.address?.recipientFirstName?.trim() || derivedName.firstName
    const lastName = order.address?.recipientLastName?.trim() || derivedName.lastName
    const streetName = order.address?.streetName?.trim() || derivedStreet.streetName
    const streetNumber = order.address?.streetNumber?.trim() || derivedStreet.streetNumber

    worksheet.getCell(`A${rowIndex}`).value = ''
    worksheet.getCell(`B${rowIndex}`).value = getOrderWeight(order)
    worksheet.getCell(`C${rowIndex}`).value = ''
    worksheet.getCell(`D${rowIndex}`).value = ''
    worksheet.getCell(`E${rowIndex}`).value = ''
    worksheet.getCell(`F${rowIndex}`).value = order.total
    worksheet.getCell(`G${rowIndex}`).value = order.shortCode ?? order.orderNumber
    worksheet.getCell(`H${rowIndex}`).value = firstName
    worksheet.getCell(`I${rowIndex}`).value = lastName
    worksheet.getCell(`J${rowIndex}`).value = order.address?.recipientDni ?? ''
    worksheet.getCell(`K${rowIndex}`).value = order.customer.email
    worksheet.getCell(`L${rowIndex}`).value = order.address?.phoneAreaCode ?? ''
    worksheet.getCell(`M${rowIndex}`).value = order.address?.phoneNumber ?? ''
    worksheet.getCell(`N${rowIndex}`).value = streetName
    worksheet.getCell(`O${rowIndex}`).value = streetNumber
    worksheet.getCell(`P${rowIndex}`).value = order.address?.floor ?? ''
    worksheet.getCell(`Q${rowIndex}`).value = order.address?.apartment ?? ''
    worksheet.getCell(`R${rowIndex}`).value =
      `${order.address?.province ?? ''} / ${order.address?.city ?? ''} / ${order.address?.postalCode ?? ''}`.trim()
    worksheet.getCell(`S${rowIndex}`).value = order.notes ?? ''
  })

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
