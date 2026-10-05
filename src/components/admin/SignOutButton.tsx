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
      className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm sm:px-4 transition-colors hover:bg-card"
    >
      Sign out
    </button>
  );
}
