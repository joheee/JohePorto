import { useMemo, useState } from "react";
import { ghostButtonClass, inputClass } from "@/components/ui/fields";
import { buildSkillIndex, findUnassigned, findVariants, type SkillUsage } from "@/lib/skills";
import ChipsInput from "../ChipsInput";
import FormCard from "../FormCard";
import Icon, { CHEVRON, CHEVRON_UP, CLOSE, PLUS } from "./Icon";
import { newUid, type Group, type Row } from "./model";

// The skill catalog: groups (in the order shown on the site and the resume), their skills and spellings,
// and a tray for technologies used in jobs and projects that are in no group yet.
export default function SkillsCard({
  groups,
  setGroups,
  experience,
  projectStacks,
}: {
  groups: Group[];
  setGroups: (update: (groups: Group[]) => Group[]) => void;
  experience: Row[]; // as edited right now: their stacks count as "used"
  projectStacks: SkillUsage[];
}) {
  const setGroup = (uid: string, patch: Partial<Group>) => setGroups((all) => all.map((g) => (g.uid === uid ? { ...g, ...patch } : g)));
  // The chips hold names only: keep the aliases of names that stay, give new names none.
  const setGroupNames = (g: Group, names: string[]) =>
    setGroup(g.uid, { items: names.map((n) => g.items.find((s) => s.name.toLowerCase() === n.toLowerCase()) ?? { name: n, aliases: [] }) });
  const addToGroup = (uid: string, ...names: string[]) =>
    setGroups((all) => all.map((g) => (g.uid === uid ? { ...g, items: [...g.items, ...names.map((name) => ({ name, aliases: [] }))] } : g)));

  // Moves a group one place. The order here is the order on the site and on the resume.
  const [moved, setMoved] = useState(""); // spoken to screen readers
  function moveGroup(uid: string, by: -1 | 1) {
    const from = groups.findIndex((g) => g.uid === uid);
    const to = from + by;
    if (from < 0 || to < 0 || to >= groups.length) return;
    const next = [...groups];
    [next[from], next[to]] = [next[to], next[from]];
    setGroups(() => next);
    setMoved(`${next[to].name || "Group"} moved to position ${to + 1} of ${next.length}`);
    // The button may now be disabled (first/last place): keep focus on one that still works.
    requestAnimationFrame(() => {
      const pick = (dir: string) => document.querySelector<HTMLButtonElement>(`[data-move="${uid}:${dir}"]:not(:disabled)`);
      (pick(by === 1 ? "down" : "up") ?? pick(by === 1 ? "up" : "down"))?.focus();
    });
  }

  // Everything used in a job (as edited right now) or a project, checked against the skill groups.
  const skillIndex = useMemo(() => buildSkillIndex(groups), [groups]);
  const usage = useMemo<SkillUsage[]>(
    () => [...experience.flatMap((x) => x.stack.map((name) => ({ name, where: x.company || "A job" }))), ...projectStacks],
    [experience, projectStacks],
  );
  const unassigned = useMemo(() => findUnassigned(usage, skillIndex), [usage, skillIndex]);
  const variants = useMemo(() => findVariants(usage, skillIndex), [usage, skillIndex]);

  return (
    <FormCard id="skills" icon="skills" title="Skills" description="Grouped like on your resume, in the order shown here: on your site each group is a stage of the skills pipeline, top to bottom. Jobs and projects pick from these, so spellings stay consistent.">
      {groups.length === 0 && <p className="text-sm text-muted">No groups yet. Add one, for example &quot;DevOps Tools&quot;.</p>}

      <div className="space-y-3">
        <p role="status" className="sr-only">
          {moved}
        </p>
        {groups.map((g, i) => (
          <div key={g.uid} className="space-y-3 rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2">
              <div className="flex shrink-0 gap-1">
                {([-1, 1] as const).map((by) => {
                  const disabled = by === -1 ? i === 0 : i === groups.length - 1;
                  return (
                    <button
                      key={by}
                      type="button"
                      data-move={`${g.uid}:${by === -1 ? "up" : "down"}`}
                      aria-label={`Move ${g.name || `group ${i + 1}`} ${by === -1 ? "up" : "down"}`}
                      disabled={disabled}
                      onClick={() => moveGroup(g.uid, by)}
                      className="flex h-10 w-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
                    >
                      <Icon d={by === -1 ? CHEVRON_UP : CHEVRON} />
                    </button>
                  );
                })}
              </div>
              <input
                className={inputClass}
                aria-label={`Group ${i + 1} name`}
                placeholder="Group name, e.g. DevOps Tools"
                maxLength={40}
                value={g.name}
                onChange={(e) => setGroup(g.uid, { name: e.target.value })}
              />
              <button
                type="button"
                aria-label={`Remove group ${g.name || i + 1}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
                onClick={() => setGroups((all) => all.filter((x) => x.uid !== g.uid))}
              >
                <Icon d={CLOSE} />
              </button>
            </div>
            <ChipsInput
              ariaLabel={`${g.name || "Group"} skills`}
              value={g.items.map((s) => s.name)}
              onChange={(names) => setGroupNames(g, names)}
              placeholder="e.g. Kubernetes"
              max={40}
            />
            {g.items.length > 0 && (
              <details className="text-sm">
                <summary className="w-fit cursor-pointer text-muted transition-colors hover:text-foreground">
                  Other spellings{g.items.some((s) => s.aliases.length > 0) && ` (${g.items.reduce((n, s) => n + s.aliases.length, 0)})`}
                </summary>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Only for real synonyms, like Go and Golang. Spellings such as React JS and ReactJS already match each other.
                </p>
                <div className="mt-3 space-y-3">
                  {g.items.map((s) => (
                    <div key={s.name} className="grid items-start gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
                      <span className="pt-2.5">{s.name}</span>
                      <ChipsInput
                        ariaLabel={`${s.name} other spellings`}
                        value={s.aliases}
                        onChange={(aliases) => setGroup(g.uid, { items: g.items.map((x) => (x.name === s.name ? { ...x, aliases } : x)) })}
                        placeholder="e.g. Golang"
                        max={8}
                      />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
        <button type="button" className={ghostButtonClass} onClick={() => setGroups((all) => [...all, { uid: newUid(), name: "", items: [] }])}>
          <Icon d={PLUS} /> Add group
        </button>
      </div>

      <div aria-live="polite" className="space-y-4 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm font-medium">Used in jobs and projects</p>
        {unassigned.length === 0 && variants.length === 0 && (
          <p className="text-sm text-muted">Everything you use in your jobs and projects is in a group.</p>
        )}

        {unassigned.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted">Not in a group yet. Add them so they can appear on your resume.</p>
              {unassigned.length > 1 && groups.length > 0 && (
                <select
                  aria-label={`Add all ${unassigned.length} to a group`}
                  value=""
                  onChange={(e) => e.target.value && addToGroup(e.target.value, ...unassigned.map((u) => u.name))}
                  className={`${inputClass} sm:w-48`}
                >
                  <option value="">Add all {unassigned.length} to…</option>
                  {groups.map((g, i) => (
                    <option key={g.uid} value={g.uid}>
                      {g.name || `Group ${i + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <ul className="space-y-2">
              {unassigned.map((u) => (
                <li key={u.name} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">{u.name}</span>
                    <span className="ml-2 text-xs text-muted">{u.where.join(", ")}</span>
                  </span>
                  <select
                    aria-label={`Add ${u.name} to a group`}
                    disabled={groups.length === 0}
                    value=""
                    onChange={(e) => e.target.value && addToGroup(e.target.value, u.name)}
                    className={`${inputClass} sm:w-48`}
                  >
                    <option value="">{groups.length === 0 ? "Add a group first" : "Add to group…"}</option>
                    {groups.map((g, i) => (
                      <option key={g.uid} value={g.uid}>
                        {g.name || `Group ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </div>
        )}

        {variants.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs leading-5 text-muted">Spelled differently from your groups. Saving rewrites them in your jobs and projects.</p>
            <ul className="space-y-1.5 text-sm">
              {variants.map((v) => (
                <li key={`${v.from}>${v.to}`}>
                  <span className="font-mono text-xs text-muted line-through">{v.from}</span> <span aria-label="becomes">→</span>{" "}
                  <span className="font-medium">{v.to}</span>
                  <span className="ml-2 text-xs text-muted">{v.where.join(", ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </FormCard>
  );
}
