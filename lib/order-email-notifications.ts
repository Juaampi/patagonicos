import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { env } from '@/lib/env'
import { formatPrice } from '@/lib/utils'

type OrderEmailRecord = NonNullable<Awaited<ReturnType<typeof getOrderEmailRecord>>>

function getOrderStateLabel(status: string) {
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
    EN_PREPARACION: 'En preparación',
    DESPACHADO: 'Despachado',
    EN_TRANSITO: 'En tránsito',
    EN_SUCURSAL: 'En sucursal',
    INCIDENCIA: 'Con incidencia',
  }

  return labels[status] ?? status
}

function getShippingMethodLabel(method: string) {
  const labels: Record<string, string> = {
    LOCAL_DELIVERY: 'Entrega local',
    BARILOCHE_SAME_DAY: 'Entrega en el día',
    NATIONAL_SHIPPING: 'Envío nacional',
    NATIONAL: 'Envío nacional',
  }

  return labels[method] ?? method
}

function buildItemsMarkup(order: OrderEmailRecord) {
  return order.items
    .map((item) => {
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
          <div style="font-weight:600;color:#111827;">${item.productName}</div>
          <div style="font-size:12px;color:#6b7280;">${item.colorName} · ${item.size} · x${item.quantity}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#111827;">${formatPrice(item.totalPrice)}</td>
      </tr>`
    })
    .join('')
}

function buildOrderSummaryMarkup(order: OrderEmailRecord) {
  return `
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      ${buildItemsMarkup(order)}
      <tr>
        <td style="padding-top:14px;color:#6b7280;">Subtotal</td>
        <td style="padding-top:14px;text-align:right;font-weight:600;">${formatPrice(order.subtotal)}</td>
      </tr>
      ${
        order.discountAmount > 0
          ? `<tr>
              <td style="padding-top:8px;color:#15803d;">Descuento</td>
              <td style="padding-top:8px;text-align:right;font-weight:600;color:#15803d;">-${formatPrice(order.discountAmount)}</td>
            </tr>`
          : ''
      }
      <tr>
        <td style="padding-top:8px;color:#6b7280;">Envío</td>
        <td style="padding-top:8px;text-align:right;font-weight:600;">${formatPrice(order.shippingAmount)}</td>
      </tr>
      <tr>
        <td style="padding-top:12px;border-top:1px solid #d1d5db;font-size:16px;font-weight:700;color:#111827;">Total</td>
        <td style="padding-top:12px;border-top:1px solid #d1d5db;text-align:right;font-size:16px;font-weight:700;color:#111827;">${formatPrice(order.total)}</td>
      </tr>
    </table>
  `
}

function buildEmailShell(title: string, eyebrow: string, body: string) {
  const logoUrl = `${env.SITE_URL}/brand-logo-tight.png`

  return `<!DOCTYPE html>
  <html lang="es">
    <body style="margin:0;background:#f3f5f2;padding:24px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:28px;overflow:hidden;">
        <div style="padding:32px;background:linear-gradient(135deg,#111827 0%,#1f2937 100%);color:#ffffff;">
          <div style="display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:18px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);">
            <img src="${logoUrl}" alt="Patagonicos" width="186" height="38" style="display:block;max-width:186px;height:auto;" />
          </div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.72);">${eyebrow}</div>
          <h1 style="margin:16px 0 0;font-size:34px;line-height:1.05;">${title}</h1>
        </div>
        <div style="padding:28px 32px;">
          ${body}
        </div>
      </div>
    </body>
  </html>`
}

async function getOrderEmailRecord(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      address: true,
      items: true,
    },
  })
}

function buildProfileUrl(order: OrderEmailRecord) {
  return `${env.SITE_URL}/perfil?email=${encodeURIComponent(order.customer.email)}&saved=created&order=${encodeURIComponent(order.id)}`
}

function buildTrackingUrl(order: OrderEmailRecord) {
  if (order.trackingNumber?.trim()) {
    return `${env.SITE_URL}/seguimiento?code=${encodeURIComponent(order.trackingNumber.trim())}`
  }

  return buildProfileUrl(order)
}

function buildCustomerOrderCreatedHtml(order: OrderEmailRecord) {
  return buildEmailShell(
    'Recibimos tu compra',
    'Pedido recibido',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hola ${order.customer.fullName ?? ''}, ya registramos tu pedido <strong>${order.shortCode ?? order.orderNumber}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Estado actual: <strong>${getOrderStateLabel(order.paymentStatus)}</strong>. Método de entrega: <strong>${getShippingMethodLabel(order.shippingMethod)}</strong>.</p>
      <div style="margin-top:18px;padding:18px;border-radius:22px;background:#f8fafc;border:1px solid #e5e7eb;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#6b7280;">Pedido</div>
        <div style="margin-top:6px;font-size:24px;font-weight:700;">${order.shortCode ?? order.orderNumber}</div>
        <div style="margin-top:8px;color:#4b5563;">${order.orderNumber}</div>
      </div>
      ${buildOrderSummaryMarkup(order)}
      <div style="margin-top:24px;">
        <a href="${buildProfileUrl(order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Ver mi pedido</a>
      </div>
    `,
  )
}

function buildAdminOrderCreatedHtml(order: OrderEmailRecord) {
  return buildEmailShell(
    'Nueva venta registrada',
    'Venta nueva',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>${order.customer.fullName ?? order.customer.email}</strong> realizó una compra.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Pedido: <strong>${order.shortCode ?? order.orderNumber}</strong> · Estado del pedido: <strong>${getOrderStateLabel(order.status)}</strong> · Estado del pago: <strong>${getOrderStateLabel(order.paymentStatus)}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Email: ${order.customer.email}${order.customer.phone ? ` · Teléfono: ${order.customer.phone}` : ''}</p>
      ${
        order.address
          ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Entrega: ${[order.address.line1, order.address.city, order.address.province, order.address.postalCode].filter(Boolean).join(', ')}</p>`
          : ''
      }
      ${buildOrderSummaryMarkup(order)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${order.id}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir pedido</a>
      </div>
    `,
  )
}

function buildCustomerStatusHtml(order: OrderEmailRecord) {
  const trackingBlock = order.trackingNumber
    ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Tracking: <strong>${order.trackingNumber}</strong>.</p>`
    : ''

  return buildEmailShell(
    `Actualización de tu pedido ${order.shortCode ?? order.orderNumber}`,
    'Estado actualizado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hola ${order.customer.fullName ?? ''}, te avisamos que cambió el estado de tu pedido.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Estado del pedido: <strong>${getOrderStateLabel(order.status)}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Estado del envío: <strong>${getOrderStateLabel(order.shippingStatus)}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Estado del pago: <strong>${getOrderStateLabel(order.paymentStatus)}</strong>.</p>
      ${trackingBlock}
      <div style="margin-top:24px;">
        <a href="${buildTrackingUrl(order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Ver seguimiento</a>
      </div>
    `,
  )
}

async function sendSafeEmail(input: { to: string; subject: string; html: string }) {
  try {
    const result = await sendEmail(input)
    console.info('[order-email]', { to: input.to, subject: input.subject, result })
  } catch (error) {
    console.error('Email notification failed', error)
  }
}

export async function sendOrderCreatedNotifications(orderId: string) {
  const order = await getOrderEmailRecord(orderId)

  if (!order) {
    return
  }

  await Promise.all([
    sendSafeEmail({
      to: order.customer.email,
      subject: `Recibimos tu pedido ${order.shortCode ?? order.orderNumber}`,
      html: buildCustomerOrderCreatedHtml(order),
    }),
    sendSafeEmail({
      to: env.ADMIN_EMAIL,
      subject: `[ADMIN] Nueva venta - ${order.shortCode ?? order.orderNumber} - ${order.customer.fullName ?? order.customer.email}`,
      html: buildAdminOrderCreatedHtml(order),
    }),
  ])
}

export async function sendOrderPaidNotification(orderId: string) {
  const order = await getOrderEmailRecord(orderId)

  if (!order) {
    return
  }

  await sendSafeEmail({
    to: order.customer.email,
    subject: `Pago confirmado: ${order.shortCode ?? order.orderNumber}`,
    html: buildCustomerStatusHtml(order),
  })
}

export async function sendOrderStatusChangedNotification(orderId: string) {
  const order = await getOrderEmailRecord(orderId)

  if (!order) {
    return
  }

  await sendSafeEmail({
    to: order.customer.email,
    subject: `Estado actualizado: ${order.shortCode ?? order.orderNumber}`,
    html: buildCustomerStatusHtml(order),
  })
}
