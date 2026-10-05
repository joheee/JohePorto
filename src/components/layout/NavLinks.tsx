"use client";

import Link from "next/link";
import { adminNavLinks, navLinks } from "@/lib/content";

type NavItem = { label: string; href: string };
import { isTabActive, useActiveSection, useAdminArea } from "./useNav";

// `publicLinks`: the public links (they include Reviews only when that section exists).
export default function NavLinks({ publicLinks = navLinks }: { publicLinks?: NavItem[] }) {
  const { pathname, admin } = useAdminArea();
  // On the home page, highlight the section that is currently in view.
  const sectionIds = publicLinks.filter((l) => l.href.startsWith("/#")).map((l) => l.href.slice(2));
  const active = useActiveSection(sectionIds, pathname === "/");

  const links = admin ? adminNavLinks : publicLinks;
  const isActive = (href: string) =>
    admin
      ? isTabActive(pathname, href)
      : href.startsWith("/#")
        ? pathname === "/" && active === href.slice(2)
        : pathname.startsWith(href);

  return (
    <ul className="flex items-center gap-4 text-sm text-muted lg:gap-6">
      {links.map((l) => (
        <li key={l.href} className="hidden lg:block">
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
