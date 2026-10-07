// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TerminalPrompt from "./TerminalPrompt";
import type { TerminalData } from "@/lib/terminal";
import { takeEvents } from "@/lib/track";

const data: TerminalData = {
  user: "jo", name: "Jo", email: "jo@x.dev", location: "", status: "", roles: ["Dev"], pitch: "I ship.", bio: [],
  skillGroups: [], socials: [{ label: "GitHub", href: "https://github.com/jo" }], experience: [], projects: [],
};

const setup = () => {
  const user = userEvent.setup();
  render(<TerminalPrompt data={data} delay={1} />);
  return { user, box: screen.getByRole("textbox", { name: /terminal command/i }) };
};

afterEach(() => {
  takeEvents();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute("data-theme");
});

describe("TerminalPrompt", () => {
  it("runs a command on Enter and shows the output", async () => {
    const { user, box } = setup();
    await user.type(box, "cat pitch.txt{Enter}");
    expect(screen.getByRole("log")).toHaveTextContent("I ship.");
    expect(box).toHaveValue("");
  });

  it("recalls earlier commands with the arrow keys", async () => {
    const { user, box } = setup();
    await user.type(box, "whoami{Enter}date{Enter}");
    await user.keyboard("{ArrowUp}");
    expect(box).toHaveValue("date");
    await user.keyboard("{ArrowUp}");
    expect(box).toHaveValue("whoami");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(box).toHaveValue("");
  });

  it("completes with Tab", async () => {
    const { user, box } = setup();
    await user.type(box, "cat pi{Tab}");
    expect(box).toHaveValue("cat pitch.txt ");
  });

  it("clears the output with clear", async () => {
    const { user, box } = setup();
    await user.type(box, "echo hi{Enter}");
    expect(screen.getByRole("log")).toBeInTheDocument();
    await user.type(box, "clear{Enter}");
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
  });

  it("changes the theme and remembers it", async () => {
    const { user, box } = setup();
    await user.type(box, "theme dracula{Enter}");
    expect(document.documentElement.dataset.theme).toBe("dracula");
    expect(localStorage.getItem("theme")).toBe("dracula");
  });

  it("scrolls to a section and reports a missing one", async () => {
    const scrollIntoView = vi.fn();
    const target = document.createElement("div");
    target.id = "contact";
    target.scrollIntoView = scrollIntoView;
    document.body.append(target);
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
    const { user, box } = setup();
    await user.type(box, "cd contact{Enter}");
    expect(scrollIntoView).toHaveBeenCalled();
    await user.type(box, "cd about{Enter}");
    expect(screen.getByRole("log")).toHaveTextContent("no such section on this page");
    target.remove();
  });

  it("opens links without giving the page access to the opener", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user, box } = setup();
    await user.type(box, "open github{Enter}");
    expect(open).toHaveBeenCalledWith("https://github.com/jo", "_blank", "noopener,noreferrer");
  });

  it("counts the first use only, once", async () => {
    const { user, box } = setup();
    await user.type(box, "help{Enter}help{Enter}");
    expect(takeEvents()).toEqual(["terminal.used"]);
  });

  it("never shows typed text as markup", async () => {
    const { user, box } = setup();
    await user.type(box, "echo <img src=x onerror=alert(1)>{Enter}");
    expect(screen.getByRole("log").querySelector("img")).toBeNull();
  });
});
