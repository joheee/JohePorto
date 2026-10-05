"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SignOutButton from "@/components/admin/SignOutButton";
import { adminNavLinks, navLinks } from "@/lib/content";
import { useAdminArea } from "./useNav";

// Phone-width navigation: a button that opens a panel with every link.
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { admin } = useAdminArea();
  const links = admin ? adminNavLinks : navLinks;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Tap outside to close. `absolute`, not `fixed`: the header's backdrop-blur would make `fixed` relative to the header. */}
            <motion.button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="absolute inset-x-0 top-full z-30 h-dvh bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.nav
              id="mobile-menu"
              aria-label="Menu"
              className="absolute inset-x-0 top-full z-40 border-b border-border bg-background"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ul className="mx-auto max-w-5xl px-6 py-3">
                {links.map((l) => (
                  <li key={l.href} className="border-b border-border last:border-0">
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-4 text-lg font-medium transition-colors hover:text-accent"
                    >
                      {l.label}
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </Link>
                  </li>
                ))}
                {admin && (
                  <li className="py-4" onClick={() => setOpen(false)}>
                    <SignOutButton />
                  </li>
                )}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
