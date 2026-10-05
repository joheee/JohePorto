import Reveal from "@/components/motion/Reveal";

export default function Section({
  id,
  number,
  title,
  actions,
  children,
}: {
  id: string;
  number: string;
  title: string;
  actions?: React.ReactNode; // admin buttons (/admin/site), shown at the end of the heading row
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20"
    >
      <Reveal>
        <div className="mb-12 flex flex-wrap items-baseline gap-x-4 gap-y-3">
          <span className="font-mono text-sm text-accent">{number}</span>
          {/* A path: "~/" is decoration (hidden from screen readers), the name is shown in lower case by CSS only. */}
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-5xl">
            <span aria-hidden className="text-muted">
              ~/
            </span>
            <span className="lowercase">{title}</span>
          </h2>
          <span aria-hidden className="hidden h-px flex-1 bg-border sm:block" />
          {actions && <div className="ml-auto flex shrink-0 items-center gap-2 self-center">{actions}</div>}
        </div>
        {children}
      </Reveal>
    </section>
  );
}
