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

  // Line wrapping changes with the width, so re-measure when the window resizes.
  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  });

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
