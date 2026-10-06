import { Fragment } from "react";
import type { Token, Tokens } from "marked";
import { fenceInfo, headingIds, parseCallout, plainLines, safeHref, type CodeLine } from "@/lib/markdown";
import Callout from "./Callout";
import CodeBlock from "./CodeBlock";

// The key of a code block in the `highlighted` map: its language and its text.
export const codeKey = (lang: string, code: string) => `${lang}\n${code}`;

type Ctx = { ids: Map<Tokens.Heading, string>; highlighted: Record<string, CodeLine[]> };

function Inline({ tokens }: { tokens: Token[] | undefined }) {
  return (
    <>
      {(tokens ?? []).map((t, i) => (
        <Fragment key={i}>{inline(t)}</Fragment>
      ))}
    </>
  );
}

function inline(t: Token): React.ReactNode {
  switch (t.type) {
    case "strong":
      return <strong className="font-semibold">{<Inline tokens={t.tokens} />}</strong>;
    case "em":
      return <em>{<Inline tokens={t.tokens} />}</em>;
    case "del":
      return <del className="text-muted">{<Inline tokens={t.tokens} />}</del>;
    case "codespan":
      return <code className="rounded-md bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.88em]">{(t as Tokens.Codespan).text}</code>;
    case "br":
      return <br />;
    case "link": {
      const link = t as Tokens.Link;
      const href = safeHref(link.href);
      if (!href) return <Inline tokens={link.tokens} />; // a link that is not safe to follow is drawn as plain text
      const external = /^https?:/i.test(href);
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent">
          <Inline tokens={link.tokens} />
        </a>
      );
    }
    case "image":
      return null; // posts have no images
    case "text": {
      const x = t as Tokens.Text;
      return x.tokens ? <Inline tokens={x.tokens} /> : x.text;
    }
    case "escape":
      return (t as Tokens.Escape).text;
    default:
      return "raw" in t ? t.raw : null; // raw HTML and anything unknown are shown as plain text, never as markup
  }
}

function Blocks({ tokens, ctx }: { tokens: Token[]; ctx: Ctx }) {
  return (
    <>
      {tokens.map((t, i) => (
        <Fragment key={i}>{block(t, ctx)}</Fragment>
      ))}
    </>
  );
}

const HEADING = {
  2: "mt-12 scroll-mt-24 font-mono text-2xl font-bold tracking-tight",
  3: "mt-8 scroll-mt-24 font-mono text-lg font-semibold tracking-tight",
  4: "mt-6 scroll-mt-24 font-mono text-base font-semibold",
} as const;

function block(t: Token, ctx: Ctx): React.ReactNode {
  switch (t.type) {
    case "heading": {
      const h = t as Tokens.Heading;
      const level = h.depth <= 2 ? 2 : h.depth === 3 ? 3 : 4;
      const Tag = `h${level}` as "h2" | "h3" | "h4";
      return (
        <Tag id={ctx.ids.get(h)} className={HEADING[level]}>
          <span aria-hidden className="mr-2 select-none text-accent">
            {"#".repeat(level)}
          </span>
          <Inline tokens={h.tokens} />
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p>
          <Inline tokens={(t as Tokens.Paragraph).tokens} />
        </p>
      );
    case "text":
      return (
        <p>
          <Inline tokens={(t as Tokens.Text).tokens ?? [t]} />
        </p>
      );
    case "code": {
      const c = t as Tokens.Code;
      const { lang, title } = fenceInfo(c.lang);
      const lines = ctx.highlighted[codeKey(lang, c.text)] ?? plainLines(c.text, lang);
      return <CodeBlock code={c.text} lang={lang} title={title} lines={lines} />;
    }
    case "blockquote": {
      const q = t as Tokens.Blockquote;
      const callout = parseCallout(q);
      if (callout)
        return (
          <Callout kind={callout.kind}>
            <Blocks tokens={callout.tokens} ctx={ctx} />
          </Callout>
        );
      return (
        <blockquote className="space-y-3 border-l-2 border-border pl-4 text-muted">
          <Blocks tokens={q.tokens} ctx={ctx} />
        </blockquote>
      );
    }
    case "list": {
      const l = t as Tokens.List;
      const Tag = l.ordered ? "ol" : "ul";
      return (
        <Tag start={l.ordered && l.start !== 1 ? Number(l.start) : undefined} className={`space-y-2 pl-6 ${l.ordered ? "list-decimal marker:font-mono marker:text-muted" : "list-disc marker:text-accent"}`}>
          {l.items.map((item, i) => (
            <li key={i} className="pl-1">
              <span className="block space-y-2">
                <Blocks tokens={item.tokens} ctx={ctx} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "table": {
      const tb = t as Tokens.Table;
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-foreground/[0.04] font-mono text-xs">
              <tr>
                {tb.header.map((c, i) => (
                  <th key={i} scope="col" style={{ textAlign: tb.align[i] ?? undefined }} className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                    <Inline tokens={c.tokens} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tb.rows.map((row, r) => (
                <tr key={r} className="border-b border-border last:border-0">
                  {row.map((c, i) => (
                    <td key={i} style={{ textAlign: tb.align[i] ?? undefined }} className="px-3 py-2 align-top">
                      <Inline tokens={c.tokens} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "hr":
      return <hr className="my-10 border-0 border-t border-dashed border-border" />;
    default:
      return null; // blank lines, raw HTML and reference definitions draw nothing
  }
}

// A post's Markdown as React elements. Pure (no hooks, no server code), so the page renders it on the server
// and the admin preview in the browser. `highlighted`: code blocks already coloured by the server (see
// PostBody.tsx); a block that is not in it is drawn without colours.
export default function MarkdownBody({ tokens, highlighted = {} }: { tokens: Token[]; highlighted?: Record<string, CodeLine[]> }) {
  const ctx: Ctx = { ids: headingIds(tokens), highlighted };
  return (
    <div className="space-y-5 text-[17px] leading-8">
      <Blocks tokens={tokens} ctx={ctx} />
    </div>
  );
}
