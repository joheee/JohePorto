"use client";

import Link from "next/link";
import { siteSectionLinks } from "@/lib/content";
import { useActiveSection, useAdminArea } from "./useNav";

const ids = siteSectionLinks.map((l) => l.href.split("#")[1]);

// A second row of the navbar on /admin/site: jump between the page's sections, like the public links.
export default function SectionBar() {
  const { pathname } = useAdminArea();
  const onSite = pathname === "/admin/site";
  const active = useActiveSection(ids, onSite);
  if (!onSite) return null;

  return (
    <nav aria-label="Sections" className="border-t border-border">
      <ul className="mx-auto flex max-w-5xl items-center gap-1.5 overflow-x-auto px-6 py-2 text-sm">
        {siteSectionLinks.map((l) => {
          const current = active === l.href.split("#")[1];
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={current ? "true" : undefined}
                className={`inline-flex rounded-full px-3.5 py-1 transition-colors ${
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
