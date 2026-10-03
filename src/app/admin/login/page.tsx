import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-sm flex-col justify-center px-6 py-20">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Admin sign in</h1>
      <LoginForm />
    </div>
  );
}
