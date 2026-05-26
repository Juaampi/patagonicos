'use server'

import { DeliveryStatus, OrderStatus, PrintJobStatus, ShippingStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getOrderWhatsAppDeliveryInfo, updateDeliveryState } from '@/lib/server/delivery'
import { queuePrintJobForOrder, syncApprovedPayment } from '@/lib/server/fulfillment'

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
  revalidateAdminPaths(orderId)
  return getOrderWhatsAppDeliveryInfo(orderId)
}

export async function markDeliveryDeliveredAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.DELIVERED)
  revalidateAdminPaths(orderId)
  return { success: true }
}

export async function markDeliveryRescheduledAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.RESCHEDULED)
  revalidateAdminPaths(orderId)
  return { success: true }
}

export async function markDeliveryFailedAction(orderId: string) {
  if (!orderId) {
    return { error: 'Pedido invalido.' }
  }

  await updateDeliveryState(orderId, DeliveryStatus.FAILED_DELIVERY)
  revalidateAdminPaths(orderId)
  return { success: true }
}
