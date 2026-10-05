// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import LinkBuilder from "./LinkBuilder";

const link = () => screen.getByLabelText("Tracked link").textContent;

describe("LinkBuilder", () => {
  it("starts with a LinkedIn link", () => {
    render(<LinkBuilder siteUrl="https://www.johe.my.id" />);
    expect(link()).toBe("https://www.johe.my.id/?utm_source=linkedin&utm_medium=social");
    expect(screen.getByRole("button", { name: "LinkedIn" })).toHaveAttribute("aria-pressed", "true");
  });

  it("changes source and medium with a preset", async () => {
    const user = userEvent.setup();
    render(<LinkBuilder siteUrl="https://www.johe.my.id" />);
    await user.click(screen.getByRole("button", { name: "Email signature" }));
    expect(link()).toBe("https://www.johe.my.id/?utm_source=email&utm_medium=email");
    expect(screen.getByRole("button", { name: "Email signature" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "LinkedIn" })).toHaveAttribute("aria-pressed", "false");
  });

  it("builds the link from what you type, cleaned the way the counter reads it", async () => {
    const user = userEvent.setup();
    render(<LinkBuilder siteUrl="https://www.johe.my.id" />);
    await user.clear(screen.getByLabelText("Source"));
    await user.type(screen.getByLabelText("Source"), "My CV!");
    await user.type(screen.getByLabelText("Campaign"), "Q4 2026");
    expect(link()).toBe("https://www.johe.my.id/?utm_source=my-cv&utm_medium=social&utm_campaign=q4-2026");
  });

  it("is just the address when the source is empty", async () => {
    const user = userEvent.setup();
    render(<LinkBuilder siteUrl="https://www.johe.my.id" />);
    await user.clear(screen.getByLabelText("Source"));
    expect(link()).toBe("https://www.johe.my.id/");
  });

  it("can copy the link", () => {
    render(<LinkBuilder siteUrl="https://www.johe.my.id" />);
    expect(screen.getByRole("button", { name: "Copy the tracked link" })).toBeInTheDocument();
  });
});
