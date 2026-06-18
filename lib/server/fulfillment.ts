import {
  DeliveryStatus,
  PaymentMethod,
  PaymentStatus,
  PrintJobStatus,
  PrintJobType,
  ShippingMethod,
  ShippingStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'
import { normalizeProvinceName } from '@/lib/argentina-data'
import { env } from '@/lib/env'
import { sendOrderCreatedNotifications, sendOrderPaidNotification } from '@/lib/order-email-notifications'
import { prisma } from '@/lib/prisma'
import { getCheckoutPreview } from '@/lib/store-settings'
import { formatPrice } from '@/lib/utils'

function isMissingSchemaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    /does not exist in the current database/i.test(error.message)
  )
}

function deriveLegacyDeliveryStatus(status: string) {
  if (status === 'DELIVERED' || status === 'ENTREGADO') return 'DELIVERED'
  if (status === 'OUT_FOR_DELIVERY' || status === 'ENVIADO') return 'IN_ROUTE'
  if (status === 'CANCELLED' || status === 'CANCELADO') return 'CANCELLED'
  return 'PENDING_DELIVERY'
}

function deriveLegacyFulfillmentType(shippingMethod: string) {
  return shippingMethod === ShippingMethod.LOCAL_DELIVERY || shippingMethod === ShippingMethod.BARILOCHE_SAME_DAY
    ? 'local_delivery'
    : 'national_shipping'
}

function deriveLegacyAmountToCollect(order: {
  paymentMethod: PaymentMethod | string
  paymentStatus: PaymentStatus | string
  total: number
}) {
  if (order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && order.paymentStatus !== PaymentStatus.PAID) {
    return order.total
  }

  return 0
}

export const defaultStoreSettings = {
  localDeliveryFreeThreshold: 80000,
  localDeliveryCost: 4500,
  nationalShippingCost: 8900,
  barilocheCutoffHour: 14,
  barilocheCutoffMinute: 30,
  barilocheEnabled: false,
  barilocheDiscountPercent: 10,
} as const

export const ensureStoreSettings = cache(async function ensureStoreSettings() {
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      ...defaultStoreSettings,
    },
  })

  return prisma.storeSettings.findUniqueOrThrow({
    where: { id: 'default' },
  })
})

export function normalizeCity(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export function isBarilocheCity(city: string) {
  const normalized = normalizeCity(city)
  return normalized === 'bariloche' || normalized === 'san carlos de bariloche'
}

export function isRioNegroProvince(province: string) {
  return normalizeProvinceName(province) === 'rio negro'
}

export function isBarilocheLocation(city: string, province: string) {
  return isBarilocheCity(city) && isRioNegroProvince(province)
}

export function generateShortCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let index = 0; index < 5; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `ORD-${suffix}`
}

export function generateOrderNumber() {
  const now = new Date()
  const dateCode = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}`
  const randomCode = Math.floor(1000 + Math.random() * 9000)
  return `PA-${dateCode}-${randomCode}`
}

export function buildInternalQrUrl(shortCode: string) {
  return `${env.SITE_URL}/delivery/orders/${shortCode}`
}

export function buildInternalQrImage(shortCode: string) {
  return `https://quickchart.io/qr?text=${encodeURIComponent(buildInternalQrUrl(shortCode))}&size=240`
}

export async function calculateShippingForCheckout(subtotal: number, city: string, province: string) {
  const settings = await ensureStoreSettings()
  const preview = getCheckoutPreview(subtotal, city, province, settings)
  return {
    shippingMethod:
      preview.shippingMethod === 'LOCAL_DELIVERY' ? ShippingMethod.LOCAL_DELIVERY : ShippingMethod.NATIONAL_SHIPPING,
    shippingAmount: preview.shippingAmount,
    discountAmount: preview.discountAmount,
    discountPercent: preview.discountPercent,
    total: preview.total,
    allowCashOnDelivery: preview.allowCashOnDelivery,
    deliveryCopy: preview.isBariloche
      ? `Entrega en el día comprando antes de las ${`${settings.barilocheCutoffHour}`.padStart(2, '0')}:${`${settings.barilocheCutoffMinute}`.padStart(2, '0')} hs en Bariloche`
      : 'Envíos nacionales con despacho rápido desde Bariloche.',
  }
}

function getPendingPrintJobType(shippingMethod: ShippingMethod) {
  return shippingMethod === ShippingMethod.LOCAL_DELIVERY || shippingMethod === ShippingMethod.BARILOCHE_SAME_DAY
    ? PrintJobType.LOCAL_TICKET
    : PrintJobType.NATIONAL_LABEL
}

function getReadyStatusForPaidOrder(shippingMethod: ShippingMethod) {
  return shippingMethod === ShippingMethod.LOCAL_DELIVERY || shippingMethod === ShippingMethod.BARILOCHE_SAME_DAY
    ? OrderStatus.READY_FOR_LOCAL_DELIVERY
    : OrderStatus.READY_FOR_NATIONAL_SHIPPING
}

export async function queuePrintJobForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    throw new Error('No encontramos la orden para generar impresión.')
  }

  const existingJob = await prisma.printJob.findFirst({
    where: {
      orderId,
      type: getPendingPrintJobType(order.shippingMethod),
      status: PrintJobStatus.PENDING,
    },
  })

  if (existingJob) {
    return existingJob
  }

  return prisma.printJob.create({
    data: {
      orderId,
      type: getPendingPrintJobType(order.shippingMethod),
      status: PrintJobStatus.PENDING,
      payload: {
        shortCode: order.shortCode,
        orderNumber: order.orderNumber,
        shippingMethod: order.shippingMethod,
        paymentStatus: order.paymentStatus,
      },
      fileUrl: order.shortCode ? `/admin/pedidos/${order.id}/ticket` : null,
    },
  })
}

export async function syncApprovedPayment(orderId: string, paymentReference?: string | null) {
  let justApproved = false

  const order = await prisma.$transaction(async (tx) => {
    const currentOrder = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: true,
      },
    })

    if (currentOrder.paymentStatus === PaymentStatus.PAID) {
      return tx.order.update({
        where: { id: orderId },
        data: {
          ...(paymentReference && currentOrder.mercadopagoRef !== paymentReference
            ? { mercadopagoRef: paymentReference }
            : {}),
        },
      })
    }

    const shouldApplyStock = !currentOrder.stockAppliedAt

    if (shouldApplyStock) {
      for (const item of currentOrder.items) {
        const updated = await tx.productVariant.updateMany({
          where: {
            productId: item.productId,
            colorName: item.colorName,
            size: item.size,
            stock: {
              gte: item.quantity,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })

        if (updated.count === 0) {
          throw new Error(
            `No hay stock suficiente para ${item.productName} ${item.colorName} ${item.size}.`,
          )
        }
      }
    }

    justApproved = true

    return tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: getReadyStatusForPaidOrder(currentOrder.shippingMethod),
        shippingStatus: ShippingStatus.EN_PREPARACION,
        ...(paymentReference ? { mercadopagoRef: paymentReference } : {}),
        ...(shouldApplyStock ? { stockAppliedAt: new Date() } : {}),
      },
    })
  })

  if (justApproved) {
    await queuePrintJobForOrder(order.id)
    await sendOrderPaidNotification(order.id)
  }

  return order
}

export function getOrderStateLabel(status: string) {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    PAGADO: 'Pagado',
    PREPARANDO: 'Preparando',
    ENVIADO: 'Enviado',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
    PENDING_PAYMENT: 'Pendiente de pago',
    PAID: 'Pagado',
    AWAITING_PAYMENT_ON_DELIVERY: 'Pago contra entrega',
    READY_FOR_LOCAL_DELIVERY: 'Listo para reparto local',
    READY_FOR_NATIONAL_SHIPPING: 'Listo para envío nacional',
    OUT_FOR_DELIVERY: 'En reparto',
    SHIPPED: 'Despachado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazado',
    PENDING_ON_DELIVERY: 'Pendiente al entregar',
    ONLINE: 'Pagado online',
    CASH_ON_DELIVERY: 'Contra entrega',
    PENDING_DELIVERY: 'Pendiente de entrega',
    IN_ROUTE: 'En camino',
    FAILED_DELIVERY: 'Intento fallido',
    RESCHEDULED: 'Reprogramado',
  }

  return labels[status] ?? status
}

export function isDeliveredStatus(status: string) {
  return status === 'ENTREGADO' || status === 'DELIVERED'
}

export function isCancelledStatus(status: string) {
  return status === 'CANCELADO' || status === 'CANCELLED'
}

export function isShippedStatus(status: string) {
  return status === 'ENVIADO' || status === 'SHIPPED' || status === 'DESPACHADO'
}

export function getShippingMethodLabel(method: ShippingMethod | string) {
  if (method === ShippingMethod.LOCAL_DELIVERY || method === ShippingMethod.BARILOCHE_SAME_DAY) {
    return 'Local Bariloche'
  }

  return 'Envío nacional'
}

export function buildGoogleMapsPinUrl(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) {
    return ''
  }

  const url = new URL('https://www.google.com/maps/search/')
  url.searchParams.set('api', '1')
  url.searchParams.set('query', `${latitude},${longitude}`)
  return url.toString()
}

export type CheckoutOrderItemInput = {
  productId: string
  productName: string
  colorName: string
  size: string
  quantity: number
  unitPrice: number
}

export async function createOrderFromCheckout(input: {
  fullName: string
  lastName: string
  dni: string
  email: string
  phone: string
  phoneAreaCode: string
  phoneNumber: string
  whatsappOptIn: boolean
  address: string
  streetNumber: string
  floor?: string
  apartment?: string
  city: string
  province: string
  postalCode: string
  latitude?: number
  longitude?: number
  pinLabel?: string
  notes?: string
  items: CheckoutOrderItemInput[]
  paymentMethod: PaymentMethod
}) {
  const subtotal = input.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
  const shipping = await calculateShippingForCheckout(subtotal, input.city, input.province)
  const shortCode = generateShortCode()
  const orderNumber = generateOrderNumber()
  const total = shipping.total
  const effectivePaymentMethod =
    shipping.shippingMethod === ShippingMethod.LOCAL_DELIVERY ? input.paymentMethod : PaymentMethod.ONLINE

  const baseStatus =
    shipping.shippingMethod === ShippingMethod.LOCAL_DELIVERY && effectivePaymentMethod === PaymentMethod.CASH_ON_DELIVERY
      ? OrderStatus.AWAITING_PAYMENT_ON_DELIVERY
      : OrderStatus.PENDING_PAYMENT

  const basePaymentStatus =
    shipping.shippingMethod === ShippingMethod.LOCAL_DELIVERY && effectivePaymentMethod === PaymentMethod.CASH_ON_DELIVERY
      ? PaymentStatus.PENDING_ON_DELIVERY
      : PaymentStatus.PENDING

  const customer = await prisma.customer.upsert({
    where: { email: input.email },
    update: {
      fullName: `${input.fullName} ${input.lastName}`.trim(),
      phone: input.phone,
      whatsappOptIn: input.whatsappOptIn,
    },
    create: {
      email: input.email,
      fullName: `${input.fullName} ${input.lastName}`.trim(),
      phone: input.phone,
      whatsappOptIn: input.whatsappOptIn,
    },
  })

  const address = await prisma.address.create({
    data: {
      customerId: customer.id,
      line1: `${input.address} ${input.streetNumber}`.trim(),
      line2: [input.floor, input.apartment].filter(Boolean).join(' ').trim() || null,
      recipientFirstName: input.fullName,
      recipientLastName: input.lastName,
      recipientDni: input.dni,
      phoneAreaCode: input.phoneAreaCode,
      phoneNumber: input.phoneNumber,
      streetName: input.address,
      streetNumber: input.streetNumber,
      floor: input.floor || null,
      apartment: input.apartment || null,
      city: input.city,
      province: input.province,
      postalCode: input.postalCode,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      pinLabel: input.pinLabel || null,
    },
  })

  const order = await prisma.order.create({
    data: {
      orderNumber,
      shortCode,
      customerId: customer.id,
      addressId: address.id,
      status: baseStatus,
      paymentStatus: basePaymentStatus,
      paymentMethod: effectivePaymentMethod,
      shippingMethod: shipping.shippingMethod,
      shippingStatus: ShippingStatus.PENDIENTE,
      fulfillmentType: shipping.shippingMethod === ShippingMethod.LOCAL_DELIVERY ? 'local_delivery' : 'national_shipping',
      deliveryStatus:
        shipping.shippingMethod === ShippingMethod.LOCAL_DELIVERY
          ? DeliveryStatus.PENDING_DELIVERY
          : DeliveryStatus.CANCELLED,
      deliveryDate: shipping.shippingMethod === ShippingMethod.LOCAL_DELIVERY ? new Date() : null,
      amountToCollect:
        effectivePaymentMethod === PaymentMethod.CASH_ON_DELIVERY ? total : 0,
      whatsappOptIn: input.whatsappOptIn,
      subtotal,
      discountAmount: shipping.discountAmount,
      shippingAmount: shipping.shippingAmount,
      total,
      notes: input.notes || null,
      internalQrUrl: buildInternalQrUrl(shortCode),
      internalQrImage: buildInternalQrImage(shortCode),
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          colorName: item.colorName,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      },
    },
    include: {
      customer: true,
      address: true,
      items: true,
    },
  })

  if (effectivePaymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
    await queuePrintJobForOrder(order.id)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/repartos')
  revalidatePath('/perfil')

  await sendOrderCreatedNotifications(order.id)

  return { order, shipping }
}

export async function getCustomerProfileByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return null
  }

  return prisma.customer.findUnique({
    where: { email: normalizedEmail },
    include: {
      addresses: {
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        include: {
          address: true,
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
              exchangeRequests: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export function buildWhatsAppOrderMessage(order: {
  shortCode?: string | null
  orderNumber: string
  status: string
  shippingMethod: string
}) {
  const base = order.shortCode ?? order.orderNumber
  return `Hola! Te escribimos por tu pedido ${base} de Patagónicos. Estado actual: ${getOrderStateLabel(order.status)}. Método de entrega: ${getShippingMethodLabel(order.shippingMethod)}.`
}

export function getProfileSavedMessage(saved?: string) {
  switch (saved) {
    case 'created':
      return 'Compra confirmada. Tu pedido ya está disponible en tu cuenta.'
    case 'whatsapp':
      return 'Actualizamos tus notificaciones de WhatsApp.'
    case 'exchange-requested':
      return 'Registramos tu solicitud de cambio. La revisamos y te contactamos con los próximos pasos.'
    default:
      return undefined
  }
}

export async function getAdminFulfillmentSnapshot() {
  await ensureStoreSettings()

  try {
    const [orders, printJobs, settings] = await Promise.all([
      prisma.order.findMany({
        include: {
          customer: true,
          address: true,
          items: true,
          printJobs: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.printJob.findMany({
        include: {
          order: {
            include: {
              customer: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.storeSettings.findUniqueOrThrow({
        where: { id: 'default' },
      }),
    ])

    return { orders, printJobs, settings }
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error
    }

    const [orders, printJobs, settings] = await Promise.all([
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          shortCode: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          shippingMethod: true,
          shippingStatus: true,
          carrier: true,
          trackingNumber: true,
          whatsappOptIn: true,
          subtotal: true,
          discountAmount: true,
          shippingAmount: true,
          total: true,
          notes: true,
          internalQrUrl: true,
          internalQrImage: true,
          createdAt: true,
          updatedAt: true,
          customer: true,
          address: true,
          items: true,
          printJobs: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.printJob.findMany({
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              shortCode: true,
              customer: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.storeSettings.findUniqueOrThrow({
        where: { id: 'default' },
      }),
    ])

    return {
      orders: orders.map((order) => ({
        ...order,
        fulfillmentType: deriveLegacyFulfillmentType(order.shippingMethod),
        deliveryStatus: deriveLegacyDeliveryStatus(order.status),
        deliveryDate: order.createdAt,
        amountToCollect: deriveLegacyAmountToCollect(order),
        deliveryNotes: order.notes,
        discountAmount: 0,
        inRouteAt: null,
        deliveredAt: null,
        deliveryStops: [],
      })),
      printJobs,
      settings,
    }
  }
}

export async function getOrderForTicket(orderId: string) {
  try {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        address: true,
        items: {
          include: {
            product: {
              include: {
                variants: true,
              },
            },
            exchangeRequests: {
              include: {
                replacementOrder: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        printJobs: true,
        exchangeRequests: {
          include: {
            orderItem: true,
            replacementOrder: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        replacementExchangeRequests: {
          include: {
            order: true,
            orderItem: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  } catch (error) {
    if (!isMissingSchemaError(error)) {
      throw error
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        shortCode: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        shippingMethod: true,
        shippingStatus: true,
        carrier: true,
        trackingNumber: true,
        whatsappOptIn: true,
        subtotal: true,
        discountAmount: true,
        shippingAmount: true,
        total: true,
        notes: true,
        internalQrUrl: true,
        internalQrImage: true,
        createdAt: true,
        updatedAt: true,
        customer: true,
        address: true,
        items: true,
        printJobs: true,
      },
    })

    if (!order) {
      return null
    }

    return {
      ...order,
      fulfillmentType: deriveLegacyFulfillmentType(order.shippingMethod),
      deliveryStatus: deriveLegacyDeliveryStatus(order.status),
      deliveryDate: order.createdAt,
      amountToCollect: deriveLegacyAmountToCollect(order),
      deliveryNotes: order.notes,
      discountAmount: 0,
      inRouteAt: null,
      deliveredAt: null,
      deliveryStops: [],
      exchangeRequests: [],
      replacementExchangeRequests: [],
    }
  }
}

export function renderTicketHtml(order: {
  id: string
  orderNumber: string
  shortCode?: string | null
  internalQrImage?: string | null
  status: string
  subtotal: number
  discountAmount?: number
  shippingAmount: number
  total: number
  notes?: string | null
  shippingMethod: string
  paymentMethod: string
  paymentStatus: string
  deliveryStatus?: string | null
  amountToCollect?: number | null
  customer: {
    fullName?: string | null
    email: string
    phone?: string | null
  }
  address: {
    line1: string
    city: string
    province: string
    postalCode: string
  } | null
  items: Array<{
    id: string
    productName: string
    colorName: string
    size: string
    quantity: number
    totalPrice: number
  }>
  printJobs: Array<{
    id: string
  }>
}) {
  const addressLine = order.address
    ? [order.address.line1, order.address.city, order.address.province, order.address.postalCode].filter(Boolean).join(', ')
    : 'Sin dirección'

  const itemsMarkup = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;">
            <div style="font-weight:600;">${item.productName}</div>
            <div style="font-size:11px;color:#666;">${item.colorName} · ${item.size} · x${item.quantity}</div>
          </td>
          <td style="padding:6px 0;border-bottom:1px solid #e5e5e5;text-align:right;">${formatPrice(item.totalPrice)}</td>
        </tr>
      `,
    )
    .join('')

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Ticket ${order.shortCode ?? order.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; color: #111; background: #fff; }
        .ticket { width: 100mm; min-height: 150mm; padding: 10mm; box-sizing: border-box; }
        .muted { color: #666; font-size: 11px; }
        .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #666; }
        .value { font-size: 14px; font-weight: 600; }
        .section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="label">Patagónicos</div>
        <h1 style="margin:8px 0 4px;font-size:28px;">${order.shortCode ?? order.orderNumber}</h1>
        <div class="muted">${order.orderNumber}</div>
        ${
          order.internalQrImage
            ? `<div style="margin-top:12px;"><img src="${order.internalQrImage}" alt="QR interno" style="width:34mm;height:34mm;" /></div>`
            : ''
        }

        <div class="section">
          <div class="label">Pedido interno</div>
          <div class="value">ID ${order.id}</div>
          <div class="muted">Estado reparto: ${getOrderStateLabel(order.deliveryStatus ?? order.status)}</div>
        </div>

        <div class="section">
          <div class="label">Cliente</div>
          <div class="value">${order.customer.fullName ?? order.customer.email}</div>
          <div class="muted">${order.customer.phone ?? 'Sin teléfono'}</div>
          <div class="muted">${addressLine}</div>
        </div>

        <div class="section">
          <div class="label">Entrega</div>
          <div class="value">${getShippingMethodLabel(order.shippingMethod)}</div>
          <div class="muted">Pago: ${getOrderStateLabel(order.paymentMethod)}</div>
          <div class="muted">Estado pago: ${getOrderStateLabel(order.paymentStatus)}</div>
          <div class="muted">Cobrar al entregar: ${formatPrice(order.amountToCollect ?? 0)}</div>
        </div>

        <div class="section">
          <div class="label">Productos</div>
          <table>${itemsMarkup}</table>
        </div>

        <div class="section">
          <div style="display:flex;justify-content:space-between;"><span class="muted">Subtotal</span><strong>${formatPrice(order.subtotal)}</strong></div>
          ${
            order.discountAmount && order.discountAmount > 0
              ? `<div style="display:flex;justify-content:space-between;"><span class="muted">Descuento Bariloche</span><strong style="color:#15803d;">-${formatPrice(order.discountAmount)}</strong></div>`
              : ''
          }
          <div style="display:flex;justify-content:space-between;"><span class="muted">Envío</span><strong>${formatPrice(order.shippingAmount)}</strong></div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:18px;"><span>Total</span><strong>${formatPrice(order.total)}</strong></div>
        </div>

        ${order.notes ? `<div class="section"><div class="label">Notas</div><div class="muted">${order.notes}</div></div>` : ''}
      </div>
    </body>
  </html>`
}
