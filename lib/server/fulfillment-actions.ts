'use server'

import { DeliveryStatus, ExchangeRequestStatus, OrderStatus, PaymentStatus, PrintJobStatus, ShippingStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  sendExchangeRequestCreatedNotifications,
  sendExchangeShipmentConfirmedNotifications,
  sendOrderStatusChangedNotification,
  sendReplacementOrderCreatedNotifications,
} from '@/lib/order-email-notifications'
import { prisma } from '@/lib/prisma'
import { getOrderWhatsAppDeliveryInfo, updateDeliveryState } from '@/lib/server/delivery'
import { generateOrderNumber, generateShortCode, queuePrintJobForOrder, syncApprovedPayment } from '@/lib/server/fulfillment'

function revalidateAdminPaths(orderId?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/pedidos')
  revalidatePath('/admin/envios')
  revalidatePath('/admin/repartos')

  if (orderId) {
    revalidatePath(`/admin/pedidos/${orderId}`)
  }
}

export type UpdateStoreSettingsState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

function readIntField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? '').trim()
  const value = Number(raw)

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Valor inválido para ${key}.`)
  }

  return value
}

export async function updateStoreSettingsAction(
  _previousState: UpdateStoreSettingsState,
  formData: FormData,
): Promise<UpdateStoreSettingsState> {
  try {
    await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        localDeliveryFreeThreshold: readIntField(formData, 'localDeliveryFreeThreshold'),
        localDeliveryCost: readIntField(formData, 'localDeliveryCost'),
        nationalShippingCost: readIntField(formData, 'nationalShippingCost'),
        barilocheCutoffHour: readIntField(formData, 'barilocheCutoffHour'),
        barilocheCutoffMinute: readIntField(formData, 'barilocheCutoffMinute'),
        barilocheDiscountPercent: readIntField(formData, 'barilocheDiscountPercent'),
        barilocheEnabled: formData.get('barilocheEnabled') === 'on',
      },
      create: {
        id: 'default',
        localDeliveryFreeThreshold: readIntField(formData, 'localDeliveryFreeThreshold'),
        localDeliveryCost: readIntField(formData, 'localDeliveryCost'),
        nationalShippingCost: readIntField(formData, 'nationalShippingCost'),
        barilocheCutoffHour: readIntField(formData, 'barilocheCutoffHour'),
        barilocheCutoffMinute: readIntField(formData, 'barilocheCutoffMinute'),
        barilocheDiscountPercent: readIntField(formData, 'barilocheDiscountPercent'),
        barilocheEnabled: formData.get('barilocheEnabled') === 'on',
      },
    })
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'No pudimos guardar la configuración.',
    }
  }

  revalidatePath('/')
  revalidatePath('/carrito')
  revalidatePath('/envios')
  revalidatePath('/admin')
  revalidatePath('/admin/configuracion')
  revalidatePath('/productos')

  return {
    status: 'success',
    message: 'Configuración guardada.',
  }
}

export async function updateOrderStatusAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '').trim()
  const nextStatus = String(formData.get('nextStatus') ?? '').trim() as OrderStatus

  if (!orderId || !nextStatus) {
    throw new Error('Orden o estado inválido.')
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      shippingStatus:
        nextStatus === OrderStatus.DELIVERED
          ? ShippingStatus.ENTREGADO
          : nextStatus === OrderStatus.SHIPPED
            ? ShippingStatus.DESPACHADO
            : nextStatus === OrderStatus.OUT_FOR_DELIVERY
              ? ShippingStatus.EN_TRANSITO
            : undefined,
      deliveryStatus:
        nextStatus === OrderStatus.DELIVERED
          ? DeliveryStatus.DELIVERED
          : nextStatus === OrderStatus.OUT_FOR_DELIVERY
            ? DeliveryStatus.IN_ROUTE
            : nextStatus === OrderStatus.READY_FOR_LOCAL_DELIVERY
              ? DeliveryStatus.PENDING_DELIVERY
              : undefined,
      deliveredAt: nextStatus === OrderStatus.DELIVERED ? new Date() : undefined,
      inRouteAt: nextStatus === OrderStatus.OUT_FOR_DELIVERY ? new Date() : undefined,
    },
  })

  if (nextStatus === OrderStatus.READY_FOR_LOCAL_DELIVERY || nextStatus === OrderStatus.READY_FOR_NATIONAL_SHIPPING) {
    await queuePrintJobForOrder(order.id)
  }

  await sendOrderStatusChangedNotification(order.id)
  revalidateAdminPaths(order.id)
}

export async function updatePrintJobStatusAction(formData: FormData) {
  const jobId = String(formData.get('jobId') ?? '').trim()
  const nextStatus = String(formData.get('nextStatus') ?? '').trim() as PrintJobStatus

  if (!jobId || !nextStatus) {
    throw new Error('Print job inválido.')
  }

  await prisma.printJob.update({
    where: { id: jobId },
    data: {
      status: nextStatus,
      printedAt: nextStatus === PrintJobStatus.PRINTED ? new Date() : null,
    },
  })

  revalidateAdminPaths()
}

export async function markOrderPaidAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '').trim()
  if (!orderId) {
    throw new Error('Orden inválida.')
  }

  await syncApprovedPayment(orderId)
  revalidateAdminPaths(orderId)
}

export async function markOrderShippedWithTrackingAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '').trim()
  const trackingNumber = String(formData.get('trackingNumber') ?? '').trim()

  if (!orderId || !trackingNumber) {
    throw new Error('Orden o tracking inválido.')
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.SHIPPED,
      shippingStatus: ShippingStatus.DESPACHADO,
      carrier: 'Andreani',
      trackingNumber,
    },
  })

  await sendOrderStatusChangedNotification(orderId)
  revalidatePath('/perfil')
  revalidatePath('/seguimiento')
  revalidateAdminPaths(orderId)
}

export async function updateCustomerWhatsappOptInAction(formData: FormData) {
  const customerId = String(formData.get('customerId') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const enabled = String(formData.get('enabled') ?? 'false').trim() === 'true'
  const orderId = String(formData.get('orderId') ?? '').trim()

  if (!customerId || !email) {
    throw new Error('Cliente inválido.')
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      whatsappOptIn: enabled,
    },
  })

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        whatsappOptIn: enabled,
      },
    })
  }

  revalidatePath('/perfil')
  revalidateAdminPaths(orderId || undefined)
  redirect(`/perfil?email=${encodeURIComponent(email)}&saved=whatsapp`)
}

export async function createExchangeRequestAction(formData: FormData) {
  const orderId = String(formData.get('orderId') ?? '').trim()
  const orderItemId = String(formData.get('orderItemId') ?? '').trim()
  const requestedSize = String(formData.get('requestedSize') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!orderId || !orderItemId || !requestedSize || !email) {
    throw new Error('Datos incompletos para solicitar el cambio.')
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      customer: {
        email,
      },
    },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              variants: true,
            },
          },
          exchangeRequests: {
            where: {
              status: {
                in: [ExchangeRequestStatus.REQUESTED, ExchangeRequestStatus.CUSTOMER_SHIPMENT_CONFIRMED, ExchangeRequestStatus.REPLACEMENT_CREATED],
              },
            },
          },
        },
      },
    },
  })

  if (!order) {
    throw new Error('No encontramos el pedido para solicitar el cambio.')
  }

  const delivered = order.status === OrderStatus.DELIVERED || order.status === OrderStatus.ENTREGADO
  if (!delivered) {
    throw new Error('El cambio solo puede pedirse cuando el pedido ya figura como entregado.')
  }

  const deliveredAt = order.deliveredAt ?? order.updatedAt
  if (Date.now() - deliveredAt.getTime() > 48 * 60 * 60 * 1000) {
    throw new Error('La ventana para pedir cambio venció. Solo se acepta dentro de las 48 hs de recibido el producto.')
  }

  const orderItem = order.items.find((item) => item.id === orderItemId)

  if (!orderItem) {
    throw new Error('No encontramos la prenda que querés cambiar.')
  }

  if (orderItem.size === requestedSize) {
    throw new Error('Elegí un talle distinto para solicitar el cambio.')
  }

  if (orderItem.exchangeRequests.length > 0) {
    throw new Error('Esta prenda ya tiene una solicitud de cambio abierta.')
  }

  const variantExists = orderItem.product.variants.some(
    (variant) => variant.colorName === orderItem.colorName && variant.size === requestedSize,
  )

  if (!variantExists) {
    throw new Error('Ese talle no está disponible para la misma prenda y color.')
  }

  const exchangeRequest = await prisma.exchangeRequest.create({
    data: {
      orderId: order.id,
      orderItemId: orderItem.id,
      currentSize: orderItem.size,
      requestedSize,
      status: ExchangeRequestStatus.REQUESTED,
    },
  })

  await sendExchangeRequestCreatedNotifications(exchangeRequest.id)
  revalidatePath('/perfil')
  revalidateAdminPaths(orderId)
  redirect(`/perfil?email=${encodeURIComponent(email)}&saved=exchange-requested`)
}

export async function confirmExchangeShipmentAction(formData: FormData) {
  const exchangeRequestId = String(formData.get('exchangeRequestId') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!exchangeRequestId || !email) {
    throw new Error('No pudimos confirmar el envío de la prenda.')
  }

  const exchangeRequest = await prisma.exchangeRequest.findFirst({
    where: {
      id: exchangeRequestId,
      order: {
        customer: {
          email,
        },
      },
    },
    include: {
      order: true,
    },
  })

  if (!exchangeRequest) {
    throw new Error('No encontramos la solicitud de cambio.')
  }

  if (exchangeRequest.status !== ExchangeRequestStatus.REQUESTED) {
    throw new Error('Esta solicitud ya fue confirmada o procesada.')
  }

  await prisma.exchangeRequest.update({
    where: { id: exchangeRequest.id },
    data: {
      status: ExchangeRequestStatus.CUSTOMER_SHIPMENT_CONFIRMED,
      customerShipmentConfirmedAt: new Date(),
    },
  })

  await sendExchangeShipmentConfirmedNotifications(exchangeRequest.id)
  revalidatePath('/perfil')
  revalidateAdminPaths(exchangeRequest.orderId)
  redirect(`/perfil?email=${encodeURIComponent(email)}&saved=exchange-requested`)
}

export async function createReplacementOrderFromExchangeAction(formData: FormData) {
  const exchangeRequestId = String(formData.get('exchangeRequestId') ?? '').trim()

  if (!exchangeRequestId) {
    throw new Error('Solicitud de cambio inválida.')
  }

  const exchangeRequest = await prisma.exchangeRequest.findUnique({
    where: { id: exchangeRequestId },
    include: {
      order: {
        include: {
          customer: true,
          address: true,
        },
      },
      orderItem: {
        include: {
          product: {
            include: {
              variants: true,
            },
          },
        },
      },
      replacementOrder: true,
    },
  })

  if (!exchangeRequest) {
    throw new Error('No encontramos la solicitud de cambio.')
  }

  if (exchangeRequest.status !== ExchangeRequestStatus.CUSTOMER_SHIPMENT_CONFIRMED) {
    throw new Error('Todavía falta que el cliente confirme el envío de la prenda a cambiar.')
  }

  if (exchangeRequest.replacementOrderId) {
    throw new Error('Esta solicitud ya generó un pedido de recambio.')
  }

  const variantExists = exchangeRequest.orderItem.product.variants.some(
    (variant) =>
      variant.colorName === exchangeRequest.orderItem.colorName &&
      variant.size === exchangeRequest.requestedSize,
  )

  if (!variantExists) {
    throw new Error('El talle solicitado ya no está disponible para generar el recambio.')
  }

  const replacementOrder = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      shortCode: `${generateShortCode()}-C`,
      customerId: exchangeRequest.order.customerId,
      addressId: exchangeRequest.order.addressId,
      status:
        exchangeRequest.order.shippingMethod === 'LOCAL_DELIVERY'
          ? OrderStatus.READY_FOR_LOCAL_DELIVERY
          : OrderStatus.READY_FOR_NATIONAL_SHIPPING,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: exchangeRequest.order.paymentMethod,
      shippingMethod: exchangeRequest.order.shippingMethod,
      shippingStatus: ShippingStatus.EN_PREPARACION,
      whatsappOptIn: exchangeRequest.order.whatsappOptIn,
      subtotal: 0,
      discountAmount: 0,
      shippingAmount: 0,
      total: 0,
      notes: `Pedido de cambio generado desde ${exchangeRequest.order.shortCode ?? exchangeRequest.order.orderNumber}. Talle ${exchangeRequest.currentSize} por ${exchangeRequest.requestedSize}.`,
      mercadopagoRef: exchangeRequest.order.mercadopagoRef,
      carrier: exchangeRequest.order.carrier,
      fulfillmentType: exchangeRequest.order.fulfillmentType,
      deliveryStatus: exchangeRequest.order.deliveryStatus,
      deliveryDate: exchangeRequest.order.deliveryDate,
      amountToCollect: 0,
      items: {
        create: {
          productId: exchangeRequest.orderItem.productId,
          productName: exchangeRequest.orderItem.productName,
          colorName: exchangeRequest.orderItem.colorName,
          size: exchangeRequest.requestedSize,
          quantity: exchangeRequest.orderItem.quantity,
          unitPrice: 0,
          totalPrice: 0,
        },
      },
    },
  })

  await prisma.exchangeRequest.update({
    where: { id: exchangeRequest.id },
    data: {
      status: ExchangeRequestStatus.REPLACEMENT_CREATED,
      replacementOrderId: replacementOrder.id,
    },
  })

  await queuePrintJobForOrder(replacementOrder.id)
  await sendReplacementOrderCreatedNotifications(exchangeRequest.id)
  revalidatePath('/perfil')
  revalidateAdminPaths(exchangeRequest.orderId)
  revalidateAdminPaths(replacementOrder.id)
}

export async function sendDeliveryWhatsAppAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  return getOrderWhatsAppDeliveryInfo(orderId)
}

export async function markDeliveryInRouteAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.IN_ROUTE)
  await sendOrderStatusChangedNotification(orderId)
  revalidateAdminPaths(orderId)
  return getOrderWhatsAppDeliveryInfo(orderId)
}

export async function markDeliveryDeliveredAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.DELIVERED)
  await sendOrderStatusChangedNotification(orderId)
  revalidateAdminPaths(orderId)
  return { success: true }
}

export async function markDeliveryRescheduledAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.RESCHEDULED)
  await sendOrderStatusChangedNotification(orderId)
  revalidateAdminPaths(orderId)
  return { success: true }
}

export async function markDeliveryFailedAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.FAILED_DELIVERY)
  await sendOrderStatusChangedNotification(orderId)
  revalidateAdminPaths(orderId)
  return { success: true }
}
