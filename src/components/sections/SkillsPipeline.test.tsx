// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { profile } from "@/test/fixtures";
import SkillsPipeline from "./SkillsPipeline";

// The stage animation is not what is tested here: motion is replaced by plain elements.
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

const groups = profile().skillGroups; // Languages (1 skill), DevOps Tools (2 skills)

describe("SkillsPipeline", () => {
  it("draws each group as a stage, in the given order, with its tool count", () => {
    render(<SkillsPipeline groups={groups} />);
    const stages = screen.getAllByRole("listitem").filter((li) => within(li).queryByRole("heading", { level: 4 }));
    expect(stages.map((li) => within(li).getByRole("heading", { level: 4 }).textContent)).toEqual(["Languages", "DevOps Tools"]);
    expect(within(stages[0]).getByText("1 tool")).toBeInTheDocument(); // singular
    expect(within(stages[1]).getByText("2 tools")).toBeInTheDocument();
  });

  it("lists every skill of a group inside its stage", () => {
    render(<SkillsPipeline groups={groups} />);
    const devops = screen.getByRole("heading", { name: "DevOps Tools" }).closest("li")!;
    expect(within(devops).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Terraform", "Kubernetes"]);
  });

  it("summarises the stages and the total number of tools", () => {
    render(<SkillsPipeline groups={groups} />);
    expect(screen.getByText(/pipeline passing · 2 stages · 3 tools/)).toBeInTheDocument();
  });

  // A profile with a single group is the old flat skills list: no stage, no pipeline claim.
  it("shows a lone group as a plain list", () => {
    render(<SkillsPipeline groups={[groups[1]]} />);
    expect(screen.queryByText(/pipeline passing/)).toBeNull();
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Terraform", "Kubernetes"]);
  });

  it("renders nothing without groups", () => {
    const { container } = render(<SkillsPipeline groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
