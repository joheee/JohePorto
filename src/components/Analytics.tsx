"use client";

import { useEffect } from "react";
import { classifyLink } from "@/lib/analytics/classify";
import { SECTION_IDS, type SectionId } from "@/lib/analytics/model";
import { takeEvents, track } from "@/lib/track";

const ENDPOINT = "/api/collect";

// Sends text/plain so the browser does not need a CORS preflight; the server reads it as JSON.
function send(payload: object) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }))) return;
  } catch {
    // fall through to fetch
  }
  void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
}

// Cookie-free visit counting for the public home page (see lib/analytics and the Analytics page in the admin).
// It reports once when the page has loaded (where from, theme, width) and once when the visitor leaves (which
// sections they reached, which links they used). It stores nothing in the browser and does nothing for people
// who send Do Not Track or Global Privacy Control. The server decides what is counted.
export default function Analytics() {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

    const reached = new Set<SectionId>();
    const sentSections = new Set<SectionId>();

    const sendView = () => {
      const params = new URLSearchParams(location.search);
      send({
        kind: "view",
        ref: document.referrer,
        utm: { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") },
        theme: document.documentElement.dataset.mode === "light" ? "light" : "dark",
        width: window.innerWidth,
      });
    };
    // After the page has settled: counting must never compete with showing it.
    // (Safari has no requestIdleCallback, so the types saying it always exists are not the whole truth.)
    const hasIdle = typeof window.requestIdleCallback === "function";
    const start = hasIdle ? window.requestIdleCallback(sendView, { timeout: 4000 }) : window.setTimeout(sendView, 1500);

    // The sections the visitor scrolled to: the one crossing the middle of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) reached.add(e.target.id as SectionId);
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const name = classifyLink({
        href: a.href,
        ownHost: location.host,
        projectSlug: a.closest("article[data-project]")?.getAttribute("data-project"),
        inReviews: !!a.closest("#reviews"),
      });
      if (name) track(name);
    };
    document.addEventListener("click", onClick, true);

    // Leaving: send what is new since the last send (hiding and showing a tab can happen many times).
    const flush = () => {
      const sections = [...reached].filter((s) => !sentSections.has(s));
      const events = takeEvents();
      if (sections.length === 0 && events.length === 0) return;
      sections.forEach((s) => sentSections.add(s));
      send({ kind: "end", sections, events });
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    return () => {
      if (hasIdle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(start);
      else window.clearTimeout(start);
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
