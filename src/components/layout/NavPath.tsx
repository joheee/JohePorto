"use client";

import { adminPath, sectionPath } from "@/lib/navPath";
import { useActiveSection, useAdminArea } from "./useNav";

const SECTIONS = ["hero", "about", "projects", "experience", "contact"];

// The rest of the prompt after the brand (johevin-blesstowi@portfolio): the path of the section in view, like
// :~/projects, with a blinking cursor. The home page and /admin/site have the same sections, so both follow
// the scroll; the other admin pages show their own path (:~/admin/messages). Decoration (the navbar links
// already say where you are, so it is hidden from screen readers).
// Phones: a second, smaller line under the brand (there is no room beside it), without the colon.
// Tablet and up: on the same line, after the brand. In the admin that line also holds the tabs and the Live web
// and Sign out buttons, so there the path waits for laptop width and is left out in between.
export default function NavPath() {
  const { pathname, admin } = useAdminArea();
  const follows = pathname === "/" || pathname === "/admin/site";
  const active = useActiveSection(SECTIONS, follows);

  const path = follows ? sectionPath(active) : adminPath(pathname);
  if (!path) return null;

  return (
    <p aria-hidden className={`min-w-0 items-center whitespace-nowrap font-mono text-xs md:text-sm ${admin ? "flex md:hidden lg:flex" : "flex"}`}>
      <span className="text-muted max-md:hidden">:</span>
      <span key={path} className="path-in text-accent">
        {path}
      </span>
      <span className="term-cursor ml-1 inline-block h-3.5 w-1.5 bg-muted md:h-4" />
    </p>
  );
}
