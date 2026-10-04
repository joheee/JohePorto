import Link from "next/link";
import Icon, { type IconName } from "@/components/admin/Icons";
import { buttonClass, ghostButtonClass } from "@/components/admin/fields";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { timeAgo } from "@/lib/format";
import { getMessages } from "@/lib/messages";
import { getProjects } from "@/lib/projects";
import { getProfile } from "@/lib/settings";

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
  await requireAdmin();
  const db = adminDb();

  const [profile, projects, recent, totalSnap, readSnap, profileDoc] = await Promise.all([
    getProfile(),
    getProjects(),
    getMessages(5),
    db.collection("messages").count().get(),
    db.collection("messages").where("read", "==", true).count().get(),
    db.doc("settings/profile").get(),
  ]);

  const totalMessages = totalSnap.data().count;
  // Messages saved before the `read` field existed count as unread.
  const unread = totalMessages - readSnap.data().count;
  const companies = new Set(profile.experience.map((e) => e.company.trim().toLowerCase())).size;
  const lastSaved = profileDoc.exists ? profileDoc.data()?.updatedAt?.toDate?.() : undefined;
  const firstName = profile.name.split(" ")[0];

  // Setup checklist, derived from what is actually saved.
  const checklist: { done: boolean; label: string; hint: string; href: string }[] = [
    { done: !!profile.pitch && profile.bio.length > 0, label: "Write your pitch and bio", hint: "The first thing visitors read.", href: "/admin/settings#hero" },
    { done: profile.skills.length > 0, label: "Add your skills", hint: "Grouped on your site and resume.", href: "/admin/settings#skills" },
    { done: profile.socials.length > 0, label: "Add your social links", hint: "GitHub, LinkedIn and so on.", href: "/admin/settings#contact" },
    { done: profile.experience.length > 0, label: "Add your work experience", hint: "Appears as the timeline.", href: "/admin/settings#experience" },
    { done: projects.length > 0, label: "Add your first project", hint: "The Projects section is empty until you do.", href: "/admin/projects/new" },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);

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
          <Link href="/admin/settings" className={ghostButtonClass}>
            <Icon name="settings" /> Edit settings
          </Link>
          <Link href="/admin/projects/new" className={buttonClass}>
            <Icon name="plus" /> New project
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className={ghostButtonClass}>
            View site <Icon name="external" className="h-3.5 w-3.5" />
          </a>
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
          href="/admin/projects"
          icon="folder"
          label="Projects"
          value={String(projects.length)}
          note={projects.length === 0 ? "Add your first one" : "Shown on your site"}
        />
        <StatCard
          href="/admin/settings#experience"
          icon="briefcase"
          label="Experience"
          value={String(profile.experience.length)}
          note={profile.experience.length === 0 ? "Nothing added yet" : `${profile.experience.length === 1 ? "role" : "roles"} at ${companies} ${companies === 1 ? "company" : "companies"}`}
        />
        <StatCard icon="post" label="Posts" value="–" note="Blog coming soon" />
      </section>

      {/* minmax(0, …): without it a grid column refuses to shrink below its longest unbreakable
          line, so one long message would stretch the whole page instead of being cut off. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
            <ul className="divide-y divide-border">
              {recent.map((m) => (
                <li key={m.id} className="py-3.5 first:pt-0 last:pb-0">
                  <Link href="/admin/messages" className="group flex items-start gap-3">
                    <span aria-hidden className={`mt-2 h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-transparent" : "bg-accent"}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={`truncate text-sm ${m.read ? "font-medium" : "font-semibold"}`}>
                          {m.name}
                          {!m.read && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted">{timeAgo(m.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted group-hover:text-foreground">{m.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="setup-title" className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 id="setup-title" className="text-lg font-semibold tracking-tight">
              {doneCount === checklist.length ? "Your site is complete" : "Get your site ready"}
            </h2>
            <span className="font-mono text-sm text-muted">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
            className="mb-5 mt-3 h-1.5 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
          </div>

          <ul className="space-y-1">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-background"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      c.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border text-transparent"
                    }`}
                  >
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm ${c.done ? "text-muted line-through decoration-border" : "font-medium"}`}>
                      {c.label}
                      <span className="sr-only">{c.done ? " (done)" : " (to do)"}</span>
                    </span>
                    {!c.done && <span className="block text-xs text-muted">{c.hint}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
