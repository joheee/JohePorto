// The periods the Analytics page offers, in days.
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

// What the address asks for (?range=7), falling back to 30 days for anything else.
export function parseRange(value: string | string[] | undefined): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}
