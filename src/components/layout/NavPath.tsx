"use client";

import { adminPath, blogPath, sectionPath } from "@/lib/navPath";
import { useActiveSection, useAdminArea } from "./useNav";

const SECTIONS = ["hero", "about", "projects", "experience", "reviews", "blog", "contact"];

// The rest of the prompt after the brand (johevin-blesstowi@portfolio): the path of the section in view, like
// :~/projects, with a blinking cursor. The home page and /admin/site have the same sections, so both follow
// the scroll; the other admin pages show their own path (:~/admin/messages). Decoration (the navbar links
// already say where you are, so it is hidden from screen readers).
// Phones: a second, smaller line under the brand (there is no room beside it), without the colon.
// Tablet and up: on the same line, after the brand. The tabs and buttons move into the menu below laptop
// width (1024px), so there is room for it in the admin too.
export default function NavPath() {
  const { pathname, admin } = useAdminArea();
  const follows = pathname === "/" || pathname === "/admin/site";
  const active = useActiveSection(SECTIONS, follows);

  const path = follows ? sectionPath(active) : (adminPath(pathname) ?? blogPath(pathname));
  if (!path) return null;

  return (
    // In the admin the path steps aside from lg up, where the five tabs and two buttons are in the navbar and need
    // the room (a path like ~/admin/analytics would squeeze them). Below lg the tabs are in the menu.
    <p aria-hidden className={`flex min-w-0 items-center whitespace-nowrap font-mono text-xs md:text-sm ${admin ? "lg:hidden" : ""}`}>
      <span className="text-muted max-md:hidden">:</span>
      <span key={path} className="path-in min-w-0 truncate text-accent">
        {path}
      </span>
      <span className="term-cursor ml-1 inline-block h-3.5 w-1.5 bg-muted md:h-4" />
    </p>
  );
}
