"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { refreshSiteCache } from "@/app/admin/(protected)/actions";
import { ghostButtonClass } from "@/components/ui/fields";
import Icon from "@/components/ui/Icons";

// A header button, styled like "Edit site" and "View site": clears the site's cached data so the next visit
// reads Firestore again, then reloads the dashboard. The result shows in the button itself ("Cache cleared"
// for a few seconds); a refusal is written next to it. `title` is the tooltip (when the data was last read).
export default function RefreshCacheButton({ title }: { title?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 3000);
    return () => clearTimeout(t);
  }, [done]);

  function refresh() {
    setError("");
    setDone(false);
    startTransition(async () => {
      const res = await refreshSiteCache();
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <button type="button" onClick={refresh} disabled={pending} title={title} className={ghostButtonClass}>
        <Icon name={done ? "check" : "refresh"} className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Refreshing…" : done ? "Cache cleared" : "Refresh cache"}
      </button>
      <p role="status" className="sr-only">
        {done ? "Cache cleared. The site reads fresh data from now on." : ""}
      </p>
      {error && (
        <p role="alert" className="self-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
