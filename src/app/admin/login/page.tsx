import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/shared/logo";
import { getSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session?.userId) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night px-5">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
