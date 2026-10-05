// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Section from "./Section";

vi.mock("motion/react", () => ({
  motion: { div: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div> },
}));

describe("Section heading", () => {
  it("is a path in the page (~/about) but is named just by the section title for screen readers", () => {
    render(
      <Section id="about" number="01" title="About">
        <p>content</p>
      </Section>,
    );
    const heading = screen.getByRole("heading", { level: 2, name: "About" });
    expect(heading).toHaveTextContent("~/About"); // shown in lower case by CSS only
    expect(heading.querySelector("[aria-hidden]")?.textContent).toBe("~/");
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(document.getElementById("about")).not.toBeNull();
  });

  it("shows the editor's actions next to the heading", () => {
    render(
      <Section id="x" number="02" title="Projects" actions={<button>New project</button>}>
        <p>content</p>
      </Section>,
    );
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });
});
