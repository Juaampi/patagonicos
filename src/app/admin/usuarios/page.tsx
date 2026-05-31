import { formatDate } from "@/lib/format";
import { getAdminUsers } from "@/lib/data";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-rose-gold">Usuarios</p>
        <h1 className="mt-3 font-serif text-5xl">Administradores del sistema</h1>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-ivory/55">
            <tr>
              <th className="px-5 py-4">Nombre</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Rol</th>
              <th className="px-5 py-4">Alta</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/10">
                <td className="px-5 py-5 text-ivory">{user.fullName}</td>
                <td className="px-5 py-5 text-ivory/70">{user.email}</td>
                <td className="px-5 py-5 text-champagne">{user.role}</td>
                <td className="px-5 py-5 text-ivory/70">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
