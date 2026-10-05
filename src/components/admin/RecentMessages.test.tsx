// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Message } from "@/types/content";
import RecentMessages from "./RecentMessages";

const msg = (over: Partial<Message> = {}): Message => ({
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  text: "Hello\nthere",
  createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  read: false,
  ...over,
});

describe("RecentMessages", () => {
  it("shows the sender's name, email, initials, time and message, linking to the inbox", () => {
    render(<RecentMessages messages={[msg()]} />);
    const row = screen.getByRole("link");
    expect(row).toHaveAttribute("href", "/admin/messages");
    expect(within(row).getByText("AL")).toBeInTheDocument();
    expect(within(row).getByText(/Ada Lovelace/)).toBeInTheDocument();
    expect(within(row).getByText("ada@example.com")).toBeInTheDocument();
    expect(within(row).getByText("2 hours ago")).toBeInTheDocument();
  });

  it("keeps the line breaks of the message, as the inbox does", () => {
    render(<RecentMessages messages={[msg()]} />);
    expect(screen.getByText(/Hello/)).toHaveClass("whitespace-pre-wrap");
    expect(screen.getByText(/Hello/).textContent).toBe("Hello\nthere");
  });

  it("tells screen readers which messages are unread, and shows the avatar filled for them", () => {
    render(<RecentMessages messages={[msg({ id: "1" }), msg({ id: "2", name: "Bo Peep", read: true })]} />);
    const [unread, read] = screen.getAllByRole("link");
    expect(within(unread).getByText("(unread)")).toBeInTheDocument();
    expect(within(read).queryByText("(unread)")).not.toBeInTheDocument();
    expect(within(unread).getByText("AL")).toHaveClass("bg-accent");
    expect(within(read).getByText("BP")).not.toHaveClass("bg-accent");
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<RecentMessages messages={[]} />);
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });
});
