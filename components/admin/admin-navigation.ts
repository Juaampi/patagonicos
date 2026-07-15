import {
  Gauge,
  Package,
  ReceiptText,
  Users,
  Truck,
  Bike,
  Settings2,
  MessageSquareQuote,
  BadgePercent,
} from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  icon: typeof Gauge
  match: string[]
}

export const adminNavigationItems: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Gauge, match: ['/admin', '/admin/dashboard'] },
  { href: '/admin/productos', label: 'Productos', icon: Package, match: ['/admin/productos'] },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ReceiptText, match: ['/admin/pedidos'] },
  { href: '/admin/clientes', label: 'Clientes', icon: Users, match: ['/admin/clientes'] },
  { href: '/admin/envios', label: 'Envios', icon: Truck, match: ['/admin/envios'] },
  { href: '/admin/repartos', label: 'Repartos', icon: Bike, match: ['/admin/repartos'] },
  { href: '/admin/cupones', label: 'Cupones', icon: BadgePercent, match: ['/admin/cupones'] },
  { href: '/admin/configuracion', label: 'Configuracion', icon: Settings2, match: ['/admin/configuracion'] },
  { href: '/admin/comentarios', label: 'Comentarios', icon: MessageSquareQuote, match: ['/admin/comentarios'] },
]

export const adminPageMeta = adminNavigationItems.reduce<Record<string, { title: string; subtitle: string }>>(
  (accumulator, item) => {
    accumulator[item.href] = {
      title: item.label,
      subtitle:
        item.href === '/admin/dashboard'
          ? 'Resumen operativo de tienda, pedidos y logistica.'
          : item.href === '/admin/repartos'
            ? 'Vista diaria para preparar recorrido, reparto y comunicacion con clientes.'
            : `Gestion modular de ${item.label.toLowerCase()}.`,
    }
    return accumulator
  },
  {},
)
