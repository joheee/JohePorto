"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// A textarea that grows and shrinks with its content. `rows` still sets the minimum height.
export default function AutoTextarea({
  className = "",
  ...props
}: React.ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto"; // collapse first so it can also shrink
    const border = el.offsetHeight - el.clientHeight; // border-box: add the borders back
    el.style.height = `${el.scrollHeight + border}px`;
  };

  // Re-measure whenever the text changes (typing, paste, programmatic updates).
  useLayoutEffect(resize, [props.value]);

  // Line wrapping changes with the width, so re-measure when the window resizes.
  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return <textarea ref={ref} className={`${className} resize-none overflow-hidden`} {...props} />;
}
