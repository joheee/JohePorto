"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks } from "@/lib/content";

const sectionIds = navLinks
  .filter((l) => l.href.startsWith("/#"))
  .map((l) => l.href.slice(2));

export default function NavLinks() {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(null);

  // On the home page, highlight the section that is currently in view.
  useEffect(() => {
    if (pathname !== "/") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [pathname]);

  const isActive = (href: string) =>
    href.startsWith("/#")
      ? pathname === "/" && active === href.slice(2)
      : pathname.startsWith(href);

  return (
    <ul className="flex items-center gap-4 text-sm text-muted sm:gap-6">
      {navLinks.map((l) => (
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
