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
    <nav aria-label="Sections" className="border-t border-border max-lg:hidden">
      <ul className="mx-auto flex max-w-5xl gap-1.5 px-6 py-2 text-sm">
        {siteSectionLinks.map((l) => {
          const current = active === l.href.split("#")[1];
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={current ? "true" : undefined}
                className={`inline-flex justify-center rounded-full px-3.5 py-1 transition-colors ${
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
