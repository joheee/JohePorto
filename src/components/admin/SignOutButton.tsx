"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(auth);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-card"
    >
      Sign out
    </button>
  );
}
