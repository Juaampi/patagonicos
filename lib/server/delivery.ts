import { DeliveryRouteStatus, DeliveryStatus, PaymentMethod, PaymentStatus, ShippingMethod, ShippingStatus, OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { buildWhatsAppDeliveryMessage, buildWhatsAppUrl } from '@/lib/delivery-whatsapp'
import { buildGoogleMapsPinUrl } from '@/lib/server/fulfillment'

export const DELIVERY_ORIGIN_ADDRESS = 'Villa Lago Gutierrez, San Carlos de Bariloche, Rio Negro, Argentina'

type OrderWithDeliveryContext = Awaited<ReturnType<typeof getOrderWithDeliveryContext>>

function getStartOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

export function parseSelectedDeliveryDate(value?: string) {
  if (!value) {
    return getStartOfDay(new Date())
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? getStartOfDay(new Date()) : getStartOfDay(parsed)
}

export function formatDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
  ].join('-')
}

export function isLocalDeliveryOrder(order: {
  shippingMethod: ShippingMethod | string
  fulfillmentType?: string | null
}) {
  return (
    order.fulfillmentType === 'local_delivery' ||
    order.shippingMethod === ShippingMethod.LOCAL_DELIVERY ||
    order.shippingMethod === ShippingMethod.BARILOCHE_SAME_DAY
  )
}

function isPendingDeliveryCandidate(order: {
  shippingMethod: ShippingMethod
  fulfillmentType?: string | null
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  status: OrderStatus
  deliveryStatus: DeliveryStatus
  deliveryDate: Date | null
  createdAt: Date
}, selectedDate: Date) {
  const delivered = order.status === OrderStatus.DELIVERED || order.status === OrderStatus.ENTREGADO
  const cancelled = order.status === OrderStatus.CANCELLED || order.status === OrderStatus.CANCELADO

  if (!isLocalDeliveryOrder(order)) {
    return false
  }

  if (cancelled || delivered) {
    return false
  }

  if (order.deliveryStatus === DeliveryStatus.CANCELLED || order.deliveryStatus === DeliveryStatus.DELIVERED) {
    return false
  }

  const payable = order.paymentStatus === PaymentStatus.PAID || order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
  if (!payable) {
    return false
  }

  const selectedKey = getStartOfDay(selectedDate).getTime()
  const todayKey = getStartOfDay(new Date()).getTime()

  if (!order.deliveryDate) {
    return selectedKey === todayKey
  }

  return getStartOfDay(order.deliveryDate).getTime() === selectedKey
}

function buildFullAddress(order: {
  address: {
    line1: string
    line2: string | null
    city: string
    province: string
    postalCode: string
  } | null
}) {
  if (!order.address) {
    return 'Sin direccion cargada'
  }

  return [
    order.address.line1,
    order.address.line2,
    order.address.city,
    order.address.province,
    order.address.postalCode,
  ]
    .filter(Boolean)
    .join(', ')
}

function getZoneFromOrder(order: {
  address: {
    pinLabel: string | null
    line2: string | null
    city: string
  } | null
}) {
  return order.address?.pinLabel || order.address?.line2 || order.address?.city || 'Bariloche'
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

function haversineDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371
  const dLat = degreesToRadians(to.lat - from.lat)
  const dLng = degreesToRadians(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(from.lat)) *
      Math.cos(degreesToRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function geocodeAddress(address: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'ar')
  url.searchParams.set('q', address)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PatitasAndinasAdmin/1.0',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as Array<{ lat: string; lon: string }>
    const first = data[0]

    if (!first) {
      return null
    }

    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
    }
  } catch {
    return null
  }
}

async function ensureRouteOrigin(routeId: string, routeLat?: number | null, routeLng?: number | null) {
  if (routeLat != null && routeLng != null) {
    return { lat: routeLat, lng: routeLng }
  }

  const geocoded = await geocodeAddress(DELIVERY_ORIGIN_ADDRESS)

  if (!geocoded) {
    return null
  }

  await prisma.deliveryRoute.update({
    where: { id: routeId },
    data: {
      originLat: geocoded.lat,
      originLng: geocoded.lng,
    },
  })

  return geocoded
}

async function ensureOrderCoordinates(order: {
  id: string
  addressId: string | null
  address: {
    line1: string
    line2: string | null
    city: string
    province: string
    postalCode: string
    latitude: number | null
    longitude: number | null
  } | null
}) {
  if (order.address?.latitude != null && order.address?.longitude != null) {
    return { lat: order.address.latitude, lng: order.address.longitude }
  }

  const addressText = buildFullAddress(order)
  if (!order.address || addressText === 'Sin direccion cargada') {
    return null
  }

  const geocoded = await geocodeAddress(addressText)

  if (!geocoded || !order.addressId) {
    return geocoded
  }

  await prisma.address.update({
    where: { id: order.addressId },
    data: {
      latitude: geocoded.lat,
      longitude: geocoded.lng,
    },
  })

  return geocoded
}

function orderStopsByRoute(
  origin: { lat: number; lng: number } | null,
  stops: Array<{
    orderId: string
    lat: number | null
    lng: number | null
  }>,
) {
  const withCoordinates = stops.filter((stop) => stop.lat != null && stop.lng != null)
  const withoutCoordinates = stops.filter((stop) => stop.lat == null || stop.lng == null)

  if (!origin || withCoordinates.length === 0) {
    return [...stops]
  }

  const remaining = [...withCoordinates]
  const ordered: typeof withCoordinates = []
  let currentPoint = origin

  while (remaining.length > 0) {
    remaining.sort((left, right) => {
      const leftDistance = haversineDistanceKm(currentPoint, {
        lat: left.lat ?? currentPoint.lat,
        lng: left.lng ?? currentPoint.lng,
      })
      const rightDistance = haversineDistanceKm(currentPoint, {
        lat: right.lat ?? currentPoint.lat,
        lng: right.lng ?? currentPoint.lng,
      })

      return leftDistance - rightDistance
    })

    const nextStop = remaining.shift()

    if (!nextStop) {
      break
    }

    ordered.push(nextStop)
    currentPoint = { lat: nextStop.lat ?? currentPoint.lat, lng: nextStop.lng ?? currentPoint.lng }
  }

  return [...ordered, ...withoutCoordinates]
}

function buildGoogleMapsDirectionsUrl(origin: string, destination: string, waypoints: string[]) {
  const queryParts = [
    'api=1',
    `origin=${encodeURIComponent(origin)}`,
    `destination=${encodeURIComponent(destination)}`,
    `travelmode=${encodeURIComponent('driving')}`,
  ]

  if (waypoints.length > 0) {
    queryParts.push(`waypoints=${waypoints.map((waypoint) => encodeURIComponent(waypoint)).join('|')}`)
  }

  return `https://www.google.com/maps/dir/?${queryParts.join('&')}`
}

function buildGoogleMapsRouteBatches(
  stops: Array<{
    stopOrder: number
    customerName: string
    address: string
  }>,
) {
  if (stops.length === 0) {
    return []
  }

  const chunkSize = 9

  return Array.from({ length: Math.ceil(stops.length / chunkSize) }, (_, chunkIndex) => {
    const segment = stops.slice(chunkIndex * chunkSize, chunkIndex * chunkSize + chunkSize)
    const destination = segment[segment.length - 1]?.address ?? DELIVERY_ORIGIN_ADDRESS
    const waypoints = segment.slice(0, -1).map((stop) => stop.address)

    return {
      id: `batch-${chunkIndex + 1}`,
      label: `Tanda ${chunkIndex + 1}`,
      stopCount: segment.length,
      url: buildGoogleMapsDirectionsUrl(DELIVERY_ORIGIN_ADDRESS, destination, waypoints),
      stops: segment,
    }
  })
}

export function buildAddressMapsUrl(address: string) {
  const url = new URL('https://www.google.com/maps/search/')
  url.searchParams.set('api', '1')
  url.searchParams.set('query', address)
  return url.toString()
}

async function getRouteForDate(selectedDate: Date) {
  const date = getStartOfDay(selectedDate)

  return prisma.deliveryRoute.upsert({
    where: { date },
    update: {},
    create: {
      date,
      status: DeliveryRouteStatus.DRAFT,
      originAddress: DELIVERY_ORIGIN_ADDRESS,
    },
  })
}

export async function syncDeliveryRouteForDate(selectedDate: Date) {
  const route = await getRouteForDate(selectedDate)
  const candidateOrders = await prisma.order.findMany({
    include: {
      customer: true,
      address: true,
      items: true,
    },
    orderBy: [{ deliveryDate: 'asc' }, { createdAt: 'asc' }],
  })

  const filteredOrders = candidateOrders.filter((order) => isPendingDeliveryCandidate(order, selectedDate))
  const origin = await ensureRouteOrigin(route.id, route.originLat, route.originLng)

  const stopDrafts = await Promise.all(
    filteredOrders.map(async (order) => {
      const coordinates = await ensureOrderCoordinates(order)

      return {
        orderId: order.id,
        customerName: order.customer.fullName ?? order.customer.email,
        phone: order.customer.phone ?? null,
        address: buildFullAddress(order),
        city: order.address?.city ?? 'San Carlos de Bariloche',
        zone: getZoneFromOrder(order),
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        amountToCollect: order.amountToCollect,
        status: order.deliveryStatus,
        notes: order.deliveryNotes ?? order.notes ?? null,
        deliveredAt: order.deliveredAt,
      }
    }),
  )

  const orderedStops = orderStopsByRoute(origin, stopDrafts.map((stop) => ({
    orderId: stop.orderId,
    lat: stop.lat,
    lng: stop.lng,
  })))

  const stopOrderMap = new Map(orderedStops.map((stop, index) => [stop.orderId, index + 1]))

  await Promise.all(
    stopDrafts.map((stop) =>
      prisma.deliveryStop.upsert({
        where: { orderId: stop.orderId },
        update: {
          routeId: route.id,
          customerName: stop.customerName,
          phone: stop.phone,
          address: stop.address,
          city: stop.city,
          zone: stop.zone,
          lat: stop.lat,
          lng: stop.lng,
          stopOrder: stopOrderMap.get(stop.orderId) ?? null,
          paymentMethod: stop.paymentMethod,
          paymentStatus: stop.paymentStatus,
          amountToCollect: stop.amountToCollect,
          status: stop.status,
          notes: stop.notes,
          deliveredAt: stop.deliveredAt,
        },
        create: {
          routeId: route.id,
          orderId: stop.orderId,
          customerName: stop.customerName,
          phone: stop.phone,
          address: stop.address,
          city: stop.city,
          zone: stop.zone,
          lat: stop.lat,
          lng: stop.lng,
          stopOrder: stopOrderMap.get(stop.orderId) ?? null,
          paymentMethod: stop.paymentMethod,
          paymentStatus: stop.paymentStatus,
          amountToCollect: stop.amountToCollect,
          status: stop.status,
          notes: stop.notes,
          deliveredAt: stop.deliveredAt,
        },
      }),
    ),
  )

  await prisma.deliveryStop.deleteMany({
    where: {
      routeId: route.id,
      orderId: {
        notIn: stopDrafts.map((stop) => stop.orderId).length > 0 ? stopDrafts.map((stop) => stop.orderId) : ['__none__'],
      },
    },
  })

  const refreshedRoute = await prisma.deliveryRoute.update({
    where: { id: route.id },
    data: {
      status:
        stopDrafts.length === 0
          ? DeliveryRouteStatus.DRAFT
          : stopDrafts.some((stop) => stop.status === DeliveryStatus.IN_ROUTE)
            ? DeliveryRouteStatus.IN_PROGRESS
            : stopDrafts.every((stop) => stop.status === DeliveryStatus.DELIVERED)
              ? DeliveryRouteStatus.COMPLETED
              : DeliveryRouteStatus.READY,
    },
    include: {
      stops: {
        include: {
          order: {
            include: {
              customer: true,
              address: true,
              items: true,
            },
          },
        },
        orderBy: [{ stopOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })

  return refreshedRoute
}

export async function getDeliveriesPageSnapshot(selectedDateInput?: string) {
  const selectedDate = parseSelectedDeliveryDate(selectedDateInput)
  const today = getStartOfDay(new Date())
  const route = await syncDeliveryRouteForDate(selectedDate)

  const stops = route.stops.map((stop, index) => {
    const order = stop.order

    return {
      id: stop.id,
      orderId: stop.orderId,
      orderNumber: order.orderNumber,
      shortCode: order.shortCode,
      stopOrder: stop.stopOrder ?? index + 1,
      customerName: stop.customerName,
      phone: stop.phone,
      address: stop.address,
      zone: stop.zone ?? stop.city ?? 'Bariloche',
      paymentMethod: stop.paymentMethod,
      paymentStatus: stop.paymentStatus,
      amountToCollect: stop.amountToCollect,
      total: order.total,
      status: stop.status,
      deliveryStatus: order.deliveryStatus,
      notes: stop.notes,
      productsSummary: order.items.map((item) => `${item.productName} x${item.quantity}`).join(', '),
      products: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        colorName: item.colorName,
        size: item.size,
      })),
      mapsUrl: buildAddressMapsUrl(stop.address),
      pinUrl: buildGoogleMapsPinUrl(order.address?.latitude, order.address?.longitude),
      orderUrl: `/admin/pedidos/${order.id}`,
      ticketUrl: `/admin/pedidos/${order.id}/ticket`,
      phoneUrl: stop.phone ? `tel:${stop.phone}` : null,
      routeWhatsappUrl: stop.phone
        ? buildWhatsAppUrl(
            stop.phone,
            buildWhatsAppDeliveryMessage({
              customerName: stop.customerName,
              orderNumber: order.orderNumber,
              shortCode: order.shortCode,
              total: order.total,
              amountToCollect: stop.amountToCollect,
              paymentMethod: stop.paymentMethod,
              paymentStatus: stop.paymentStatus,
              deliveryAddress: stop.address,
              items: order.items.map((item) => ({
                productName: item.productName,
                quantity: item.quantity,
              })),
            }),
          )
        : '',
    }
  })

  const routeBatches = buildGoogleMapsRouteBatches(
    stops.map((stop) => ({
      stopOrder: stop.stopOrder,
      customerName: stop.customerName,
      address: stop.address,
    })),
  )

  return {
    selectedDate,
    selectedDateValue: formatDateInputValue(selectedDate),
    todayDateValue: formatDateInputValue(today),
    routeId: route.id,
    routeStatus: route.status,
    originAddress: route.originAddress,
    stops,
    stats: {
      totalStops: stops.length,
      cashOnDeliveryCount: stops.filter((stop) => stop.amountToCollect > 0).length,
      totalToCollect: stops.reduce((total, stop) => total + stop.amountToCollect, 0),
      paidCount: stops.filter((stop) => stop.paymentStatus === PaymentStatus.PAID).length,
    },
    routeBatches,
    googleMapsUrls: routeBatches.map((batch) => batch.url),
  }
}

async function getOrderWithDeliveryContext(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      address: true,
      items: true,
      deliveryStops: true,
    },
  })
}

function getOrderDeliveryAddress(order: NonNullable<OrderWithDeliveryContext>) {
  return buildFullAddress({ address: order.address })
}

function mapOrderToWhatsappUrl(order: NonNullable<OrderWithDeliveryContext>) {
  const phone = order.customer.phone

  if (!phone) {
    return ''
  }

  return buildWhatsAppUrl(
    phone,
    buildWhatsAppDeliveryMessage({
      customerName: order.customer.fullName ?? order.customer.email,
      orderNumber: order.orderNumber,
      shortCode: order.shortCode,
      total: order.total,
      amountToCollect: order.amountToCollect,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: getOrderDeliveryAddress(order),
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
      })),
    }),
  )
}

export async function getOrderWhatsAppDeliveryInfo(orderId: string) {
  const order = await getOrderWithDeliveryContext(orderId)

  if (!order) {
    return { error: 'No encontramos el pedido.' }
  }

  if (!order.customer.phone) {
    return { error: 'Este pedido no tiene telefono cargado para WhatsApp.' }
  }

  const whatsappUrl = mapOrderToWhatsappUrl(order)

  if (!whatsappUrl) {
    return { error: 'No pudimos generar el link de WhatsApp para este cliente.' }
  }

  return { whatsappUrl }
}

export async function updateDeliveryState(orderId: string, status: DeliveryStatus) {
  const order = await getOrderWithDeliveryContext(orderId)

  if (!order) {
    throw new Error('No encontramos el pedido.')
  }

  const now = new Date()
  const nextDeliveryDate =
    status === DeliveryStatus.RESCHEDULED ? getStartOfDay(new Date((order.deliveryDate ?? now).getTime() + 86400000)) : order.deliveryDate

  const nextOrderStatus =
    status === DeliveryStatus.DELIVERED
      ? OrderStatus.DELIVERED
      : status === DeliveryStatus.IN_ROUTE
        ? OrderStatus.OUT_FOR_DELIVERY
        : status === DeliveryStatus.FAILED_DELIVERY || status === DeliveryStatus.RESCHEDULED
          ? OrderStatus.READY_FOR_LOCAL_DELIVERY
          : order.status

  const nextShippingStatus =
    status === DeliveryStatus.DELIVERED
      ? ShippingStatus.ENTREGADO
      : status === DeliveryStatus.IN_ROUTE
        ? ShippingStatus.EN_TRANSITO
        : ShippingStatus.EN_PREPARACION

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextOrderStatus,
      shippingStatus: nextShippingStatus,
      deliveryStatus: status,
      deliveryDate: nextDeliveryDate,
      inRouteAt: status === DeliveryStatus.IN_ROUTE ? now : order.inRouteAt,
      deliveredAt: status === DeliveryStatus.DELIVERED ? now : status === DeliveryStatus.RESCHEDULED ? null : order.deliveredAt,
      paymentStatus:
        status === DeliveryStatus.DELIVERED && order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? PaymentStatus.PAID
          : order.paymentStatus,
      amountToCollect:
        status === DeliveryStatus.DELIVERED && order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? 0
          : order.amountToCollect,
    },
  })

  await prisma.deliveryStop.updateMany({
    where: { orderId },
    data: {
      status,
      paymentStatus:
        status === DeliveryStatus.DELIVERED && order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? PaymentStatus.PAID
          : order.paymentStatus,
      amountToCollect:
        status === DeliveryStatus.DELIVERED && order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
          ? 0
          : order.amountToCollect,
      deliveredAt: status === DeliveryStatus.DELIVERED ? now : null,
    },
  })

  return getOrderWithDeliveryContext(orderId)
}
