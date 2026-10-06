// The heading of the blog pages: ~/blog, in the same mono style as the home page sections (see Section.tsx).
export default function BlogHeading({ path = "blog", kicker }: { path?: string; kicker?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-3">
      {kicker}
      <h1 className="font-mono text-3xl font-bold tracking-tight sm:text-5xl">
        <span aria-hidden className="text-muted">
          ~/
        </span>
        <span className="lowercase">{path}</span>
      </h1>
      <span aria-hidden className="hidden h-px flex-1 bg-border sm:block" />
    </div>
  );
}
