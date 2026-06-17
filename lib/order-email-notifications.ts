import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { env } from '@/lib/env'
import { formatPrice } from '@/lib/utils'

type OrderEmailRecord = NonNullable<Awaited<ReturnType<typeof getOrderEmailRecord>>>
type ExchangeEmailRecord = NonNullable<Awaited<ReturnType<typeof getExchangeEmailRecord>>>
type ProfileOrderLike = {
  id: string
  customer: {
    email: string
  }
}
type TrackingOrderLike = ProfileOrderLike & {
  trackingNumber?: string | null
}

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
      replacementExchangeRequests: {
        include: {
          order: {
            include: {
              customer: true,
              items: true,
              address: true,
            },
          },
          orderItem: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

async function getExchangeEmailRecord(exchangeRequestId: string) {
  return prisma.exchangeRequest.findUnique({
    where: { id: exchangeRequestId },
    include: {
      order: {
        include: {
          customer: true,
          address: true,
          items: true,
        },
      },
      orderItem: true,
      replacementOrder: {
        include: {
          customer: true,
          address: true,
          items: true,
        },
      },
    },
  })
}

function buildProfileUrl(order: ProfileOrderLike) {
  return `${env.SITE_URL}/perfil?email=${encodeURIComponent(order.customer.email)}&saved=created&order=${encodeURIComponent(order.id)}`
}

function buildTrackingUrl(order: TrackingOrderLike) {
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

function buildExchangeSummaryMarkup(exchangeRequest: ExchangeEmailRecord) {
  return `
    <div style="margin-top:18px;padding:18px;border-radius:22px;background:#f8fafc;border:1px solid #e5e7eb;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.16em;color:#6b7280;">Cambio solicitado</div>
      <div style="margin-top:8px;font-size:20px;font-weight:700;color:#111827;">${exchangeRequest.orderItem.productName}</div>
      <div style="margin-top:8px;color:#4b5563;">${exchangeRequest.orderItem.colorName} · Talle actual ${exchangeRequest.currentSize} · Nuevo talle ${exchangeRequest.requestedSize}</div>
      <div style="margin-top:10px;color:#111827;font-weight:600;">Pedido original: ${exchangeRequest.order.shortCode ?? exchangeRequest.order.orderNumber}</div>
      ${
        exchangeRequest.replacementOrder
          ? `<div style="margin-top:8px;color:#111827;font-weight:600;">Pedido de recambio: ${exchangeRequest.replacementOrder.shortCode ?? exchangeRequest.replacementOrder.orderNumber}</div>`
          : ''
      }
    </div>
  `
}

function buildExchangeStatusSubject(prefix: string, exchangeRequest: ExchangeEmailRecord) {
  return `${prefix}: ${exchangeRequest.orderItem.productName} · ${exchangeRequest.currentSize} por ${exchangeRequest.requestedSize}`
}

function buildCustomerExchangeRequestedHtml(exchangeRequest: ExchangeEmailRecord) {
  return buildEmailShell(
    'Tu pedido de cambio fue confirmado',
    'Cambio registrado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hola ${exchangeRequest.order.customer.fullName ?? ''}, registramos tu solicitud de cambio por talle.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Tu pedido original quedó marcado como <strong>en cambio</strong>. Cuando despaches la prenda original, confirmalo desde tu panel para que podamos avanzar con el recambio.</p>
      ${buildExchangeSummaryMarkup(exchangeRequest)}
      <div style="margin-top:24px;">
        <a href="${buildProfileUrl(exchangeRequest.order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Ver mi cambio</a>
      </div>
    `,
  )
}

function buildAdminExchangeRequestedHtml(exchangeRequest: ExchangeEmailRecord) {
  return buildEmailShell(
    'Nuevo pedido de cambio',
    'Cambio solicitado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>${exchangeRequest.order.customer.fullName ?? exchangeRequest.order.customer.email}</strong> solicitó un cambio de talle.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">El pedido quedó en seguimiento de cambio y todavía falta la confirmación del cliente de que ya despachó la prenda original.</p>
      ${buildExchangeSummaryMarkup(exchangeRequest)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${exchangeRequest.orderId}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir pedido original</a>
      </div>
    `,
  )
}

function buildCustomerExchangeShipmentConfirmedHtml(exchangeRequest: ExchangeEmailRecord) {
  return buildEmailShell(
    'Recibimos la confirmación de tu envío',
    'Cambio en proceso',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hola ${exchangeRequest.order.customer.fullName ?? ''}, ya vimos que confirmaste el despacho de la prenda que querés cambiar.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Ahora nuestro equipo puede revisar el cambio y preparar el nuevo pedido de recambio cuando corresponda.</p>
      ${buildExchangeSummaryMarkup(exchangeRequest)}
      <div style="margin-top:24px;">
        <a href="${buildProfileUrl(exchangeRequest.order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Seguir mi cambio</a>
      </div>
    `,
  )
}

function buildAdminExchangeShipmentConfirmedHtml(exchangeRequest: ExchangeEmailRecord) {
  return buildEmailShell(
    'El cliente confirmó el envío de su cambio',
    'Listo para procesar',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">${exchangeRequest.order.customer.fullName ?? exchangeRequest.order.customer.email} ya confirmó que despachó la prenda original.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Desde el admin ya podés generar el pedido nuevo de recambio para avanzar con el envío.</p>
      ${buildExchangeSummaryMarkup(exchangeRequest)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${exchangeRequest.orderId}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Procesar cambio</a>
      </div>
    `,
  )
}

function buildCustomerReplacementCreatedHtml(exchangeRequest: ExchangeEmailRecord) {
  const replacementOrder = exchangeRequest.replacementOrder
  if (!replacementOrder) {
    return ''
  }

  return buildEmailShell(
    'Tu pedido de recambio ya fue generado',
    'Recambio creado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hola ${exchangeRequest.order.customer.fullName ?? ''}, ya generamos el nuevo pedido de recambio para tu cambio de talle.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">A partir de ahora ese pedido entra al circuito normal de preparación y envío para que puedas seguirlo por separado.</p>
      ${buildExchangeSummaryMarkup(exchangeRequest)}
      <div style="margin-top:24px;">
        <a href="${buildProfileUrl(replacementOrder)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Ver pedido de recambio</a>
      </div>
    `,
  )
}

function buildAdminReplacementCreatedHtml(exchangeRequest: ExchangeEmailRecord) {
  const replacementOrder = exchangeRequest.replacementOrder
  if (!replacementOrder) {
    return ''
  }

  return buildEmailShell(
    'Se generó un pedido de recambio',
    'Nuevo pedido de cambio',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Ya quedó creado el pedido de recambio para ${exchangeRequest.order.customer.fullName ?? exchangeRequest.order.customer.email}.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Pedido original: <strong>${exchangeRequest.order.shortCode ?? exchangeRequest.order.orderNumber}</strong> · Pedido de recambio: <strong>${replacementOrder.shortCode ?? replacementOrder.orderNumber}</strong>.</p>
      ${buildExchangeSummaryMarkup(exchangeRequest)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${replacementOrder.id}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir pedido de recambio</a>
      </div>
    `,
  )
}

function buildCustomerReplacementShippedHtml(order: OrderEmailRecord) {
  const exchangeRequest = order.replacementExchangeRequests[0]
  const originalOrder = exchangeRequest?.order
  const originalLabel = originalOrder ? originalOrder.shortCode ?? originalOrder.orderNumber : 'tu pedido original'

  return buildEmailShell(
    `Despachamos tu recambio ${order.shortCode ?? order.orderNumber}`,
    'Cambio despachado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hola ${order.customer.fullName ?? ''}, ya despachamos el pedido de recambio generado por el cambio de talle de <strong>${originalLabel}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Este mail corresponde a un <strong>despacho de cambio</strong>, no a un envío normal. Podés seguirlo con el mismo panel y tracking.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Tracking: <strong>${order.trackingNumber ?? 'Sin tracking'}</strong>.</p>
      ${buildOrderSummaryMarkup(order)}
      <div style="margin-top:24px;">
        <a href="${buildTrackingUrl(order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Seguir recambio</a>
      </div>
    `,
  )
}

function buildAdminReplacementShippedHtml(order: OrderEmailRecord) {
  const exchangeRequest = order.replacementExchangeRequests[0]
  const originalOrder = exchangeRequest?.order

  return buildEmailShell(
    'Se despachó un pedido de recambio',
    'Recambio despachado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Se despachó un pedido de cambio para <strong>${order.customer.fullName ?? order.customer.email}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Pedido de recambio: <strong>${order.shortCode ?? order.orderNumber}</strong>${originalOrder ? ` · Pedido original: <strong>${originalOrder.shortCode ?? originalOrder.orderNumber}</strong>` : ''}.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Tracking: <strong>${order.trackingNumber ?? 'Sin tracking'}</strong>.</p>
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${order.id}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir recambio</a>
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

  if (order.replacementExchangeRequests[0] && order.status === 'SHIPPED') {
    await Promise.all([
      sendSafeEmail({
        to: order.customer.email,
        subject: `Despacho de cambio: ${order.shortCode ?? order.orderNumber}`,
        html: buildCustomerReplacementShippedHtml(order),
      }),
      sendSafeEmail({
        to: env.ADMIN_EMAIL,
        subject: `[ADMIN] Recambio despachado - ${order.shortCode ?? order.orderNumber}`,
        html: buildAdminReplacementShippedHtml(order),
      }),
    ])
    return
  }

  await sendSafeEmail({
    to: order.customer.email,
    subject: `Estado actualizado: ${order.shortCode ?? order.orderNumber}`,
    html: buildCustomerStatusHtml(order),
  })
}

export async function sendExchangeRequestCreatedNotifications(exchangeRequestId: string) {
  const exchangeRequest = await getExchangeEmailRecord(exchangeRequestId)

  if (!exchangeRequest) {
    return
  }

  await Promise.all([
    sendSafeEmail({
      to: exchangeRequest.order.customer.email,
      subject: buildExchangeStatusSubject('Cambio confirmado', exchangeRequest),
      html: buildCustomerExchangeRequestedHtml(exchangeRequest),
    }),
    sendSafeEmail({
      to: env.ADMIN_EMAIL,
      subject: `[ADMIN] Nuevo cambio - ${exchangeRequest.order.customer.fullName ?? exchangeRequest.order.customer.email}`,
      html: buildAdminExchangeRequestedHtml(exchangeRequest),
    }),
  ])
}

export async function sendExchangeShipmentConfirmedNotifications(exchangeRequestId: string) {
  const exchangeRequest = await getExchangeEmailRecord(exchangeRequestId)

  if (!exchangeRequest) {
    return
  }

  await Promise.all([
    sendSafeEmail({
      to: exchangeRequest.order.customer.email,
      subject: buildExchangeStatusSubject('Confirmación de envío recibida', exchangeRequest),
      html: buildCustomerExchangeShipmentConfirmedHtml(exchangeRequest),
    }),
    sendSafeEmail({
      to: env.ADMIN_EMAIL,
      subject: `[ADMIN] Cliente confirmó envío de cambio - ${exchangeRequest.order.customer.fullName ?? exchangeRequest.order.customer.email}`,
      html: buildAdminExchangeShipmentConfirmedHtml(exchangeRequest),
    }),
  ])
}

export async function sendReplacementOrderCreatedNotifications(exchangeRequestId: string) {
  const exchangeRequest = await getExchangeEmailRecord(exchangeRequestId)

  if (!exchangeRequest?.replacementOrder) {
    return
  }

  await Promise.all([
    sendSafeEmail({
      to: exchangeRequest.order.customer.email,
      subject: buildExchangeStatusSubject('Pedido de recambio generado', exchangeRequest),
      html: buildCustomerReplacementCreatedHtml(exchangeRequest),
    }),
    sendSafeEmail({
      to: env.ADMIN_EMAIL,
      subject: `[ADMIN] Pedido de recambio creado - ${exchangeRequest.replacementOrder.shortCode ?? exchangeRequest.replacementOrder.orderNumber}`,
      html: buildAdminReplacementCreatedHtml(exchangeRequest),
    }),
  ])
}
