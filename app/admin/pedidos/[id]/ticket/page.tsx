import { notFound } from 'next/navigation'
import { getOrderForTicket, renderTicketHtml } from '@/lib/server/fulfillment'

export default async function AdminOrderTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderForTicket(id)

  if (!order) {
    notFound()
  }

  return <iframe title={`Ticket ${order.shortCode ?? order.orderNumber}`} srcDoc={renderTicketHtml(order)} className="h-screen w-full border-0" />
}
