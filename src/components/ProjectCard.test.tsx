// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { project } from "@/test/fixtures";
import ProjectCard from "./ProjectCard";

describe("ProjectCard", () => {
  it("shows the project as a file: name from the slug and stack, and the date, in the title bar", () => {
    render(<ProjectCard project={project({ slug: "aws-base", stack: ["AWS", "Terraform"], month: 5, year: 2026 })} />);
    expect(screen.getByText("aws-base.tf")).toBeInTheDocument();
    expect(screen.getByText("May 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AWS Base Infrastructure" })).toBeInTheDocument();
  });

  it("lists the description bullets as diff lines, and keeps plain lines as paragraphs", () => {
    const { container } = render(<ProjectCard project={project({ description: "Intro line\n• one\n• two" })} />);
    expect(screen.getByText("Intro line").tagName).toBe("P");
    const added = [...container.querySelectorAll("li.diff-add")].map((li) => li.textContent);
    expect(added).toEqual(["one", "two"]);
  });

  it("shows a git clone command with a copy button for a repository link", () => {
    render(<ProjectCard project={project({ links: [{ label: "GitHub", href: "https://github.com/joheee/aws-base" }] })} />);
    expect(screen.getByText(/git clone https:\/\/github.com\/joheee\/aws-base.git/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy the git clone command" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/joheee/aws-base");
  });

  it("has no clone command when no link is a repository", () => {
    render(<ProjectCard project={project({ links: [{ label: "Demo", href: "https://demo.example.com" }] })} />);
    expect(screen.queryByText(/git clone/)).toBeNull();
    expect(screen.getByRole("link", { name: /Demo/ })).toBeInTheDocument();
  });

  it("shows the stack as chips with no label, and a README file for an unknown stack", () => {
    const { rerender } = render(<ProjectCard project={project({ stack: ["Zabbix", "Debian"] })} />);
    expect(screen.getByText("Zabbix")).toBeInTheDocument();
    expect(screen.getByText("Debian")).toBeInTheDocument();
    expect(screen.queryByText("stack")).toBeNull();
    expect(screen.getByText("aws-base.md")).toBeInTheDocument();
    rerender(<ProjectCard project={project({ stack: [] })} />);
    expect(screen.queryByText("Zabbix")).toBeNull();
  });

  it("puts the admin footer (Edit and Delete) inside the card", () => {
    render(<ProjectCard project={project()} footer={<button>Edit</button>} />);
    expect(within(screen.getByRole("article")).getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
