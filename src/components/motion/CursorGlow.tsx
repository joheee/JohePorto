"use client";

import { useEffect, useRef } from "react";

// A soft glow behind the whole page that follows the mouse. It is a fixed layer, so it stays with the
// viewport while you scroll. On touch devices (no hover) it is hidden entirely; without JavaScript it
// drifts slowly (CSS), and for reduced-motion users it stays put. Only a compositor-friendly `transform`
// is animated.
export default function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glow.current;
    if (!el) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const go = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    // The glow rests at 70% / 30% of the viewport (see the classes below): move it by the cursor's offset from there.
    const onMove = (e: PointerEvent) => {
      tx = e.clientX - innerWidth * 0.7;
      ty = e.clientY - innerHeight * 0.3;
      go();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      go();
    };
    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [@media(hover:none)]:hidden">
      <div ref={glow} className="absolute left-[70%] top-[30%] size-[36rem] -translate-x-1/2 -translate-y-1/2 will-change-transform">
        <div className="cursor-glow size-full rounded-full" />
      </div>
    </div>
  );
}
