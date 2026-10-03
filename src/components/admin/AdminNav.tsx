"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icons";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/admin/projects", label: "Projects", icon: "folder" },
  { href: "/admin/messages", label: "Messages", icon: "mail" },
];

// The Dashboard tab is only active on /admin itself; the others stay active on their sub-pages
// (e.g. Projects on /admin/projects/new and on a project's edit page).
function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-wrap items-center gap-1.5">
      {items.map(({ href, label, icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              active
                ? "bg-accent/10 font-medium text-accent ring-1 ring-inset ring-accent/30"
                : "text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            <Icon name={icon} className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
