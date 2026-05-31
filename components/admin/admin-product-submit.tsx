'use client'

export function AdminProductSubmit({
  mode = 'create',
  pending = false,
}: {
  mode?: 'create' | 'edit'
  pending?: boolean
}) {
  return (
    <button className="button-primary mt-6" disabled={pending}>
      {pending ? 'Guardando producto...' : mode === 'edit' ? 'Actualizar producto' : 'Crear producto'}
    </button>
  )
}
