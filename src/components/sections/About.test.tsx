// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profile } from "@/test/fixtures";
import type { Profile } from "@/types/content";
import About from "./About";

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/settings", () => ({ getProfile }));

// Animation is not what is tested here: motion is replaced by plain elements.
vi.mock("motion/react", () => {
  const plain = (Tag: React.ElementType) => {
    function Plain({ children, className, d }: { children?: React.ReactNode; className?: string; d?: string }) {
      return (
        <Tag className={className} d={d}>
          {children}
        </Tag>
      );
    }
    return Plain;
  };
  return { motion: { li: plain("li"), span: plain("span"), div: plain("div"), path: plain("path") } };
});

// About is an async server component: call it, then render the element it returns.
const show = async (p: Profile) => {
  getProfile.mockResolvedValue(p);
  render(await About({}));
};

const rows = () => [...document.querySelectorAll(".ed-line")].map((r) => r.textContent ?? "");

beforeEach(() => getProfile.mockReset());

describe("About", () => {
  it("puts the bio and the facts in one README.md window instead of separate cards", async () => {
    await show(profile({ bio: ["First paragraph.", "Second paragraph."], location: "Jakarta", status: "Open for projects", focus: "Kubernetes" }));
    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(rows()).toEqual([
      "# About me",
      "",
      "First paragraph.",
      "", // a blank line between paragraphs, like a README
      "Second paragraph.",
      "",
      "## At a glance",
      "location:Jakarta",
      "status:Open for projects",
      "now:Kubernetes",
    ]);
  });

  it("leaves out the facts that are empty, and the whole block when none is set", async () => {
    await show(profile({ location: "", status: "", focus: "Terraform" }));
    expect(rows().filter((r) => r.endsWith(":") || /^[a-z]+:/.test(r))).toEqual(["now:Terraform"]);
    document.body.innerHTML = "";
    await show(profile({ location: "", status: "", focus: "" }));
    expect(screen.queryByText("At a glance")).toBeNull();
  });

  it("still shows the window with only facts, and skills without a window", async () => {
    await show(profile({ bio: [], location: "Jakarta", status: "", focus: "" }));
    expect(rows()).toEqual(["# About me", "", "", "## At a glance", "location:Jakarta"]);
    document.body.innerHTML = "";
    await show(profile({ bio: [], location: "", status: "", focus: "" }));
    expect(screen.queryByText("README.md")).toBeNull();
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });

  it("shows the skills as the pipeline below the window", async () => {
    await show(profile());
    expect(screen.getByText(/pipeline passing/)).toBeInTheDocument();
    expect(within(screen.getByRole("heading", { name: "Languages", level: 4 }).closest("li")!).getByText("Go")).toBeInTheDocument();
  });
});
