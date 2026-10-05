"use client";

import Link from "next/link";
import { siteSectionLinks } from "@/lib/content";
import { useActiveSection, useAdminArea } from "./useNav";

const ids = siteSectionLinks.map((l) => l.href.split("#")[1]);

// A second row of the navbar on /admin/site: jump between the page's sections, like the public links.
// Phones get these links inside the menu (MobileMenu) instead.
export default function SectionBar() {
  const { pathname } = useAdminArea();
  const onSite = pathname === "/admin/site";
  const active = useActiveSection(ids, onSite);
  if (!onSite) return null;

  return (
    <nav aria-label="Sections" className="border-t border-border max-sm:hidden">
      <ul className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-4 py-2 text-[13px] sm:flex sm:gap-1.5 sm:px-6 sm:text-sm">
        {siteSectionLinks.map((l) => {
          const current = active === l.href.split("#")[1];
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={current ? "true" : undefined}
                className={`flex justify-center rounded-full px-2 py-1 transition-colors sm:inline-flex sm:px-3.5 ${
                  current ? "bg-accent/10 font-medium text-accent ring-1 ring-inset ring-accent/30" : "text-muted hover:bg-card hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
