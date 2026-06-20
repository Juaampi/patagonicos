import { adminLoginAction } from '@/lib/server/admin-access'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string; logged_out?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const nextPath = params?.next ? decodeURIComponent(params.next) : '/admin/dashboard'

  return (
    <section className="shell pb-12 pt-40">
      <div className="mx-auto max-w-lg card-surface p-7">
        <p className="eyebrow">Panel admin</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.05em]">Ingreso de administración</h1>
        <p className="mt-4 text-sm leading-7 text-black/60">
          Entrá con el email administrador para gestionar pedidos, productos y logística.
        </p>
        {params?.error ? (
          <div className="mt-5 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            El email administrador no coincide. Probá de nuevo.
          </div>
        ) : null}
        {params?.logged_out ? (
          <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Cerraste sesión del panel admin.
          </div>
        ) : null}
        <form action={adminLoginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@patitasandinas.com"
            className="w-full rounded-[20px] border border-black/10 bg-[#f7f7f4] px-4 py-4 text-sm outline-none"
          />
          <button className="button-primary w-full">Entrar al admin</button>
        </form>
      </div>
    </section>
  )
}
