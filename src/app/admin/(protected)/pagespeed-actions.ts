"use server";

import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { STRATEGIES } from "@/lib/pagespeed/model";
import { runPageSpeed } from "@/lib/pagespeed/run";
import { loadRuns, saveRuns, type SpeedDb } from "@/lib/pagespeed/store";
import { siteUrl } from "@/lib/site";

export type SpeedResult = { ok: true; warning?: string } | { ok: false; error: string };

const COOLDOWN_MS = 90_000; // a test takes about half a minute and Google limits how many it answers

// Tests the live site on mobile and desktop and stores both results. Reachable by direct POST, so it checks the
// owner itself. It tests only the site's own address. Needs about 30 seconds: the Analytics page sets maxDuration.
export async function runSpeedTest(): Promise<SpeedResult> {
  if (!(await getAdmin())) return { ok: false, error: "Not authorized. Please sign in again." };
  if (/^https?:\/\/(localhost|127\.|\[::1\])/.test(siteUrl)) {
    return { ok: false, error: "Google can only test a public address. Run this on the live site (or set NEXT_PUBLIC_SITE_URL)." };
  }
  try {
    const db = adminDb() as unknown as SpeedDb;
    const [last] = await loadRuns(db, 1);
    if (last && Date.now() - new Date(last.at).getTime() < COOLDOWN_MS) {
      return { ok: false, error: "A test ran a moment ago. Wait a minute and try again." };
    }

    const apiKey = process.env.PAGESPEED_API_KEY?.trim() || undefined;
    const settled = await Promise.allSettled(STRATEGIES.map((s) => runPageSpeed(siteUrl, s, { apiKey })));
    const runs = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failure = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (runs.length === 0) return { ok: false, error: failure?.reason instanceof Error ? failure.reason.message : "The test failed." };

    await saveRuns(db, runs);
    revalidatePath("/admin/analytics");
    return { ok: true, warning: failure ? `Only ${runs[0].strategy} finished: ${failure.reason instanceof Error ? failure.reason.message : "the other test failed."}` : undefined };
  } catch (e) {
    console.error("pagespeed test failed:", e instanceof Error ? e.message : e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
