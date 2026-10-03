import { parseBlocks } from "@/lib/format";

// Renders multi-line text keeping its structure: bullet lines become a list, others paragraphs.
export default function FormattedText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {parseBlocks(text).map((b, i) =>
        b.type === "p" ? (
          <p key={i}>{b.text}</p>
        ) : (
          <ul key={i} className="space-y-1.5">
            {b.items.map((item, j) => (
              <li
                key={j}
                className="relative pl-4 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-accent"
              >
                {item}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
