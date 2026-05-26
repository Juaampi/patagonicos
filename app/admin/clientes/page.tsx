import { AdminCustomersPanel } from '@/components/admin/admin-customers-panel'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AdminCustomersPanel
      customers={customers.map((customer) => ({
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        whatsappOptIn: customer.whatsappOptIn,
        orderCount: customer.orders.length,
        totalSpent: customer.orders.reduce((total, order) => total + order.total, 0),
        lastOrderAt: customer.orders[0]?.createdAt.toISOString(),
      }))}
    />
  )
}
