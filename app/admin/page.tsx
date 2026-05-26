import { redirect } from 'next/navigation'

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const query = params?.saved ? `?saved=${encodeURIComponent(params.saved)}` : ''

  redirect(`/admin/dashboard${query}`)
}
