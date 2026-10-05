import { requireAdmin } from "@/lib/auth";

// Layouts don't re-render on client navigation, so every admin page also calls requireAdmin().
// The tabs, sign-out and section bar live in the site navbar (it switches to them inside /admin).
export default async function ProtectedLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return <div className="mx-auto w-full max-w-5xl px-6 py-10">{children}</div>;
}
