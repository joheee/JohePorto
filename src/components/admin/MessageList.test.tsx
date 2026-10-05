// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@/types/content";

const setMessageRead = vi.hoisted(() => vi.fn());
const deleteMessage = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/actions", () => ({ setMessageRead, deleteMessage }));

import MessageList from "./MessageList";

const msg = (over: Partial<Message> = {}): Message => ({
  id: "1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  text: "Hello\nthere",
  createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  read: false,
  ...over,
});
const two = () => [msg({ id: "1" }), msg({ id: "2", name: "Bo Peep", email: "bo@example.com", read: true })];

beforeEach(() => {
  setMessageRead.mockReset().mockResolvedValue({ ok: true });
  deleteMessage.mockReset().mockResolvedValue({ ok: true });
});

describe("MessageList", () => {
  it("shows each message with its sender, address, initials, how long ago, and its own line breaks", () => {
    render(<MessageList messages={[msg()]} />);
    const card = screen.getByRole("listitem");
    expect(within(card).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(card).getByText("AL")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "ada@example.com" })).toHaveAttribute("href", "mailto:ada%40example.com");
    expect(within(card).getAllByText("2 hours ago").length).toBeGreaterThan(0);
    expect(within(card).getByText(/Hello/)).toHaveClass("whitespace-pre-wrap");
    expect(within(card).getByText(/Hello/).textContent).toBe("Hello\nthere");
  });

  it("marks a new message, and not a read one", () => {
    render(<MessageList messages={two()} />);
    const [unread, read] = screen.getAllByRole("listitem");
    expect(within(unread).getByText("New")).toBeInTheDocument();
    expect(unread).toHaveAttribute("data-read", "false");
    expect(within(read).queryByText("New")).not.toBeInTheDocument();
  });

  it("replies by mail with a subject", () => {
    render(<MessageList messages={[msg()]} />);
    expect(screen.getByRole("link", { name: /reply/i })).toHaveAttribute("href", expect.stringContaining("subject=Re%3A%20your%20message"));
  });

  it("filters to the unread messages and keeps the counts", async () => {
    render(<MessageList messages={two()} />);
    const user = userEvent.setup();
    expect(screen.getByRole("button", { name: /^All/ })).toHaveTextContent("2");
    expect(screen.getByRole("button", { name: /^Unread/ })).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: /^Unread/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /^Unread/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("explains an empty inbox and an empty unread filter", async () => {
    const { unmount } = render(<MessageList messages={[]} />);
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
    unmount();
    render(<MessageList messages={[msg({ read: true })]} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /^Unread/ }));
    expect(screen.getByText("No unread messages.")).toBeInTheDocument();
    expect(screen.getByText("You are all caught up.")).toBeInTheDocument();
  });

  it("marks a message as read at once, before the server has answered", async () => {
    let answer!: (v: { ok: true }) => void;
    setMessageRead.mockReturnValue(new Promise((r) => (answer = r)));
    render(<MessageList messages={[msg()]} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /mark as read/i }));
    expect(setMessageRead).toHaveBeenCalledWith("1", true);
    expect(await screen.findByRole("button", { name: /mark as unread/i })).toBeInTheDocument();
    expect(screen.queryByText("New")).not.toBeInTheDocument();
    answer({ ok: true });
  });

  it("asks before deleting, and deletes only after confirming", async () => {
    let answer!: (v: { ok: true }) => void;
    deleteMessage.mockReturnValue(new Promise((r) => (answer = r)));
    render(<MessageList messages={two()} />);
    const user = userEvent.setup();
    await user.click(within(screen.getAllByRole("listitem")[0]).getByRole("button", { name: /delete/i }));
    expect(deleteMessage).not.toHaveBeenCalled();
    const dialog = document.querySelector("dialog") as HTMLElement;
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteMessage).toHaveBeenCalledWith("1"));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1)); // gone at once
    answer({ ok: true });
  });

  it("does not delete when the dialog is cancelled", async () => {
    render(<MessageList messages={two()} />);
    const user = userEvent.setup();
    await user.click(within(screen.getAllByRole("listitem")[0]).getByRole("button", { name: /delete/i }));
    await user.click(within(document.querySelector("dialog") as HTMLElement).getByRole("button", { name: /cancel/i }));
    expect(deleteMessage).not.toHaveBeenCalled();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows the server's refusal", async () => {
    setMessageRead.mockResolvedValue({ ok: false, error: "Not authorized. Please sign in again." });
    render(<MessageList messages={[msg()]} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /mark as read/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not authorized");
  });
});
