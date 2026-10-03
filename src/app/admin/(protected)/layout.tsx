import Link from "next/link";
import SignOutButton from "@/components/admin/SignOutButton";
import { requireAdmin } from "@/lib/auth";

// Layouts don't re-render on client navigation, so every admin page also calls requireAdmin().
export default async function ProtectedLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-10 flex items-center justify-between gap-4 border-b border-border pb-4">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/admin" className="font-semibold">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="hidden sm:inline">{admin.email}</span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
