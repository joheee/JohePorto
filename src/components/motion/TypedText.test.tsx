// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TypedText from "./TypedText";

// Only what the component reads; "unknown" because a full MediaQueryList is not needed.
const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = ((media: string) => ({ matches, media, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
};

beforeEach(() => {
  vi.useFakeTimers();
  mockMatchMedia(false);
});
afterEach(() => vi.useRealTimers());

// Each step is its own act(): the component schedules its next timer from an effect, which only runs
// between acts, so one long advance would stop after the first timer.
const tick = (ms: number) => {
  for (let t = 0; t < ms; t += 5) act(() => void vi.advanceTimersByTime(5));
};
// The visible (aria-hidden) text, without the screen-reader copy.
const visible = (c: HTMLElement) => c.querySelector("span[aria-hidden]:not(.term-cursor)")!.textContent;

describe("TypedText", () => {
  it("starts with the whole first word", () => {
    const { container } = render(<TypedText words={["DevOps Engineer", "Cloud"]} />);
    expect(visible(container)).toBe("DevOps Engineer");
  });

  it("deletes the word, then types the next one", () => {
    const { container } = render(<TypedText words={["AB", "CDE"]} />);
    tick(2200 + 35); // hold ends, one letter deleted
    expect(visible(container)).toBe("A");
    tick(35 + 250); // empty, then the next word starts
    expect(visible(container)).toBe("");
    tick(70);
    expect(visible(container)).toBe("C");
    tick(70 * 2 + 10);
    expect(visible(container)).toBe("CDE");
  });

  it("wraps around to the first word", () => {
    const { container } = render(<TypedText words={["A", "B"]} />);
    tick(20_000);
    expect(["A", "B", ""]).toContain(visible(container));
    tick(2600 * 3);
    expect(["A", "B", ""]).toContain(visible(container));
  });

  it("gives screen readers every word once", () => {
    const { container } = render(<TypedText words={["A", "B"]} />);
    expect(container.querySelector(".sr-only")!.textContent).toBe("A, B");
  });

  it("does not animate a single word", () => {
    const { container } = render(<TypedText words={["Only"]} />);
    tick(20_000);
    expect(visible(container)).toBe("Only");
  });

  it("stays still for reduced motion", () => {
    mockMatchMedia(true);
    const { container } = render(<TypedText words={["A1", "B2"]} />);
    tick(20_000);
    expect(visible(container)).toBe("A1");
  });

  // Regression (from the old rotating text): a deleted role left the index past the end and the line blank.
  it("falls back to a word that exists when the list shrinks", () => {
    const { container, rerender } = render(<TypedText words={["One", "Two"]} />);
    tick(20_000);
    rerender(<TypedText words={["Solo"]} />);
    tick(5000);
    expect(visible(container)).toBe("Solo");
  });

  it("renders no words for an empty list instead of crashing", () => {
    const { container } = render(<TypedText words={[]} />);
    expect(visible(container)).toBe("");
  });
});
