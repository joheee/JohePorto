// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import ChipsInput from "./ChipsInput";

// The component is controlled, so the tests host it in a tiny stateful wrapper.
function Host({ initial = [] as string[], onChange = vi.fn(), ...rest }: { initial?: string[]; onChange?: (v: string[]) => void } & Partial<React.ComponentProps<typeof ChipsInput>>) {
  const [value, setValue] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); screen.getByTestId("submitted").textContent = "yes"; }}>
      <ChipsInput ariaLabel="Stack" value={value} onChange={(v) => { setValue(v); onChange(v); }} {...rest} />
      <output data-testid="submitted" />
    </form>
  );
}

const chips = () => screen.queryAllByRole("button", { name: /^Remove / }).map((b) => b.getAttribute("aria-label")!.replace("Remove ", ""));

describe("ChipsInput", () => {
  it("adds a chip on Enter, without submitting the surrounding form", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByLabelText("Stack"), "Go{Enter}");
    expect(chips()).toEqual(["Go"]);
    expect(screen.getByTestId("submitted")).toBeEmptyDOMElement();
  });

  it("adds several chips from a comma-separated entry and ignores empty parts", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByLabelText("Stack"), "Go, Rust,, ,Zig,");
    expect(chips()).toEqual(["Go", "Rust", "Zig"]);
  });

  it("ignores duplicates, whatever the case", async () => {
    const user = userEvent.setup();
    render(<Host initial={["Go"]} />);
    await user.type(screen.getByLabelText("Stack"), "go{Enter}");
    expect(chips()).toEqual(["Go"]);
  });

  it("adds what is typed when the field loses focus", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByLabelText("Stack"), "Rust");
    await user.tab();
    expect(chips()).toEqual(["Rust"]);
  });

  it("removes the last chip on Backspace in an empty field, and any chip with its × button", async () => {
    const user = userEvent.setup();
    render(<Host initial={["A", "B", "C"]} />);
    await user.click(screen.getByLabelText("Stack"));
    await user.keyboard("{Backspace}");
    expect(chips()).toEqual(["A", "B"]);
    await user.click(screen.getByRole("button", { name: "Remove A" }));
    expect(chips()).toEqual(["B"]);
  });

  it("stops at the maximum", async () => {
    const user = userEvent.setup();
    render(<Host max={2} />);
    await user.type(screen.getByLabelText("Stack"), "a,b,c,");
    expect(chips()).toEqual(["a", "b"]);
  });

  it("rewrites a name to its canonical spelling with `resolve`", async () => {
    const user = userEvent.setup();
    render(<Host resolve={(n) => (n.toLowerCase() === "golang" ? "Go" : n)} />);
    await user.type(screen.getByLabelText("Stack"), "Golang{Enter}");
    expect(chips()).toEqual(["Go"]);
  });

  describe("suggestions", () => {
    const suggest = (q: string, taken: string[]) => ["Kubernetes", "Kafka"].filter((s) => s.toLowerCase().startsWith(q.toLowerCase()) && !taken.includes(s));

    it("lists matches while typing and picks one with the arrow keys and Enter", async () => {
      const user = userEvent.setup();
      render(<Host suggest={suggest} />);
      await user.type(screen.getByLabelText("Stack"), "k");
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Kubernetes", "Kafka"]);
      await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
      expect(chips()).toEqual(["Kafka"]);
    });

    it("picks a suggestion with the mouse without first committing the half-typed text", async () => {
      const user = userEvent.setup();
      render(<Host suggest={suggest} />);
      await user.type(screen.getByLabelText("Stack"), "ku");
      await user.click(screen.getByRole("option", { name: "Kubernetes" }));
      expect(chips()).toEqual(["Kubernetes"]); // not ["ku", "Kubernetes"]
    });

    it("Escape closes the list and does not reach a surrounding dialog", async () => {
      const user = userEvent.setup();
      const outer = vi.fn();
      render(<div onKeyDown={outer}><Host suggest={suggest} /></div>);
      await user.type(screen.getByLabelText("Stack"), "k");
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(outer).not.toHaveBeenCalledWith(expect.objectContaining({ key: "Escape" }));
    });

    it("does not suggest what is already added", async () => {
      const user = userEvent.setup();
      render(<Host initial={["Kafka"]} suggest={suggest} />);
      await user.type(screen.getByLabelText("Stack"), "k");
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Kubernetes"]);
    });
  });
});
