"use client";

import Icon from "@/components/ui/Icons";
import SignOutButton from "@/components/admin/SignOutButton";
import { ghostButtonClass } from "@/components/ui/fields";
import { useAdminArea } from "./useNav";

// "Live web" opens the public site in a new tab.
export function LiveWebLink({ className = "" }: { className?: string }) {
  return (
    <a href="/" target="_blank" rel="noopener noreferrer" className={`${ghostButtonClass} whitespace-nowrap ${className}`}>
      Live web <Icon name="external" className="h-3.5 w-3.5" />
    </a>
  );
}

// The navbar's admin buttons, inside /admin (phones get them in the menu).
export default function AdminActions() {
  const { admin } = useAdminArea();
  return admin ? (
    <div className="flex items-center gap-2 max-lg:hidden">
      <LiveWebLink />
      <SignOutButton />
    </div>
  ) : null;
}
