import type { Token, Tokens } from "marked";
import { highlight } from "@/lib/highlight";
import { fenceInfo, type CodeLine } from "@/lib/markdown";
import MarkdownBody, { codeKey } from "./MarkdownBody";

// Every code block, also inside lists and quotes.
function codeBlocks(tokens: Token[]): Tokens.Code[] {
  return tokens.flatMap((t): Tokens.Code[] => {
    if (t.type === "code") return [t as Tokens.Code];
    if (t.type === "list") return (t as Tokens.List).items.flatMap((i) => codeBlocks(i.tokens));
    if (t.type === "blockquote") return codeBlocks((t as Tokens.Blockquote).tokens);
    return [];
  });
}

// The post's text with its code coloured by the server (see lib/highlight.ts).
export default async function PostBody({ tokens }: { tokens: Token[] }) {
  const entries = await Promise.all(
    codeBlocks(tokens).map(async (c) => {
      const { lang } = fenceInfo(c.lang);
      return [codeKey(lang, c.text), await highlight(c.text, lang)] as const;
    }),
  );
  const highlighted: Record<string, CodeLine[]> = Object.fromEntries(entries);
  return <MarkdownBody tokens={tokens} highlighted={highlighted} />;
}
