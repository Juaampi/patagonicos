import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { env } from '@/lib/env'
import { getAndreaniTrackingUrl } from '@/lib/server/andreani'
import { TRANSFER_DISCOUNT_PERCENT, TRANSFER_PAYMENT_ALIAS } from '@/lib/store-settings'
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
    ONLINE: 'Pagado online',
    CASH_ON_DELIVERY: 'Contra entrega',
    TRANSFER: 'Transferencia',
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

function getEmailStatusTone(status: string) {
  if (status === 'PAID' || status === 'READY_FOR_LOCAL_DELIVERY' || status === 'READY_FOR_NATIONAL_SHIPPING') {
    return {
      background: '#dcfce7',
      text: '#166534',
      border: '#bbf7d0',
    }
  }

  if (status === 'PENDING' || status === 'PENDING_PAYMENT' || status === 'EN_PREPARACION') {
    return {
      background: '#fef3c7',
      text: '#92400e',
      border: '#fde68a',
    }
  }

  return {
    background: '#e5e7eb',
    text: '#111827',
    border: '#d1d5db',
  }
}

function buildEmailStatusBadge(label: string, status: string) {
  const tone = getEmailStatusTone(status)

  return `
    <span style="display:inline-block;padding:8px 12px;border-radius:999px;background:${tone.background};color:${tone.text};border:1px solid ${tone.border};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
      ${label}
    </span>
  `
}

function buildInfoCard(label: string, value: string, secondary?: string) {
  return `
    <td style="width:33.33%;padding:0 6px 12px;vertical-align:top;">
      <div style="height:100%;border:1px solid #e5e7eb;border-radius:20px;background:#f8fafc;padding:16px 16px 14px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">${label}</div>
        <div style="margin-top:8px;font-size:18px;line-height:1.25;font-weight:700;color:#111827;">${value}</div>
        ${secondary ? `<div style="margin-top:6px;font-size:13px;line-height:1.5;color:#4b5563;">${secondary}</div>` : ''}
      </div>
    </td>
  `
}

function buildItemsMarkup(order: OrderEmailRecord) {
  return order.items
    .map((item) => {
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:15px;font-weight:700;color:#111827;">${item.productName}</div>
          <div style="margin-top:6px;font-size:12px;color:#6b7280;">${item.colorName} · ${item.size} · x${item.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-size:15px;font-weight:700;color:#111827;">${formatPrice(item.totalPrice)}</td>
      </tr>`
    })
    .join('')
}

function buildOrderSummaryMarkup(order: OrderEmailRecord) {
  const discountLabel =
    order.paymentMethod === 'TRANSFER' && order.shippingMethod === 'LOCAL_DELIVERY'
      ? 'Descuentos aplicados'
      : order.paymentMethod === 'TRANSFER'
        ? `Descuento transferencia (${TRANSFER_DISCOUNT_PERCENT}%)`
        : order.shippingMethod === 'LOCAL_DELIVERY'
          ? 'Descuento Bariloche'
          : 'Descuento'

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
              <td style="padding-top:8px;color:#15803d;">${discountLabel}</td>
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

function buildTransferInstructionsMarkup(order: OrderEmailRecord, audience: 'customer' | 'admin' = 'customer') {
  if (order.paymentMethod !== 'TRANSFER') {
    return ''
  }

  return `
    <div style="margin-top:18px;border:1px solid #fcd34d;border-radius:24px;background:#fffbeb;padding:20px 22px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#92400e;">Pago por transferencia</div>
      <div style="margin-top:10px;font-size:15px;line-height:1.8;color:#78350f;">
        ${
          audience === 'customer'
            ? 'Tu pedido quedó <strong>pendiente de pago</strong>. Transferí el total a este alias:'
            : 'La orden quedó <strong>pendiente de pago</strong>. El cliente debe transferir el total a este alias:'
        }
      </div>
      <div style="margin-top:12px;font-size:28px;line-height:1;font-weight:700;letter-spacing:-0.04em;color:#111827;">${TRANSFER_PAYMENT_ALIAS}</div>
      <div style="margin-top:12px;font-size:14px;line-height:1.7;color:#92400e;">
        ${
          audience === 'customer'
            ? 'Apenas impacte la transferencia, actualizamos el estado del pedido y te avisamos por mail.'
            : 'Apenas impacte la transferencia, el pedido puede pasar a preparación.'
        }
      </div>
    </div>
  `
}

function getShipmentTimeline(order: OrderEmailRecord) {
  const paymentConfirmed = order.paymentStatus === 'PAID'
  const prepared =
    paymentConfirmed || ['EN_PREPARACION', 'DESPACHADO', 'EN_TRANSITO', 'EN_SUCURSAL', 'ENTREGADO'].includes(order.shippingStatus)
  const dispatched = ['DESPACHADO', 'EN_TRANSITO', 'EN_SUCURSAL', 'ENTREGADO'].includes(order.shippingStatus)
  const inTransit = ['EN_TRANSITO', 'EN_SUCURSAL', 'ENTREGADO'].includes(order.shippingStatus)
  const delivered = order.shippingStatus === 'ENTREGADO'

  return [
    {
      label: 'Pedido confirmado',
      description: paymentConfirmed ? 'El pago ya fue acreditado y el pedido quedó validado.' : 'Estamos esperando la confirmación del pago.',
      done: paymentConfirmed,
    },
    {
      label: 'Preparando paquete',
      description: prepared ? 'El pedido ya entró a preparación y embalaje.' : 'Todavía no empezó el armado del paquete.',
      done: prepared,
    },
    {
      label: 'Despachado',
      description: dispatched ? 'Ya lo entregamos a Andreani con tu código de seguimiento.' : 'Todavía no fue despachado al correo.',
      done: dispatched,
    },
    {
      label: 'En viaje',
      description: inTransit ? 'El paquete ya está en movimiento hacia tu zona.' : 'Aún no figura en tránsito.',
      done: inTransit,
    },
    {
      label: 'Entregado',
      description: delivered ? 'El pedido figura como entregado.' : 'Todavía no aparece como entregado.',
      done: delivered,
    },
  ]
}

function buildShipmentTimelineMarkup(order: OrderEmailRecord) {
  const steps = getShipmentTimeline(order)

  return `
    <div style="margin-top:18px;border:1px solid #e5e7eb;border-radius:26px;background:linear-gradient(180deg,#fbfbf8 0%,#f4f4ef 100%);padding:22px 22px 14px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Camino del envío</div>
      <div style="margin-top:18px;">
        ${steps
          .map(
            (step, index) => `
              <div style="display:flex;gap:16px;">
                <div style="width:42px;display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
                  <div style="width:40px;height:40px;border-radius:999px;border:1px solid ${
                    step.done ? '#111827' : '#d1d5db'
                  };background:${step.done ? '#111827' : '#ffffff'};color:${step.done ? '#ffffff' : '#6b7280'};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;">
                    ${step.done ? '•' : '○'}
                  </div>
                  ${
                    index < steps.length - 1
                      ? `<div style="margin-top:8px;width:1px;flex:1;min-height:28px;background:${step.done ? 'rgba(17,24,39,0.22)' : 'rgba(17,24,39,0.10)'};"></div>`
                      : ''
                  }
                </div>
                <div style="padding-bottom:16px;flex:1;">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div style="font-size:15px;font-weight:700;color:${step.done ? '#111827' : 'rgba(17,24,39,0.64)'};">${step.label}</div>
                    <span style="display:inline-block;padding:6px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;${
                      step.done
                        ? 'background:#111827;color:#ffffff;'
                        : 'background:#ffffff;color:rgba(17,24,39,0.48);border:1px solid rgba(17,24,39,0.10);'
                    }">
                      ${step.done ? 'Hecho' : 'Pendiente'}
                    </span>
                  </div>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">${step.description}</p>
                </div>
              </div>`,
          )
          .join('')}
      </div>
    </div>
  `
}

function buildEmailShell(title: string, eyebrow: string, body: string) {
  const logoUrl = `${env.SITE_URL}/brand-mini-logo-tight.png`

  return `<!DOCTYPE html>
  <html lang="es">
    <body style="margin:0;background:#eff3ec;padding:24px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dfe7dc;border-radius:32px;overflow:hidden;">
        <div style="padding:32px;background:linear-gradient(135deg,#0f172a 0%,#1f2937 55%,#3f5a40 100%);color:#ffffff;">
          <div style="display:inline-flex;align-items:center;gap:12px;padding:12px 16px;border-radius:18px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);">
            <img src="${logoUrl}" alt="Patagónicos" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;background:#ffffff;" />
            <div>
              <div style="font-size:16px;font-weight:700;letter-spacing:0.01em;color:#ffffff;">Patagónicos</div>
              <div style="margin-top:2px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.72);">Outdoor para mascotas</div>
            </div>
          </div>
          <div style="margin-top:22px;font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.72);">${eyebrow}</div>
          <h1 style="margin:16px 0 0;font-size:34px;line-height:1.05;letter-spacing:-0.04em;">${title}</h1>
        </div>
        <div style="padding:32px;">
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
      ${buildTransferInstructionsMarkup(order)}
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
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Método de pago: <strong>${getOrderStateLabel(order.paymentMethod)}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Email: ${order.customer.email}${order.customer.phone ? ` · Teléfono: ${order.customer.phone}` : ''}</p>
      ${
        order.address
          ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Entrega: ${[order.address.line1, order.address.city, order.address.province, order.address.postalCode].filter(Boolean).join(', ')}</p>`
          : ''
      }
      ${buildTransferInstructionsMarkup(order, 'admin')}
      ${buildOrderSummaryMarkup(order)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${order.id}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir pedido</a>
      </div>
    `,
  )
}

function buildCustomerStatusHtml(order: OrderEmailRecord) {
  const paymentBadge = buildEmailStatusBadge(getOrderStateLabel(order.paymentStatus), order.paymentStatus)
  const orderBadge = buildEmailStatusBadge(getOrderStateLabel(order.status), order.status)
  const trackingBlock = order.trackingNumber?.trim()
    ? `
      <div style="margin-top:16px;border:1px solid #dbeafe;background:#eff6ff;border-radius:20px;padding:16px 18px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#1d4ed8;">Tracking</div>
        <div style="margin-top:8px;font-size:18px;font-weight:700;color:#111827;">${order.trackingNumber}</div>
      </div>
    `
    : ''
  const addressLine = order.address
    ? [order.address.line1, order.address.city, order.address.province, order.address.postalCode].filter(Boolean).join(' · ')
    : 'Lo vas a poder seguir desde tu cuenta.'
  const displayCode = order.shortCode ?? order.orderNumber

  return buildEmailShell(
    `Pago confirmado para ${displayCode}`,
    'Pago acreditado',
    `
      <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
        Hola ${order.customer.fullName ?? ''}, ya acreditamos tu pago y tu pedido quedó listo dentro de tu cuenta para seguir cada etapa del proceso.
      </p>

      <div style="margin-top:22px;border:1px solid #e5e7eb;border-radius:28px;background:linear-gradient(180deg,#fbfbf8 0%,#f5f7f2 100%);padding:24px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:0;vertical-align:top;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Pedido ${displayCode}</div>
              <div style="margin-top:12px;font-size:32px;line-height:1.05;font-weight:700;letter-spacing:-0.05em;color:#111827;">${getOrderStateLabel(order.status)}</div>
              <div style="margin-top:12px;">${orderBadge}&nbsp;${paymentBadge}</div>
              <div style="margin-top:12px;font-size:14px;line-height:1.7;color:#4b5563;">
                ${new Date(order.createdAt).toLocaleDateString('es-AR')} · ${getShippingMethodLabel(order.shippingMethod)}
              </div>
            </td>
            <td style="padding:0;text-align:right;vertical-align:top;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">Total</div>
              <div style="margin-top:10px;font-size:30px;line-height:1;font-weight:700;color:#111827;">${formatPrice(order.total)}</div>
              <div style="margin-top:10px;font-size:13px;line-height:1.6;color:#4b5563;">${order.orderNumber}</div>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
        <tr>
          ${buildInfoCard('Pago', getOrderStateLabel(order.paymentStatus), 'Mercado Pago ya confirmó la acreditación.')}
          ${buildInfoCard('Envío', getOrderStateLabel(order.shippingStatus), getShippingMethodLabel(order.shippingMethod))}
          ${buildInfoCard('Entrega', order.address?.city ?? 'Cuenta del pedido', order.address?.province ?? 'Seguimiento disponible en tu panel')}
        </tr>
      </table>

      <div style="margin-top:6px;border:1px solid #e5e7eb;border-radius:24px;background:#ffffff;padding:22px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Productos del pedido</div>
        ${buildOrderSummaryMarkup(order)}
      </div>

      <div style="margin-top:18px;border:1px solid #e5e7eb;border-radius:24px;background:#ffffff;padding:20px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Seguimiento y datos</div>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#334155;">
          ${addressLine}
        </p>
        ${trackingBlock}
      </div>

      <div style="margin-top:24px;">
        <a href="${buildTrackingUrl(order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Ver mi pedido</a>
      </div>
    `,
  )
}

function buildCustomerShipmentStatusHtml(order: OrderEmailRecord) {
  const displayCode = order.shortCode ?? order.orderNumber
  const trackingUrl = order.trackingNumber?.trim() ? getAndreaniTrackingUrl(order.trackingNumber) : null

  return buildEmailShell(
    `Tu pedido ${displayCode} fue despachado`,
    'Despacho confirmado',
    `
      <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
        Hola ${order.customer.fullName ?? ''}, ya despachamos tu pedido y quedó cargado con seguimiento para que puedas ver cada avance.
      </p>

      <div style="margin-top:22px;border:1px solid #e5e7eb;border-radius:28px;background:linear-gradient(180deg,#fbfbf8 0%,#f5f7f2 100%);padding:24px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:0;vertical-align:top;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Pedido ${displayCode}</div>
              <div style="margin-top:12px;font-size:32px;line-height:1.05;font-weight:700;letter-spacing:-0.05em;color:#111827;">Despachado</div>
              <div style="margin-top:12px;">${buildEmailStatusBadge(getOrderStateLabel(order.shippingStatus), order.shippingStatus)}</div>
              <div style="margin-top:12px;font-size:14px;line-height:1.7;color:#4b5563;">
                ${order.carrier ?? 'Andreani'} · ${getShippingMethodLabel(order.shippingMethod)}
              </div>
            </td>
            <td style="padding:0;text-align:right;vertical-align:top;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">Tracking</div>
              <div style="margin-top:10px;font-size:26px;line-height:1.1;font-weight:700;color:#111827;">${order.trackingNumber ?? 'Pendiente'}</div>
              <div style="margin-top:10px;font-size:13px;line-height:1.6;color:#4b5563;">${order.orderNumber}</div>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:18px;">
        <tr>
          ${buildInfoCard('Correo', order.carrier ?? 'Andreani', 'Seguimiento oficial del transporte')}
          ${buildInfoCard('Estado', getOrderStateLabel(order.shippingStatus), 'Ya fue entregado al operador logístico')}
          ${buildInfoCard('Destino', order.address?.city ?? 'Cuenta del pedido', order.address?.province ?? 'Seguimiento disponible en tu panel')}
        </tr>
      </table>

      ${buildShipmentTimelineMarkup(order)}

      <div style="margin-top:18px;border:1px solid #e5e7eb;border-radius:24px;background:#ffffff;padding:20px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Seguimiento y datos</div>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#334155;">
          Código de seguimiento: <strong>${order.trackingNumber ?? 'Pendiente de carga'}</strong>.
        </p>
        ${
          trackingUrl
            ? `<div style="margin-top:18px;">
                <a href="${trackingUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Seguir en Andreani</a>
              </div>`
            : ''
        }
        <div style="margin-top:12px;">
          <a href="${buildTrackingUrl(order)}" style="display:inline-block;padding:14px 22px;border-radius:999px;border:1px solid #d1d5db;background:#ffffff;color:#111827;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Ver mi pedido</a>
        </div>
      </div>
    `,
  )
}

function buildAdminShipmentStatusHtml(order: OrderEmailRecord) {
  const trackingUrl = order.trackingNumber?.trim() ? getAndreaniTrackingUrl(order.trackingNumber) : null

  return buildEmailShell(
    `Pedido despachado ${order.shortCode ?? order.orderNumber}`,
    'Despacho registrado',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>${order.customer.fullName ?? order.customer.email}</strong> ya tiene el pedido despachado.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Pedido: <strong>${order.shortCode ?? order.orderNumber}</strong> · Estado de envío: <strong>${getOrderStateLabel(order.shippingStatus)}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Tracking: <strong>${order.trackingNumber ?? 'Sin tracking'}</strong>${trackingUrl ? ` · <a href="${trackingUrl}" style="color:#111827;">Abrir Andreani</a>` : ''}</p>
      ${buildOrderSummaryMarkup(order)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${order.id}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir pedido</a>
      </div>
    `,
  )
}

function buildAdminStatusChangedHtml(order: OrderEmailRecord) {
  return buildEmailShell(
    `Estado actualizado ${order.shortCode ?? order.orderNumber}`,
    'Actualización operativa',
    `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><strong>${order.customer.fullName ?? order.customer.email}</strong> tiene una actualización en su pedido.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Pedido: <strong>${order.shortCode ?? order.orderNumber}</strong> · Estado del pedido: <strong>${getOrderStateLabel(order.status)}</strong> · Estado de envío: <strong>${getOrderStateLabel(order.shippingStatus)}</strong>.</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Tracking: <strong>${order.trackingNumber ?? 'Sin tracking'}</strong>.</p>
      ${buildOrderSummaryMarkup(order)}
      <div style="margin-top:24px;">
        <a href="${env.SITE_URL}/admin/pedidos/${order.id}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Abrir pedido</a>
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

async function sendTrackedEmail(input: { to: string; subject: string; html: string }) {
  const result = await sendEmail(input)
  console.info('[order-email]', { to: input.to, subject: input.subject, result })
  return result
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
    return false
  }

  await Promise.all([
    sendTrackedEmail({
      to: order.customer.email,
      subject: `Pago confirmado: ${order.shortCode ?? order.orderNumber}`,
      html: buildCustomerStatusHtml(order),
    }),
    sendTrackedEmail({
      to: env.ADMIN_EMAIL,
      subject: `[ADMIN] Pago confirmado - ${order.shortCode ?? order.orderNumber} - ${order.customer.fullName ?? order.customer.email}`,
      html: buildAdminOrderCreatedHtml(order),
    }),
  ])

  return true
}

export async function sendOrderStatusChangedNotification(orderId: string) {
  const order = await getOrderEmailRecord(orderId)

  if (!order) {
    return false
  }

  if (order.replacementExchangeRequests[0] && order.status === 'SHIPPED') {
    await Promise.all([
      sendTrackedEmail({
        to: order.customer.email,
        subject: `Despacho de cambio: ${order.shortCode ?? order.orderNumber}`,
        html: buildCustomerReplacementShippedHtml(order),
      }),
      sendTrackedEmail({
        to: env.ADMIN_EMAIL,
        subject: `[ADMIN] Recambio despachado - ${order.shortCode ?? order.orderNumber}`,
        html: buildAdminReplacementShippedHtml(order),
      }),
    ])
    return true
  }

  if (order.status === 'SHIPPED' || order.shippingStatus === 'DESPACHADO') {
    await Promise.all([
      sendTrackedEmail({
        to: order.customer.email,
        subject: `Tu pedido fue despachado: ${order.shortCode ?? order.orderNumber}`,
        html: buildCustomerShipmentStatusHtml(order),
      }),
      sendTrackedEmail({
        to: env.ADMIN_EMAIL,
        subject: `[ADMIN] Pedido despachado - ${order.shortCode ?? order.orderNumber} - ${order.customer.fullName ?? order.customer.email}`,
        html: buildAdminShipmentStatusHtml(order),
      }),
    ])

    return true
  }

  await Promise.all([
    sendTrackedEmail({
      to: order.customer.email,
      subject: `Estado actualizado: ${order.shortCode ?? order.orderNumber}`,
      html: buildCustomerStatusHtml(order),
    }),
    sendTrackedEmail({
      to: env.ADMIN_EMAIL,
      subject: `[ADMIN] Estado actualizado - ${order.shortCode ?? order.orderNumber} - ${order.customer.fullName ?? order.customer.email}`,
      html: buildAdminStatusChangedHtml(order),
    }),
  ])

  return true
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
