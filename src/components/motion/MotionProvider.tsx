"use client";

import { MotionConfig } from "motion/react";

// reducedMotion="user": people who ask their OS for less motion get no movement animations.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
