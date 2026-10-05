// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profile } from "@/test/fixtures";
import type { Profile } from "@/types/content";
import Footer from "./Footer";

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/settings", () => ({ getProfile }));

// Footer is an async server component: call it, then render the element it returns.
const show = async (p: Profile) => {
  getProfile.mockResolvedValue(p);
  render(await Footer());
};

beforeEach(() => getProfile.mockReset());

describe("Footer", () => {
  it("shows the copyright with the current year and a way back to the top", async () => {
    await show(profile({ name: "Jo Doe" }));
    expect(screen.getByText(`© ${new Date().getFullYear()} Jo Doe`)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to top" })).toHaveAttribute("href", "/#hero");
  });

  it("writes the links as paths, but names them by their label only", async () => {
    await show(profile());
    const github = screen.getByRole("link", { name: "GitHub" }); // not "./GitHub"
    expect(github).toHaveTextContent("./GitHub"); // shown in lower case by CSS only
    expect(github).toHaveAttribute("href", "https://github.com/jo");
    expect(github).toHaveAttribute("target", "_blank");
    const resume = screen.getByRole("link", { name: "Resume" });
    expect(resume).toHaveAttribute("href", "/resume.pdf");
    expect(resume).toHaveAttribute("download");
  });

  it("does not repeat your status (it is in the hero, About and Contact)", async () => {
    await show(profile({ status: "Open for projects" }));
    expect(screen.queryByText("Open for projects")).toBeNull();
  });
});
