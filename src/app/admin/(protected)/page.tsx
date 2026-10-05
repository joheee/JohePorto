import Link from "next/link";
import { Suspense } from "react";
import Icon, { type IconName } from "@/components/ui/Icons";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { timeAgo } from "@/lib/format";
import { getMessages } from "@/lib/messages";
import { getProjects } from "@/lib/projects";
import { getProfile, getProfileReadAt } from "@/lib/settings";
import RecentMessages from "@/components/admin/RecentMessages";
import RefreshCacheButton from "@/components/admin/RefreshCacheButton";
import SystemStatus, { StatusSkeleton } from "@/components/admin/SystemStatus";

function StatCard({
  href,
  icon,
  label,
  value,
  note,
  highlight = false,
}: {
  href?: string;
  icon: IconName;
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        {href && (
          <Icon name="arrow" className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
        )}
      </div>
      <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight">{value}</p>
      <p className={`mt-2 text-sm ${highlight ? "font-medium text-amber-500" : "text-muted"}`}>{note}</p>
    </>
  );
  const cls = "group block rounded-2xl border border-border bg-card/60 p-5 transition-colors";
  return href ? (
    <Link href={href} className={`${cls} hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={`${cls} opacity-70`}>{body}</div>
  );
}

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const db = adminDb();

  const [profile, projects, recent, totalSnap, readSnap, profileDoc, readAt] = await Promise.all([
    getProfile(),
    getProjects(),
    getMessages(5),
    db.collection("messages").count().get(),
    db.collection("messages").where("read", "==", true).count().get(),
    db.doc("settings/profile").get(),
    getProfileReadAt(),
  ]);

  const totalMessages = totalSnap.data().count;
  // Messages saved before the `read` field existed count as unread.
  const unread = totalMessages - readSnap.data().count;
  const companies = new Set(profile.experience.map((e) => e.company.trim().toLowerCase())).size;
  const lastSaved = profileDoc.exists ? profileDoc.data()?.updatedAt?.toDate?.() : undefined;
  const firstName = profile.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
          <p className="mt-2 text-sm text-muted">
            Here&apos;s what&apos;s happening on your site.
            {lastSaved && <> Profile last saved {timeAgo(lastSaved)}.</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshCacheButton
            title={
              readAt
                ? `The public site's data was last read from Firestore ${timeAgo(readAt)}. It renews every hour, and when you save in the editor. Click to refresh it now.`
                : "Clear the site's cached data so the next visit reads Firestore again."
            }
          />
        </div>
      </header>

      <section aria-label="Overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/admin/messages"
          icon="mail"
          label="Messages"
          value={String(totalMessages)}
          note={unread > 0 ? `${unread} unread` : totalMessages === 0 ? "No messages yet" : "All read"}
          highlight={unread > 0}
        />
        <StatCard
          href="/admin/site#projects"
          icon="folder"
          label="Projects"
          value={String(projects.length)}
          note={projects.length === 0 ? "Add your first one" : "Shown on your site"}
        />
        <StatCard
          href="/admin/site#experience"
          icon="briefcase"
          label="Experience"
          value={String(profile.experience.length)}
          note={profile.experience.length === 0 ? "Nothing added yet" : `${profile.experience.length === 1 ? "role" : "roles"} at ${companies} ${companies === 1 ? "company" : "companies"}`}
        />
        <StatCard icon="post" label="Posts" value="–" note="Blog coming soon" />
      </section>

      {/* Recent messages and the system status side by side from lg, stacked below it. minmax(0, …): without it
          a grid column refuses to shrink below its longest unbreakable line, so one long message would stretch
          the whole page instead of being cut off. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-title" className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id="recent-title" className="text-lg font-semibold tracking-tight">
              Recent messages
            </h2>
            <Link href="/admin/messages" className="text-sm text-muted transition-colors hover:text-foreground">
              View all →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No messages yet. When someone uses your contact form, it shows up here.
            </p>
          ) : (
            <RecentMessages messages={recent} />
          )}
        </section>

        {/* The checks ask Firestore and the site itself: show the page at once and let them fill in. */}
        <Suspense fallback={<StatusSkeleton />}>
          <SystemStatus readAt={readAt} expiresAt={admin.expiresAt} />
        </Suspense>
      </div>
    </div>
  );
}
