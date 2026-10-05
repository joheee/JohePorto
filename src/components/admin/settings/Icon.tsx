// The small line icons the settings cards use (an SVG path each).
export default function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export const PLUS = "M12 5v14M5 12h14";
export const TRASH = "M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v6M14 11v6";
export const CHEVRON = "m6 9 6 6 6-6";
export const CHEVRON_UP = "m18 15-6-6-6 6";
export const CLOSE = "M6 6l12 12M18 6L6 18";
