// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { lex } from "@/lib/markdown";
import MarkdownBody, { codeKey } from "./MarkdownBody";

const show = (md: string, highlighted = {}) => render(<MarkdownBody tokens={lex(md)} highlighted={highlighted} />).container;

describe("MarkdownBody", () => {
  it("draws headings with ids, so the outline can link to them", () => {
    show("# Top\n\n## Setup\n\n### Detail\n\n#### Deep");
    expect(screen.getByRole("heading", { level: 2, name: "Top" })).toHaveAttribute("id", "top");
    expect(screen.getByRole("heading", { level: 2, name: "Setup" })).toHaveAttribute("id", "setup");
    expect(screen.getByRole("heading", { level: 3, name: "Detail" })).toHaveAttribute("id", "detail");
    expect(screen.getByRole("heading", { level: 4, name: "Deep" })).toBeInTheDocument();
  });

  it("draws inline formatting, lists and tables", () => {
    const c = show("A **bold**, *soft* and `code` word.\n\n1. one\n2. two\n\n- a\n- b\n\n| H1 | H2 |\n|---|---|\n| x | y |");
    expect(c.querySelector("strong")?.textContent).toBe("bold");
    expect(c.querySelector("em")?.textContent).toBe("soft");
    expect(c.querySelector("code")?.textContent).toBe("code");
    expect(c.querySelectorAll("ol > li")).toHaveLength(2);
    expect(c.querySelectorAll("ul > li")).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "H2" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "y" })).toBeInTheDocument();
  });

  it("opens web links in a new tab, keeps site links, and draws unsafe links as plain text", () => {
    const c = show("[a](https://a.com) [b](/blog) [c](javascript:alert(1))");
    const links = c.querySelectorAll("a");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(links[1]).not.toHaveAttribute("target");
    expect(c.textContent).toContain("c");
    expect(c.innerHTML).not.toContain("javascript:");
  });

  it("never turns raw HTML or an image into markup", () => {
    const c = show('Hello <script>window.x=1</script> <img src=x onerror="alert(1)">\n\n<div onclick="x()">raw</div>\n\n![alt](https://a.com/i.png)');
    expect(c.querySelector("script")).toBeNull();
    expect(c.querySelector("img")).toBeNull();
    expect(c.querySelector("div[onclick]")).toBeNull();
    expect(c.innerHTML).not.toContain("<script");
  });

  it("draws a [!WARNING] quote as a callout and any other quote as a quote", () => {
    const c = show("> [!WARNING]\n> Restart needed.\n\n> Just a quote");
    const aside = c.querySelector("aside")!;
    expect(within(aside).getByText("WARN")).toBeInTheDocument();
    expect(aside.textContent).toContain("Restart needed.");
    expect(aside.textContent).not.toContain("[!WARNING]");
    expect(c.querySelector("blockquote")?.textContent).toBe("Just a quote");
  });

  it("draws a code block as a window with its file name and a copy button", () => {
    show("```hcl title=main.tf\nresource \"x\" {}\n```");
    expect(screen.getByText("main.tf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
    expect(screen.getByLabelText("main.tf code").textContent).toContain('resource "x" {}');
  });

  it("uses the colours the server worked out, and plain text without them", () => {
    const md = "```bash\n$ ls\n```";
    const plain = show(md);
    expect(plain.querySelector("pre span[style]")).toBeNull();
    const coloured = show(md, { [codeKey("bash", "$ ls")]: [{ prompt: true, tokens: [{ text: "ls", color: "var(--shiki-token-function)" }] }] });
    expect(coloured.querySelector("pre span[style]")).toHaveStyle({ color: "var(--shiki-token-function)" });
  });

  it("marks the prompt of a shell command so it is not selected", () => {
    const c = show("```bash\n$ ls -l\ntotal 0\n```");
    const prompt = c.querySelector("pre [aria-hidden]")!;
    expect(prompt.textContent?.trim()).toBe("$");
    expect(prompt.className).toContain("select-none");
  });
});
