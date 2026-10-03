import Reveal from "@/components/motion/Reveal";

export default function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-5xl flex-col justify-center px-6 py-20"
    >
      <Reveal>
        <div className="mb-12 flex items-baseline gap-4">
          <span className="font-mono text-sm text-accent">{number}</span>
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">{title}</h2>
          <span aria-hidden className="hidden h-px flex-1 bg-border sm:block" />
        </div>
        {children}
      </Reveal>
    </section>
  );
}
