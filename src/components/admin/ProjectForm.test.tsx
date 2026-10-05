// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { profile, project } from "@/test/fixtures";
import ProjectForm from "./ProjectForm";

// The server action and the router are the form's only outside world: both are faked.
const saveProject = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/actions", () => ({ saveProject }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const skillGroups = profile().skillGroups;

function setup(props: Partial<React.ComponentProps<typeof ProjectForm>> = {}) {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  const onDirtyChange = vi.fn();
  const user = userEvent.setup();
  render(<ProjectForm skillGroups={skillGroups} onSaved={onSaved} onCancel={onCancel} onDirtyChange={onDirtyChange} {...props} />);
  return { user, onSaved, onCancel, onDirtyChange };
}

// A field's label also contains its counter and hint text, so match on how the label starts.
const field = (name: string) => screen.getByLabelText(new RegExp(`^${name}`));
const title = () => field("Title");
const slug = () => field("Slug");
const status = () => screen.getByText(/Nothing entered yet|Unsaved changes|All changes saved/);

beforeEach(() => {
  saveProject.mockResolvedValue({ ok: true });
});

describe("a new project", () => {
  it("starts empty and untouched", () => {
    setup();
    expect(status()).toHaveTextContent("Nothing entered yet");
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create project" })).toBeInTheDocument();
  });

  it("fills the slug from the title until the slug is edited by hand", async () => {
    const { user } = setup();
    await user.type(title(), "My Cool Project!");
    expect(slug()).toHaveValue("my-cool-project");
    await user.type(slug(), "-x");
    await user.type(title(), " 2");
    expect(slug()).toHaveValue("my-cool-project-x"); // no longer follows the title
  });

  it("does not call the server when required fields are missing", async () => {
    const { user } = setup();
    await user.type(title(), "Only a title");
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(saveProject).not.toHaveBeenCalled();
  });

  it("sends the full payload and reports success", async () => {
    const { user, onSaved } = setup();
    await user.type(title(), "AWS Base");
    await user.type(field("Summary"), "Terraform for AWS");
    await user.type(field("Description"), "• one");
    await user.type(screen.getByLabelText("Stack"), "golang{Enter}");
    await user.selectOptions(screen.getByLabelText("Created month"), "5");
    await user.selectOptions(screen.getByLabelText("Created year"), "2026");
    await user.type(screen.getByLabelText("Link name"), "GitHub");
    await user.type(screen.getByLabelText("Link URL"), "https://github.com/x/y");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(saveProject).toHaveBeenCalledWith(
      {
        title: "AWS Base",
        slug: "aws-base",
        summary: "Terraform for AWS",
        description: "• one",
        stack: ["Go"], // "golang" is rewritten to the catalog spelling
        links: [{ label: "GitHub", href: "https://github.com/x/y" }],
        month: 5,
        year: 2026,
      },
      true, // isNew
    );
    expect(refresh).toHaveBeenCalled();
  });
});

describe("editing a project", () => {
  const existing = project();

  it("starts saved, with the slug locked", () => {
    setup({ initial: existing });
    expect(status()).toHaveTextContent("All changes saved");
    expect(slug()).toHaveAttribute("readonly");
    expect(slug()).toHaveValue("aws-base");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("tracks unsaved changes, and is clean again when the value is put back", async () => {
    const { user, onDirtyChange } = setup({ initial: existing });
    await user.type(title(), "!");
    expect(status()).toHaveTextContent("Unsaved changes");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await user.type(title(), "{Backspace}");
    expect(status()).toHaveTextContent("All changes saved");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("Discard returns to the last saved state", async () => {
    const { user } = setup({ initial: existing });
    await user.type(title(), " changed");
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(title()).toHaveValue("AWS Base Infrastructure");
    expect(status()).toHaveTextContent("All changes saved");
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
  });

  it("saves with isNew false and becomes clean", async () => {
    const { user, onSaved } = setup({ initial: existing });
    await user.type(title(), "!");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(saveProject).toHaveBeenCalledWith(expect.objectContaining({ slug: "aws-base", title: "AWS Base Infrastructure!", month: 5, year: 2026 }), false);
    expect(status()).toHaveTextContent("All changes saved");
  });

  it("shows the server's error and stays open and dirty when saving fails", async () => {
    saveProject.mockResolvedValue({ ok: false, error: "Add at least one link" });
    const { user, onSaved } = setup({ initial: existing });
    await user.type(title(), "!");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Add at least one link")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent("Unsaved changes");
  });

  it("disables the buttons while saving", async () => {
    let finish!: (v: { ok: true }) => void;
    saveProject.mockReturnValue(new Promise((r) => (finish = r)));
    const { user } = setup({ initial: existing });
    await user.type(title(), "!");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    finish({ ok: true });
  });

  it("Cancel calls onCancel", async () => {
    const { user, onCancel } = setup({ initial: existing });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("warns before the page unloads only while there are unsaved changes", async () => {
    const { user } = setup({ initial: existing });
    const unload = () => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(unload()).toBe(false);
    await user.type(title(), "!");
    expect(unload()).toBe(true);
  });
});

describe("links", () => {
  it("always keeps at least one link, and can add and remove others", async () => {
    const { user } = setup({ initial: project({ links: [{ label: "A", href: "https://a.com" }] }) });
    expect(screen.getByRole("button", { name: "Remove link" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Add link" }));
    expect(screen.getAllByLabelText("Link name")).toHaveLength(2);
    await user.click(screen.getAllByRole("button", { name: "Remove link" })[0]);
    expect(screen.getAllByLabelText("Link name")).toHaveLength(1);
    expect(screen.getByLabelText("Link name")).toHaveValue("");
  });

  it("shows one blank row for an older project that has no link", () => {
    setup({ initial: project({ links: [] }) });
    expect(screen.getAllByLabelText("Link URL")).toHaveLength(1);
  });
});
