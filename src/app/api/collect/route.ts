import { FieldValue } from "firebase-admin/firestore";
import { handleCollect } from "@/lib/analytics/collect";
import { createRateLimiter } from "@/lib/analytics/rateLimit";
import type { Db } from "@/lib/analytics/record";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const allow = createRateLimiter(120, 60_000); // 120 reports a minute from one address

// The page reports a visit here (see components/Analytics.tsx). The rules are in lib/analytics/collect.ts.
export async function POST(request: Request) {
  return handleCollect(request, {
    db: adminDb() as unknown as Db,
    inc: (n) => FieldValue.increment(n),
    env: process.env,
    allow,
  });
}
