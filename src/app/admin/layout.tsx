import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminSession();

  return (
    <div className="grid min-h-screen bg-night text-ivory lg:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <main className="px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
