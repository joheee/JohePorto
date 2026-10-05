// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profile, review } from "@/test/fixtures";
import type { Profile } from "@/types/content";
import Reviews from "./Reviews";

const getProfile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/settings", () => ({ getProfile }));

// Animation is not what is tested here: motion is replaced by plain elements.
vi.mock("motion/react", () => ({
  motion: { div: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div> },
}));

// Reviews is an async server component: call it, then render the element it returns.
const show = async (p: Profile, props: Partial<Parameters<typeof Reviews>[0]> = {}) => {
  getProfile.mockResolvedValue(p);
  const ui = await Reviews({ number: "04", ...props });
  const { container } = render(ui ?? <></>);
  return container;
};

beforeEach(() => getProfile.mockReset());

const two = () =>
  profile({
    reviews: [
      review({ name: "Jane Doe", role: "CTO at Acme", text: "Line one.\nLine two.", link: "https://www.linkedin.com/in/jane/" }),
      review({ name: "John Roe", role: "", link: "" }),
    ],
  });

describe("Reviews", () => {
  it("shows each review like an approving pull-request review", async () => {
    await show(two());
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(2);
    const jane = cards[0];
    expect(within(jane).getByText("Jane Doe")).toBeInTheDocument();
    expect(within(jane).getByText("approved these changes")).toBeInTheDocument();
    expect(within(jane).getByText("CTO at Acme")).toBeInTheDocument();
    expect(within(jane).getByText("Approved")).toBeInTheDocument();
    expect(within(jane).getByText("JD")).toBeInTheDocument(); // the avatar
    const quote = jane.querySelector("blockquote")!;
    expect(quote).toHaveTextContent("Line one. Line two.");
    expect(quote.className).toContain("whitespace-pre-line"); // the line break in the text is shown as one
  });

  it("links to where a review can be checked, and only when there is a link", async () => {
    await show(two());
    const cards = screen.getAllByRole("article");
    const link = within(cards[0]).getByRole("link", { name: /view on linkedin.com/ });
    expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/jane/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(within(cards[1]).queryByRole("link")).toBeNull();
  });

  it("leaves out the role line when there is no role", async () => {
    await show(two());
    expect(within(screen.getAllByRole("article")[1]).queryByText("CTO at Acme")).toBeNull();
  });

  it("counts the approving reviews, in the singular for one", async () => {
    await show(two());
    expect(screen.getByText(/2 approving reviews/)).toBeInTheDocument();
    document.body.innerHTML = "";
    await show(profile({ reviews: [review()] }));
    expect(screen.getByText(/1 approving review$/)).toBeInTheDocument();
  });

  it("is a heading like the other sections, with the number it is given", async () => {
    await show(two(), { number: "05" });
    expect(screen.getByRole("heading", { level: 2, name: "Reviews" })).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(document.getElementById("reviews")).not.toBeNull();
  });

  it("does not exist on the public site when there are no reviews", async () => {
    const container = await show(profile({ reviews: [] }));
    expect(container).toBeEmptyDOMElement();
  });

  it("shows in the editor even when empty, with a hint and the Edit button", async () => {
    await show(profile({ reviews: [] }), { action: <button>Edit reviews</button> });
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit reviews" })).toBeInTheDocument();
  });

  it("puts the editor's Edit and Delete under each review, with the stored index", async () => {
    await show(two(), { action: <button>Edit reviews</button>, entryActions: (r) => <button>Edit {r.name} #{r.index}</button> });
    expect(within(screen.getAllByRole("article")[1]).getByRole("button", { name: "Edit John Roe #1" })).toBeInTheDocument();
  });
});
