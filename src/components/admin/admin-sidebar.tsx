import Link from "next/link";
import { Building2, LayoutDashboard, LogOut, MessageSquareText, UsersRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Logo } from "@/components/shared/logo";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/admin/consultas", label: "Consultas", icon: MessageSquareText },
  { href: "/admin/usuarios", label: "Usuarios", icon: UsersRound },
];

export function AdminSidebar() {
  return (
    <aside className="flex min-h-screen flex-col gap-8 border-r border-white/10 bg-[#120c10] px-5 py-6">
      <Logo compact />
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ivory/75 transition hover:bg-white/5 hover:text-ivory"
            >
              <Icon className="h-4 w-4 text-rose-gold" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-ivory/75 transition hover:bg-white/5 hover:text-ivory">
          <LogOut className="h-4 w-4 text-rose-gold" />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
