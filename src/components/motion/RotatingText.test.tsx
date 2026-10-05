// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RotatingText from "./RotatingText";

// The slide animation is not what is tested here (jsdom cannot run it): which word shows is. Motion is
// replaced by plain elements, so a word is swapped at once.
vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { span: ({ children }: { children: React.ReactNode }) => <span>{children}</span> },
}));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("RotatingText", () => {
  it("shows the first word, then moves on to the next", () => {
    render(<RotatingText words={["DevOps Engineer", "Cloud Engineer"]} />);
    expect(screen.getByText("DevOps Engineer")).toBeInTheDocument();
    tick(2600);
    expect(screen.getByText("Cloud Engineer")).toBeInTheDocument();
  });

  it("wraps around to the first word", () => {
    render(<RotatingText words={["A", "B"]} />);
    tick(2600);
    expect(screen.getByText("B")).toBeInTheDocument();
    tick(2600);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  // Regression: with the second role showing, deleting it left the index past the end of the list and the
  // line went blank for good (the timer is off with a single word, so it never recovered).
  it("falls back to a word that still exists when the list shrinks under it", () => {
    const { rerender } = render(<RotatingText words={["DevOps Engineer", "Cloud Engineer"]} />);
    tick(2600);
    expect(screen.getByText("Cloud Engineer")).toBeInTheDocument();
    rerender(<RotatingText words={["DevOps Engineer"]} />);
    expect(screen.getByText("DevOps Engineer")).toBeInTheDocument();
  });

  it("does not rotate a single word", () => {
    render(<RotatingText words={["Only"]} />);
    tick(10_000);
    expect(screen.getByText("Only")).toBeInTheDocument();
  });

  it("renders nothing for an empty list instead of crashing", () => {
    const { container } = render(<RotatingText words={[]} />);
    expect(container.textContent).toBe("");
  });
});
