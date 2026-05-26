export type MockTrackingEvent = {
  label: string
  description: string
  timestamp: string
}

export type MockTrackingOrder = {
  code: string
  customerName: string
  destination: string
  carrier: string
  status: string
  eta: string
  events: MockTrackingEvent[]
}

export const mockTrackingOrders: MockTrackingOrder[] = [
  {
    code: 'AND-PA-24001',
    customerName: 'Martina R.',
    destination: 'Córdoba Capital',
    carrier: 'Andreani',
    status: 'En tránsito',
    eta: 'Llega entre mañana y pasado mañana',
    events: [
      {
        label: 'Despachado',
        description: 'Tu pedido fue preparado y entregado a Andreani.',
        timestamp: '12 mayo · 16:12 hs',
      },
      {
        label: 'Centro logístico',
        description: 'Ingresó al centro de clasificación principal.',
        timestamp: '12 mayo · 22:30 hs',
      },
      {
        label: 'En tránsito',
        description: 'Va camino a la sucursal de destino.',
        timestamp: '13 mayo · 08:05 hs',
      },
    ],
  },
  {
    code: 'AND-PA-24002',
    customerName: 'Federico L.',
    destination: 'Rosario, Santa Fe',
    carrier: 'Andreani',
    status: 'Listo para entrega',
    eta: 'Entrega prevista para hoy',
    events: [
      {
        label: 'Despachado',
        description: 'Pedido despachado desde Bariloche.',
        timestamp: '11 mayo · 17:45 hs',
      },
      {
        label: 'Sucursal destino',
        description: 'Llegó a la sucursal de tu zona.',
        timestamp: '12 mayo · 19:20 hs',
      },
      {
        label: 'Listo para entrega',
        description: 'El repartidor ya tiene tu paquete en reparto.',
        timestamp: '13 mayo · 08:40 hs',
      },
    ],
  },
  {
    code: 'AND-PA-24003',
    customerName: 'Sofía G.',
    destination: 'Mendoza Capital',
    carrier: 'Andreani',
    status: 'Preparando envío',
    eta: 'Se despacha hoy',
    events: [
      {
        label: 'Compra confirmada',
        description: 'Recibimos tu pedido y ya está en preparación.',
        timestamp: '13 mayo · 09:10 hs',
      },
      {
        label: 'Preparando envío',
        description: 'Estamos embalando tu pedido para el despacho.',
        timestamp: '13 mayo · 09:45 hs',
      },
    ],
  },
]

export function findMockTrackingOrder(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return null
  }

  return mockTrackingOrders.find((order) => order.code.toUpperCase() === normalized) ?? null
}
