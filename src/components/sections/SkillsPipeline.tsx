import PingDot from "@/components/PingDot";
import PipelineStage from "@/components/motion/PipelineStage";
import type { SkillGroup } from "@/types/content";

const chip =
  "cursor-default rounded-full border border-border px-3 py-1 text-sm transition duration-200 hover:border-accent hover:bg-accent/10 hover:text-accent motion-safe:hover:-translate-y-0.5";

const Chips = ({ items }: { items: SkillGroup["items"] }) => (
  <ul className="flex flex-wrap gap-2">
    {items.map((s) => (
      <li key={s.name} className={chip}>
        {s.name}
      </li>
    ))}
  </ul>
);

const tools = (n: number) => `${n} ${n === 1 ? "tool" : "tools"}`;

// The skill groups drawn as a delivery pipeline: each group is a stage, top to bottom in the order set in
// the editor. A lone group is the old flat list, so it stays a plain list (a one-stage pipeline says nothing).
export default function SkillsPipeline({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  if (groups.length === 1) return <Chips items={groups[0].items} />;

  return (
    <div>
      <p className="mb-6 inline-flex items-center gap-2.5 font-mono text-xs text-muted">
        <PingDot />
        pipeline passing · {groups.length} stages · {tools(total)}
      </p>
      <ol>
        {groups.map((g, i) => (
          <PipelineStage key={g.name} index={i} last={i === groups.length - 1} name={g.name} count={tools(g.items.length)}>
            <Chips items={g.items} />
          </PipelineStage>
        ))}
      </ol>
    </div>
  );
}
