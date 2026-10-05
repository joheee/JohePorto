"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mql = matchMedia(query);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

// Lenis smooth scrolling, skipped for people who prefer reduced motion.
// The server snapshot is "not reduced" on purpose: the server renders the Lenis wrapper, so the first client
// render must too. With the opposite default, hydration swapped a fragment for the wrapper, which remounted the
// whole page and replayed the hero entrance a second time. (Reduced-motion visitors remount once instead, but
// they have no entrance animations to replay.)
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  );

  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ anchors: true, lerp: 0.1 }}>
      {children}
    </ReactLenis>
  );
}
