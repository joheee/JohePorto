// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrandLink from "./BrandLink";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

describe("BrandLink", () => {
  it("shows the name as the start of a shell prompt, but is named by the real name", () => {
    pathname.value = "/";
    render(<BrandLink name="Johevin Blesstowi" user="johevin-blesstowi" />);
    const link = screen.getByRole("link", { name: "Johevin Blesstowi" });
    expect(link).toHaveTextContent("johevin-blesstowi@portfolio");
    expect(link).toHaveAttribute("href", "/#hero");
  });

  it("goes to the hero of the site editor inside the admin", () => {
    pathname.value = "/admin/messages";
    render(<BrandLink name="Johevin Blesstowi" user="johevin-blesstowi" />);
    expect(screen.getByRole("link", { name: "Johevin Blesstowi" })).toHaveAttribute("href", "/admin/site#hero");
  });
});
