"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// The navbar switches to the admin tabs inside /admin (the login page keeps the public one). This is only
// which links to show: every admin page and action still checks the owner on the server.
export function useAdminArea() {
  const pathname = usePathname();
  return { pathname, admin: pathname.startsWith("/admin") && pathname !== "/admin/login" };
}

// The id of the section currently in view (scroll-spy), while `enabled`.
export function useActiveSection(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of key.split(",")) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key, enabled]);

  return active;
}

export const isTabActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
