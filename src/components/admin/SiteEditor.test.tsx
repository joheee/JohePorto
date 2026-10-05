// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profile, review } from "@/test/fixtures";
import { ItemActions, SiteEditor } from "./SiteEditor";

const deleteProfileItem = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/actions", () => ({ deleteProfileItem, saveProfile: vi.fn(), saveProfileSection: vi.fn(), saveProject: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const setup = () => {
  const user = userEvent.setup();
  render(
    <SiteEditor profile={profile({ reviews: [review()] })} projectStacks={[]}>
      <ItemActions kind="review" index={2} label="Jane Doe|CTO at Acme" name="Jane Doe, CTO at Acme" />
    </SiteEditor>,
  );
  return user;
};

beforeEach(() => {
  deleteProfileItem.mockReset();
  refresh.mockReset();
  deleteProfileItem.mockResolvedValue({ ok: true });
});

describe("ItemActions for a review", () => {
  it("asks first, then deletes that entry by kind, index and label, and refreshes the page", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: /Delete this review\?/ });
    expect(within(dialog).getByText(/Jane Doe, CTO at Acme/)).toBeInTheDocument();
    expect(within(dialog).getByText(/removed from your site\./)).toBeInTheDocument();
    expect(deleteProfileItem).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteProfileItem).toHaveBeenCalledWith("review", 2, "Jane Doe|CTO at Acme"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("does nothing when you cancel", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(deleteProfileItem).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows the server's reason when it refuses, and refreshes so the page is up to date", async () => {
    deleteProfileItem.mockResolvedValue({ ok: false, error: "This entry changed. Refresh the page and try again." });
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This entry changed");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
