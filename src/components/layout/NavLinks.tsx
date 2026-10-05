"use client";

import Link from "next/link";
import { adminNavLinks, navLinks } from "@/lib/content";
import { isTabActive, useActiveSection, useAdminArea } from "./useNav";

const sectionIds = navLinks
  .filter((l) => l.href.startsWith("/#"))
  .map((l) => l.href.slice(2));

export default function NavLinks() {
  const { pathname, admin } = useAdminArea();
  // On the home page, highlight the section that is currently in view.
  const active = useActiveSection(sectionIds, pathname === "/");

  const links = admin ? adminNavLinks : navLinks;
  const isActive = (href: string) =>
    admin
      ? isTabActive(pathname, href)
      : href.startsWith("/#")
        ? pathname === "/" && active === href.slice(2)
        : pathname.startsWith(href);

  return (
    <ul className="flex items-center gap-4 text-sm text-muted sm:gap-6">
      {links.map((l) => (
        <li key={l.href} className="hidden sm:block">
          <Link
            href={l.href}
            aria-current={isActive(l.href) ? "true" : undefined}
            className={`relative pb-1 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-accent after:transition-transform hover:text-foreground hover:after:scale-x-100 ${
              isActive(l.href)
                ? "text-foreground after:scale-x-100"
                : "after:scale-x-0"
            }`}
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
