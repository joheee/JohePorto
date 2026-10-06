// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { postSummary } from "@/test/fixtures";
import LatestPosts from "./LatestPosts";

vi.mock("motion/react", () => ({
  motion: { div: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div> },
}));

const many = (n: number) => Array.from({ length: n }, (_, i) => postSummary({ slug: `p${i}`, title: `Post ${i}` }));

describe("LatestPosts", () => {
  it("is not on the page without a post", () => {
    const { container } = render(<LatestPosts number="05" posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the three newest as a git log, each linking to its post, and a link to all of them", () => {
    render(<LatestPosts number="05" posts={many(5)} />);
    expect(screen.getByRole("heading", { level: 2, name: "Blog" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Post 0/ })).toHaveAttribute("href", "/blog/p0");
    expect(screen.queryByText("Post 3")).toBeNull();
    expect(screen.getByRole("link", { name: /View all 5 posts/ })).toHaveAttribute("href", "/blog");
    expect(document.getElementById("blog")).not.toBeNull();
  });

  it("says just 'View all posts' when everything is already shown", () => {
    render(<LatestPosts number="05" posts={many(2)} />);
    expect(screen.getByRole("link", { name: /View all posts/ })).toBeInTheDocument();
  });
});
