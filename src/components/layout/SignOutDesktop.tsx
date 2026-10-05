"use client";

import SignOutButton from "@/components/admin/SignOutButton";
import { useAdminArea } from "./useNav";

// Sign out in the navbar, inside /admin (phones get it in the menu).
export default function SignOutDesktop() {
  const { admin } = useAdminArea();
  return admin ? (
    <div className="max-sm:hidden">
      <SignOutButton />
    </div>
  ) : null;
}
