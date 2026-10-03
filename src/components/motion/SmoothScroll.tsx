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
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => true,
  );

  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ anchors: true, lerp: 0.1 }}>
      {children}
    </ReactLenis>
  );
}
