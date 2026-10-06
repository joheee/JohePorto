import type { Tokens } from "marked";
import { describe, expect, it } from "vitest";
import { copyText, extractHeadings, fenceInfo, hasPrompt, headingIds, headingSlug, lex, parseCallout, plainLines, safeHref } from "./markdown";

describe("headings", () => {
  it("makes ids from the text", () => {
    expect(headingSlug("Why pgBackRest?")).toBe("why-pgbackrest");
    expect(headingSlug("  A  --  B ")).toBe("a-b");
    expect(headingSlug("???")).toBe("section");
  });
  it("lists ## and ### headings for the outline, with unique ids", () => {
    const tokens = lex("# Top\n\n## Setup\n\ntext\n\n### Detail\n\n## Setup\n\n#### Deep");
    expect(extractHeadings(tokens)).toEqual([
      { id: "top", text: "Top", depth: 2 },
      { id: "setup", text: "Setup", depth: 2 },
      { id: "detail", text: "Detail", depth: 3 },
      { id: "setup-2", text: "Setup", depth: 2 },
    ]);
    expect(headingIds(tokens).size).toBe(5);
  });
  it("reads the plain text of a heading with formatting", () => {
    expect(extractHeadings(lex("## Use `terraform` **now**"))[0]).toMatchObject({ text: "Use terraform now", id: "use-terraform-now" });
  });
});

describe("parseCallout", () => {
  const quote = (md: string) => lex(md)[0] as Tokens.Blockquote;
  it("recognises the five kinds, in any case, and keeps the text after the marker", () => {
    const c = parseCallout(quote("> [!warning]\n> Restart needed."))!;
    expect(c.kind).toBe("warning");
    expect(c.tokens[0]).toMatchObject({ type: "paragraph", text: "Restart needed." });
    expect(parseCallout(quote("> [!TIP] Short one"))!.kind).toBe("tip");
    for (const k of ["NOTE", "IMPORTANT", "CAUTION"]) expect(parseCallout(quote(`> [!${k}]\n> x`))!.kind).toBe(k.toLowerCase());
  });
  it("leaves an ordinary quote and an unknown marker alone", () => {
    expect(parseCallout(quote("> Just a quote"))).toBeNull();
    expect(parseCallout(quote("> [!BOGUS]\n> x"))).toBeNull();
  });
});

describe("safeHref", () => {
  it("allows web, mail, same-site and in-page links", () => {
    for (const h of ["https://a.com/x", "http://a.com", "mailto:a@b.co", "/blog", "#top"]) expect(safeHref(h)).toBe(h);
  });
  it("refuses script and data links and protocol-relative addresses", () => {
    for (const h of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.com", "vbscript:x", ""]) expect(safeHref(h)).toBeNull();
  });
});

describe("code blocks", () => {
  it("copies only the commands of a shell block with prompts, and everything otherwise", () => {
    const sh = "$ ls -l\ntotal 0\n$ echo hi\nhi";
    expect(hasPrompt(sh, "bash")).toBe(true);
    expect(copyText(sh, "bash")).toBe("ls -l\necho hi");
    expect(copyText("ls -l\necho hi", "bash")).toBe("ls -l\necho hi");
    expect(copyText("$ not shell", "python")).toBe("$ not shell");
    expect(hasPrompt("$ x", "hcl")).toBe(false);
  });
  it("splits plain lines and tells commands from output", () => {
    expect(plainLines("a\nb\n", "hcl")).toEqual([{ tokens: [{ text: "a" }] }, { tokens: [{ text: "b" }] }]);
    expect(plainLines("$ ls\nfile", "sh")).toEqual([
      { prompt: true, tokens: [{ text: "ls" }] },
      { out: true, tokens: [{ text: "file" }] },
    ]);
  });
  it("reads the language and an optional file name from the fence", () => {
    expect(fenceInfo("hcl title=main.tf")).toEqual({ lang: "hcl", title: "main.tf" });
    expect(fenceInfo("Bash")).toEqual({ lang: "bash", title: "" });
    expect(fenceInfo("title=x.txt")).toEqual({ lang: "", title: "x.txt" });
    expect(fenceInfo(undefined)).toEqual({ lang: "", title: "" });
  });
});
