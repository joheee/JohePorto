"use client";

import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch("/api/auth/session", { method: "DELETE" });
    // Loaded only now: this button lives in the navbar of every page, and importing Firebase at the top
    // would ship its Auth and Firestore SDKs to every visitor of the public site (and make the SDK open
    // its auth iframe, which the CSP blocks).
    const [{ signOut }, { auth }] = await Promise.all([import("firebase/auth"), import("@/lib/firebase")]);
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
