// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { takeEvents } from "@/lib/track";
import ContactForm from "./ContactForm";

const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) });

beforeEach(() => vi.stubGlobal("fetch", reply(200, { ok: true })));
afterEach(() => vi.unstubAllGlobals());

const setup = () => {
  const user = userEvent.setup();
  render(<ContactForm origin="https://www.johe.my.id" />);
  return user;
};
const fill = async (user: ReturnType<typeof userEvent.setup>, name = "Ada", email = "ada@example.com", text = "Hello there") => {
  await user.type(screen.getByLabelText("Your name"), name);
  await user.type(screen.getByLabelText("Your email"), email);
  await user.type(screen.getByLabelText("Message text"), text);
};
const send = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Send" }));

describe("ContactForm as an API request", () => {
  it("shows the endpoint and an empty preview before anything is typed", () => {
    setup();
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("www.johe.my.id/api/contact")).toBeInTheDocument();
    expect(screen.getByLabelText("Request body preview")).toHaveTextContent('"name": "","email": "","text": ""');
    expect(screen.getByText(/press Send, or Ctrl/)).toBeInTheDocument();
  });

  it("updates the JSON preview and the curl line as you type", async () => {
    const user = setup();
    await fill(user, "Ada", "ada@example.com", "It's me");
    expect(screen.getByLabelText("Request body preview")).toHaveTextContent('"name": "Ada"');
    expect(screen.getByLabelText("Request body preview")).toHaveTextContent(`"text": "It's me"`);
    expect(screen.getByText(/curl -X POST 'https:\/\/www.johe.my.id\/api\/contact'/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy the curl command" })).toBeInTheDocument();
  });

  it("counts the message length", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Message text"), "abcd");
    expect(screen.getByText("4/5000")).toBeInTheDocument();
  });
});

describe("checking before sending", () => {
  it("lints every empty field, sends nothing and moves focus to the first one", async () => {
    const user = setup();
    await send(user);
    expect(screen.getByText("✗ name: required")).toBeInTheDocument();
    expect(screen.getByText("✗ email: required")).toBeInTheDocument();
    expect(screen.getByText("✗ text: required")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Your name")).toHaveFocus();
    expect(screen.getByLabelText("Your name")).toHaveAttribute("aria-invalid", "true");
  });

  it("explains an invalid email, and clears the message once it is fixed", async () => {
    const user = setup();
    await fill(user, "Ada", "ada@", "Hi");
    await send(user);
    expect(screen.getByText(/✗ email: must be a valid address/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Your email"), "example.com");
    expect(screen.queryByText(/✗ email/)).toBeNull();
  });
});

describe("sending", () => {
  it("posts the trimmed fields plus the honeypot", async () => {
    const user = setup();
    await fill(user, "  Ada ", " ada@example.com ", "Hello there");
    await send(user);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Ada", email: "ada@example.com", text: "Hello there", website: "" }),
    });
  });

  it("replaces the whole form with the real response once the message is accepted", async () => {
    const user = setup();
    await fill(user);
    await send(user);
    expect(await screen.findByText("200 OK")).toBeInTheDocument();
    expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
    expect(screen.getByText("✓ Message delivered")).toBeInTheDocument();
    // The form, its preview and the curl line are gone.
    expect(screen.queryByLabelText("Your name")).toBeNull();
    expect(screen.queryByLabelText("Request body preview")).toBeNull();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy the curl command" })).toBeNull();
  });

  it("brings the empty form back with Send another, and puts the cursor in the first field", async () => {
    const user = setup();
    await fill(user);
    await send(user);
    await screen.findByText("✓ Message delivered");
    await user.click(screen.getByRole("button", { name: "Send another" }));
    expect(screen.getByLabelText("Your name")).toHaveValue("");
    expect(screen.getByLabelText("Your email")).toHaveValue("");
    expect(screen.getByLabelText("Message text")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
    expect(screen.queryByText("200 OK")).toBeNull();
    expect(screen.queryByText(/✗ /)).toBeNull(); // no lint messages from before
    await waitFor(() => expect(screen.getByLabelText("Your name")).toHaveFocus());
  });

  it("sends with Ctrl+Enter from a field", async () => {
    const user = setup();
    await fill(user);
    await user.keyboard("{Control>}{Enter}{/Control}");
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("shows a refused request as it is, and leaves the form open to fix and send again", async () => {
    vi.stubGlobal("fetch", reply(400, { error: "Invalid input" }));
    const user = setup();
    await fill(user);
    await send(user);
    expect(await screen.findByText("400 Bad Request")).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toHaveValue("Ada"); // nothing is lost, the form is still there
    expect(screen.getByText(/"error": "Invalid input"/)).toBeInTheDocument();
    expect(screen.getByText(/message was not accepted/)).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).not.toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  it("says so when no response arrives", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const user = setup();
    await fill(user);
    await send(user);
    expect(await screen.findByText(/no response: the request could not be sent/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });
});

describe("what the analytics are told", () => {
  it("that the form was started, once, when the first key is typed", async () => {
    takeEvents();
    const user = setup();
    await user.type(screen.getByLabelText("Your name"), "Ada");
    await user.type(screen.getByLabelText("Your email"), "a");
    expect(takeEvents()).toEqual(["contact.started"]);
  });

  it("that a message was sent, only when the server accepted it", async () => {
    takeEvents();
    vi.stubGlobal("fetch", reply(400, { error: "Invalid input" }));
    const user = setup();
    await fill(user);
    await send(user);
    await screen.findByText("400 Bad Request");
    expect(takeEvents()).toEqual(["contact.started"]); // refused: not sent

    vi.stubGlobal("fetch", reply(200, { ok: true }));
    await send(user);
    await screen.findByText("✓ Message delivered");
    expect(takeEvents()).toEqual(["contact.sent"]);
  });
});
