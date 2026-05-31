import { updateCustomerWhatsappOptInAction } from '@/lib/server/fulfillment-actions'
import { getOrderStateLabel, getProfileSavedMessage, getShippingMethodLabel } from '@/lib/server/fulfillment'
import { ProfileSavedAlert } from '@/components/profile/profile-saved-alert'
import { formatPrice } from '@/lib/utils'

type ProfilePanelProps = {
  email?: string
  saved?: string
  profile:
    | {
        id: string
        email: string
        fullName?: string | null
        phone?: string | null
        whatsappOptIn: boolean
        orders: Array<{
          id: string
          orderNumber: string
          shortCode?: string | null
          status: string
          paymentStatus: string
          shippingMethod: string
          total: number
          createdAt: string
          whatsappOptIn: boolean
          address?: { city?: string | null; province?: string | null; line1?: string | null } | null
          items: Array<{ name: string; quantity: number; color: string; size: string }>
        }>
      }
    | null
}

export function ProfilePanel({ email, saved, profile }: ProfilePanelProps) {
  const savedMessage = getProfileSavedMessage(saved)

  return (
    <section className="shell pb-12 pt-32">
      <ProfileSavedAlert saved={saved} savedMessage={savedMessage} />

      <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <aside className="card-surface p-7">
          <p className="eyebrow">Mi cuenta</p>
          <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Acceso por email</h1>
          <p className="mt-4 text-sm leading-7 text-black/62">
            Después de comprar, tu cuenta queda asociada al mismo email. Entrás desde acá y ves pedidos, entrega y notificaciones.
          </p>
          <form action="/perfil" className="mt-6">
            <input
              name="email"
              defaultValue={email ?? ''}
              placeholder="tu@email.com"
              className="w-full rounded-[18px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
            />
            <button className="button-primary mt-4 w-full">Ver mi cuenta</button>
          </form>

          {profile ? (
            <div className="mt-6 rounded-[22px] bg-[#f7f7f4] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-black/50">Cliente</p>
              <p className="mt-3 text-base font-medium text-black/84">{profile.fullName ?? profile.email}</p>
              <p className="mt-1 text-sm text-black/62">{profile.phone ?? 'Sin teléfono cargado'}</p>
              <div className="mt-4 border-t border-black/8 pt-4">
                <form action={updateCustomerWhatsappOptInAction}>
                  <input type="hidden" name="customerId" value={profile.id} />
                  <input type="hidden" name="email" value={profile.email} />
                  <input type="hidden" name="enabled" value={profile.whatsappOptIn ? 'false' : 'true'} />
                  <button className="w-full rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/76 transition hover:bg-black hover:text-white">
                    {profile.whatsappOptIn ? 'Desactivar notificaciones WhatsApp' : 'Activar notificaciones WhatsApp'}
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-5">
          {!email ? (
            <div className="card-surface p-7 text-sm leading-7 text-black/58">
              Ingresá tu email para ver la cuenta asociada a tus compras.
            </div>
          ) : !profile ? (
            <div className="card-surface p-7 text-sm leading-7 text-black/58">
              No encontramos una cuenta para <strong>{email}</strong>. Revisá si compraste con ese email o hacé una compra nueva para que quede creada.
            </div>
          ) : profile.orders.length === 0 ? (
            <div className="card-surface p-7 text-sm leading-7 text-black/58">
              Tu cuenta ya existe pero todavía no tiene pedidos.
            </div>
          ) : (
            profile.orders.map((order) => (
              <article key={order.id} className="card-surface p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Pedido {order.shortCode ?? order.orderNumber}</p>
                    <h2 className="mt-3 font-display text-3xl tracking-[-0.05em]">{getOrderStateLabel(order.status)}</h2>
                    <p className="mt-2 text-sm text-black/55">
                      {new Date(order.createdAt).toLocaleDateString('es-AR')} · {getShippingMethodLabel(order.shippingMethod)}
                    </p>
                  </div>
                  <p className="text-xl font-semibold">{formatPrice(order.total)}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Productos</p>
                    <div className="mt-3 space-y-2 text-sm text-black/72">
                      {order.items.map((item) => (
                        <p key={`${item.name}-${item.size}`}>{item.name} · {item.color} · {item.size} · x{item.quantity}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Pago y envío</p>
                    <p className="mt-3 text-sm text-black/72">{getOrderStateLabel(order.paymentStatus)}</p>
                    <p className="mt-1 text-sm text-black/52">{order.address?.city ?? ''} {order.address?.province ? `· ${order.address.province}` : ''}</p>
                  </div>
                  <div className="rounded-[22px] bg-[#f7f7f4] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/50">Notificaciones</p>
                    <p className="mt-3 text-sm text-black/72">
                      {order.whatsappOptIn ? 'WhatsApp activado para este pedido.' : 'WhatsApp no activado para este pedido.'}
                    </p>
                    {!order.whatsappOptIn && profile.phone ? (
                      <form action={updateCustomerWhatsappOptInAction} className="mt-3">
                        <input type="hidden" name="customerId" value={profile.id} />
                        <input type="hidden" name="email" value={profile.email} />
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="enabled" value="true" />
                        <button className="rounded-[16px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black/76 transition hover:bg-black hover:text-white">
                          Activar notificaciones al celular
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
