// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CopyButton from "./CopyButton";

afterEach(() => vi.useRealTimers());

describe("CopyButton", () => {
  it("shows only an icon, named by its label", () => {
    render(<CopyButton text="x" label="Copy command" copiedLabel="Command copied" />);
    const button = screen.getByRole("button", { name: "Copy command" });
    expect(button).toHaveTextContent(""); // no visible word
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button).toHaveAttribute("title", "Copy command");
  });

  it("copies the text, confirms with a check and an announcement for two seconds, then goes back", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime }); // installs its own clipboard...
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true }); // ...so ours goes after
    render(<CopyButton text="git clone x" label="Copy command" copiedLabel="Command copied" />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));
    expect(writeText).toHaveBeenCalledWith("git clone x");
    expect(screen.getByRole("button", { name: "Command copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Command copied"); // announced to screen readers

    await act(async () => void vi.advanceTimersByTime(2100));
    expect(screen.getByRole("button", { name: "Copy command" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays quiet when the browser refuses to copy", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    document.execCommand = vi.fn().mockReturnValue(false);
    render(<CopyButton text="x" label="Copy" copiedLabel="Copied!" />);
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument(); // still "Copy", not "Copied!"
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
