// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { postSummary } from "@/test/fixtures";
import PostList from "./PostList";

const posts = [
  postSummary({ slug: "tf", title: "Terraform base", excerpt: "Modules for AWS", tags: ["terraform", "aws"], publishedAt: "2026-10-05T08:00:00.000Z" }),
  postSummary({ slug: "pg", title: "pgBackRest backups", excerpt: "Restore tests", tags: ["postgres"], publishedAt: "2026-09-21T08:00:00.000Z" }),
];
const titles = () => screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

describe("PostList", () => {
  it("lists the posts in the order given, each linking to its page, with its tags and reading time", () => {
    render(<PostList posts={posts} />);
    expect(titles()).toEqual(["Terraform base", "pgBackRest backups"]);
    expect(screen.getByRole("link", { name: /Terraform base/ })).toHaveAttribute("href", "/blog/tf");
    expect(screen.getAllByText("3 min read")).toHaveLength(2);
    expect(screen.getByText("#terraform #aws")).toBeInTheDocument();
    expect(screen.getByText("2 posts")).toBeInTheDocument();
  });

  it("searches as you type and says how many match", async () => {
    render(<PostList posts={posts} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Search posts" }), "restore");
    expect(titles()).toEqual(["pgBackRest backups"]);
    expect(screen.getByText("1 of 2 posts")).toBeInTheDocument();
  });

  it("filters by a tag button, and 'all' clears it", async () => {
    render(<PostList posts={posts} />);
    await userEvent.click(screen.getByRole("button", { name: /^aws/ }));
    expect(titles()).toEqual(["Terraform base"]);
    expect(screen.getByRole("button", { name: /^aws/ })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: /^all/ }));
    expect(titles()).toHaveLength(2);
  });

  it("starts on the tag from the address, and ignores a tag that no post has", () => {
    const { unmount } = render(<PostList posts={posts} initialTag="postgres" />);
    expect(titles()).toEqual(["pgBackRest backups"]);
    unmount();
    render(<PostList posts={posts} initialTag="nope" />);
    expect(titles()).toHaveLength(2);
  });

  it("shows 'no matches' with a way back, and an empty state when there are no posts", async () => {
    const { unmount } = render(<PostList posts={posts} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Search posts" }), "zzz");
    expect(screen.getByText("grep: no matches")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(titles()).toHaveLength(2);
    unmount();
    render(<PostList posts={[]} />);
    expect(screen.getByText("No posts yet")).toBeInTheDocument();
  });
});
