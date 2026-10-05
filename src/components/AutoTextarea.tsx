"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// A textarea that grows and shrinks with its content. `rows` is the minimum height.
// `maxHeight` (px) caps the growth; beyond it the box scrolls instead.
// Works controlled (value) and uncontrolled (typing is picked up through onInput).
export default function AutoTextarea({
  className = "",
  maxHeight,
  onInput,
  ...props
}: React.ComponentProps<"textarea"> & { maxHeight?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto"; // collapse first so it can also shrink
    const border = el.offsetHeight - el.clientHeight; // border-box: add the borders back
    let height = el.scrollHeight + border;
    if (maxHeight && height > maxHeight) {
      height = maxHeight;
      el.style.overflowY = "auto";
    } else {
      el.style.overflowY = "hidden";
    }
    el.style.height = `${height}px`;
  };

  // Re-measure on mount and whenever a controlled value changes (paste, programmatic updates).
  useLayoutEffect(resize, [props.value, maxHeight]);

  // Re-measure whenever the box's width changes: line wrapping depends on it. This also covers the box
  // appearing (width 0 -> real) when it was mounted inside something hidden, such as the closed <dialog> of
  // the site editor, where scrollHeight reads 0 and the box would stay collapsed until you typed.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth === width) return; // our own height changes land here too
      width = el.offsetWidth;
      resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resize only reads the ref and maxHeight
  }, [maxHeight]);

  return (
    <textarea
      ref={ref}
      className={`${className} resize-none overflow-hidden`}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      {...props}
    />
  );
}
