import { getCustomerProfileByEmail } from '@/lib/server/fulfillment'
import { ProfilePanel } from '@/components/profile/profile-panel'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string; saved?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const email = params?.email?.trim()
  const profile = email ? await getCustomerProfileByEmail(email) : null

  return (
    <ProfilePanel
      email={email}
      saved={params?.saved}
      profile={
        profile
          ? {
              id: profile.id,
              email: profile.email,
              fullName: profile.fullName,
              phone: profile.phone,
              whatsappOptIn: profile.whatsappOptIn,
              orders: profile.orders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                shortCode: order.shortCode,
                status: order.status,
                paymentStatus: order.paymentStatus,
                shippingMethod: order.shippingMethod,
                total: order.total,
                createdAt: order.createdAt.toISOString(),
                whatsappOptIn: order.whatsappOptIn,
                trackingNumber: order.trackingNumber,
                address: order.address
                  ? {
                      city: order.address.city,
                      province: order.address.province,
                      line1: order.address.line1,
                    }
                  : null,
                items: order.items.map((item) => ({
                  name: item.productName,
                  quantity: item.quantity,
                  color: item.colorName,
                  size: item.size,
                })),
              })),
            }
          : null
      }
    />
  )
}
