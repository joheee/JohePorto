// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { job, profile, review } from "@/test/fixtures";
import SettingsForm, { type CardId } from "./SettingsForm";

const saveProfile = vi.hoisted(() => vi.fn());
const saveProfileSection = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/actions", () => ({ saveProfile, saveProfileSection }));

function setup(props: Partial<React.ComponentProps<typeof SettingsForm>> = {}) {
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  const onDirtyChange = vi.fn();
  const user = userEvent.setup();
  render(<SettingsForm initial={profile()} projectStacks={[]} onSaved={onSaved} onCancel={onCancel} onDirtyChange={onDirtyChange} {...props} />);
  return { user, onSaved, onCancel, onDirtyChange };
}

const field = (name: string) => screen.getByLabelText(new RegExp(`^${name}`));
// The last matching field: a newly added entry comes after the existing ones.
const lastField = (name: string) => screen.getAllByLabelText(new RegExp(`^${name}`)).at(-1)!;
// Looked up by selector: the accessibility tree drops the name of a `hidden` element.
const sectionNav = () => document.querySelector("nav[aria-label=Sections]");
const status = () => screen.getByText(/Unsaved changes|All changes saved/);
const save = () => screen.getByRole("button", { name: "Save changes" });
const sentTo = (fn: typeof saveProfile) => fn.mock.calls[0][0] as Record<string, unknown>;

beforeEach(() => {
  saveProfile.mockResolvedValue({ ok: true });
  saveProfileSection.mockResolvedValue({ ok: true });
});

describe("which cards show, and which fields are saved", () => {
  // The editor opens this one form with only some cards. It must save only those cards' fields,
  // otherwise it would overwrite the rest of the profile with stale values.
  const cases: [CardId[], string[], string[]][] = [
    [["hero", "contact"], ["name", "roles", "pitch", "email", "socials"], ["Hero", "Contact & links"]],
    [["about", "skills"], ["bio", "location", "status", "focus", "skillGroups"], ["About", "Skills"]],
    [["experience"], ["experience"], ["Experience"]],
    [["education"], ["education"], ["Education"]],
    [["reviews"], ["reviews"], ["Reviews"]],
  ];

  it.each(cases)("%j saves exactly %j", async (cards, keys, headings) => {
    const { user } = setup({ cards });
    for (const h of ["Hero", "About", "Skills", "Contact & links", "Experience", "Education", "Reviews"]) {
      const heading = screen.queryByRole("heading", { name: h });
      if (headings.includes(h)) expect(heading).toBeInTheDocument();
      else expect(heading).toBeNull();
    }
    // Make the form dirty through any visible card, then save.
    if (cards.includes("hero")) await user.type(field("Name"), "!");
    else if (cards.includes("about")) await user.type(field("Location"), "!");
    else if (cards.includes("experience")) await user.click(screen.getByRole("button", { name: "Add experience" }));
    else if (cards.includes("education")) await user.click(screen.getByRole("button", { name: "Add education" }));
    else await user.click(screen.getByRole("button", { name: "Add review" }));
    // A new empty entry fails the browser's `required` checks, so fill it in when there is one.
    if (cards.includes("experience")) {
      await user.type(lastField("Role"), "SRE");
      await user.type(lastField("Company"), "Acme");
      for (const [label, value] of [["Start date month", "1"], ["Start date year", "2024"], ["End date month", "2"], ["End date year", "2025"]] as const) {
        await user.selectOptions(screen.getAllByLabelText(label).at(-1)!, value);
      }
    }
    if (cards.includes("education")) {
      await user.type(lastField("School"), "MIT");
      await user.type(lastField("Degree"), "BSc");
      for (const [label, value] of [["Start date month", "9"], ["Start date year", "2016"], ["End date month", "7"], ["End date year", "2020"]] as const) {
        await user.selectOptions(screen.getAllByLabelText(label).at(-1)!, value);
      }
    }
    if (cards.includes("reviews")) {
      await user.type(lastField("Name"), "Jane Doe");
      await user.type(lastField("Review"), "Great work.");
    }
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalledTimes(1));
    expect(Object.keys(sentTo(saveProfileSection)).sort()).toEqual([...keys].sort());
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("without `cards` it shows everything, with the side navigation, and saves the whole profile", async () => {
    const { user } = setup();
    for (const h of ["Hero", "About", "Skills", "Contact & links", "Experience", "Education", "Reviews"]) {
      expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
    }
    expect(sectionNav()).not.toHaveAttribute("hidden");
    await user.type(field("Name"), "!");
    await user.click(save());
    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
    expect(Object.keys(sentTo(saveProfile)).sort()).toEqual(
      ["bio", "education", "email", "experience", "focus", "location", "name", "pitch", "reviews", "roles", "skillGroups", "socials", "status"].sort(),
    );
    expect(saveProfileSection).not.toHaveBeenCalled();
  });

  it("hides the side navigation in a scoped form", () => {
    setup({ cards: ["hero"] });
    expect(sectionNav()).toHaveAttribute("hidden");
  });

  it("ignores edits made nowhere visible: a scoped form starts clean", () => {
    setup({ cards: ["hero"] });
    expect(status()).toHaveTextContent("All changes saved");
  });
});

describe("saving, discarding and warnings", () => {
  it("is clean at first, dirty after an edit, clean again when the edit is undone", async () => {
    const { user, onDirtyChange } = setup({ cards: ["hero"] });
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
    await user.type(field("Name"), "!");
    expect(status()).toHaveTextContent("Unsaved changes");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await user.type(field("Name"), "{Backspace}");
    expect(status()).toHaveTextContent("All changes saved");
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("Discard returns to the last saved state, including after a save", async () => {
    const { user } = setup({ cards: ["hero"] });
    await user.type(field("Name"), "A");
    await user.click(save());
    await waitFor(() => expect(status()).toHaveTextContent("All changes saved"));
    await user.type(field("Name"), "B");
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(field("Name")).toHaveValue("Jo DoeA"); // the saved value, not the original
  });

  it("calls onSaved and shows the success message when the save works", async () => {
    const { user, onSaved } = setup({ cards: ["hero"] });
    await user.type(field("Name"), "!");
    await user.click(save());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Saved. The site is updating.")).toBeInTheDocument();
  });

  it("shows the server's error and keeps the changes when the save fails", async () => {
    saveProfileSection.mockResolvedValue({ ok: false, error: "Email is not valid" });
    const { user, onSaved } = setup({ cards: ["hero"] });
    await user.type(field("Name"), "!");
    await user.click(save());
    expect(await screen.findByText("Email is not valid")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent("Unsaved changes");
    expect(field("Name")).toHaveValue("Jo Doe!");
  });

  it("Cancel calls onCancel, and is not shown without a handler", async () => {
    const { user, onCancel } = setup({ cards: ["hero"] });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("warns before unloading only with unsaved changes", async () => {
    const { user } = setup({ cards: ["hero"] });
    const unload = () => {
      const e = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(unload()).toBe(false);
    await user.type(field("Name"), "!");
    expect(unload()).toBe(true);
  });

  it("splits the bio into paragraphs on blank lines", async () => {
    const { user } = setup({ cards: ["about"] });
    await user.clear(field("Bio"));
    await user.type(field("Bio"), "One{Enter}{Enter}Two");
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect(sentTo(saveProfileSection).bio).toEqual(["One", "Two"]);
  });
});

describe("roles", () => {
  it("adds and removes roles as chips", async () => {
    const { user } = setup({ cards: ["hero"] });
    await user.type(screen.getByLabelText("Roles"), "SRE{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove Cloud Engineer" }));
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect(sentTo(saveProfileSection).roles).toEqual(["DevOps Engineer", "SRE"]);
  });
});

describe("skill groups", () => {
  const saveAndRead = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    return sentTo(saveProfileSection).skillGroups as { name: string; items: { name: string; aliases: string[] }[] }[];
  };

  it("moves groups up and down, keeping that order in the payload", async () => {
    const { user } = setup({ cards: ["skills"] });
    expect(screen.getByRole("button", { name: "Move Languages up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move DevOps Tools down" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Move Languages down" }));
    expect((await saveAndRead(user)).map((g) => g.name)).toEqual(["DevOps Tools", "Languages"]);
  });

  it("keeps the aliases of a skill when another skill is added to its group", async () => {
    const { user } = setup({ cards: ["skills"] });
    await user.type(screen.getByLabelText("Languages skills"), "Rust{Enter}");
    const groups = await saveAndRead(user);
    expect(groups[0].items).toEqual([{ name: "Go", aliases: ["Golang"] }, { name: "Rust", aliases: [] }]);
  });

  it("adds and removes whole groups", async () => {
    const { user } = setup({ cards: ["skills"] });
    await user.click(screen.getByRole("button", { name: "Add group" }));
    await user.type(screen.getByLabelText("Group 3 name"), "Cloud");
    await user.type(screen.getByLabelText("Cloud skills"), "AWS{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove group Languages" }));
    expect(await saveAndRead(user)).toEqual([
      { name: "DevOps Tools", items: [{ name: "Terraform", aliases: [] }, { name: "Kubernetes", aliases: ["K8s"] }] },
      { name: "Cloud", items: [{ name: "AWS", aliases: [] }] },
    ]);
  });

  it("lists technologies used in projects that are in no group, and adds them to one", async () => {
    const { user } = setup({
      cards: ["skills"],
      projectStacks: [
        { name: "Zabbix", where: "Project: Monitoring" },
        { name: "Golang", where: "Project: Monitoring" }, // already a skill, spelled differently
      ],
    });
    expect(screen.getByText("Zabbix")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument(); // Golang -> Go variant notice
    await user.selectOptions(screen.getByLabelText("Add Zabbix to a group"), screen.getByRole("option", { name: "DevOps Tools" }));
    const groups = await saveAndRead(user);
    expect(groups[1].items.map((s) => s.name)).toEqual(["Terraform", "Kubernetes", "Zabbix"]);
    expect(screen.queryByLabelText("Add Zabbix to a group")).toBeNull(); // it left the tray
  });

  it("says so when everything is grouped", () => {
    setup({ cards: ["skills"] });
    expect(screen.getByText("Everything you use in your jobs and projects is in a group.")).toBeInTheDocument();
  });
});

describe("experience entries", () => {
  const two = profile({ experience: [job({ role: "First", company: "A" }), job({ role: "Second", company: "B" })] });

  it("opens only the entry asked for (`focusUid`)", () => {
    setup({ cards: ["experience"], initial: two, focusUid: "e1" });
    const toggles = screen.getAllByRole("button", { expanded: undefined }).filter((b) => b.hasAttribute("aria-expanded"));
    expect(toggles.map((b) => b.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
  });

  it("removes an entry only after confirming", async () => {
    const { user } = setup({ cards: ["experience"], initial: two });
    await user.click(screen.getByRole("button", { name: "Remove entry 1" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/First · A will be removed when you save/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.getAllByRole("button", { name: /^Remove entry/ })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Remove entry 1" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove" }));
    expect(screen.getAllByRole("button", { name: /^Remove entry/ })).toHaveLength(1);
    expect(status()).toHaveTextContent("Unsaved changes");

    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    const sent = sentTo(saveProfileSection).experience as { role: string }[];
    expect(sent.map((e) => e.role)).toEqual(["Second"]);
  });

  it("sends dates as numbers, keeps createdAt, and clears the end date when current", async () => {
    const { user } = setup({ cards: ["experience"], initial: profile({ experience: [job({ createdAt: "2022-01-01T00:00:00.000Z" })] }) });
    await user.click(screen.getByLabelText("I am currently working here"));
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect((sentTo(saveProfileSection).experience as unknown[])[0]).toMatchObject({
      role: "DevOps Engineer",
      current: true,
      startMonth: 1,
      startYear: 2022,
      endMonth: null,
      endYear: null,
      createdAt: "2022-01-01T00:00:00.000Z",
    });
  });

  it("refuses to save a new entry that is missing required fields", async () => {
    const { user } = setup({ cards: ["experience"], initial: profile({ experience: [] }) });
    await user.click(screen.getByRole("button", { name: "Add experience" }));
    await user.click(save());
    expect(saveProfileSection).not.toHaveBeenCalled();
  });

  it("suggests skills from the groups for the tech stack, and rewrites to their spelling", async () => {
    const { user } = setup({ cards: ["experience"], initial: profile({ experience: [job({ stack: [] })] }) });
    await user.type(screen.getByLabelText("Tech stack"), "golang{Enter}");
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect((sentTo(saveProfileSection).experience as { stack: string[] }[])[0].stack).toEqual(["Go"]);
  });
});

describe("social links", () => {
  it("adds and removes links", async () => {
    const { user } = setup({ cards: ["contact"] });
    await user.click(screen.getByRole("button", { name: "Add link" }));
    const names = screen.getAllByLabelText("Link name");
    await user.type(names.at(-1)!, "Blog");
    await user.type(screen.getAllByLabelText("Link URL").at(-1)!, "https://blog.example.com");
    await user.click(screen.getAllByRole("button", { name: "Remove link" })[0]);
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect(sentTo(saveProfileSection).socials).toEqual([
      { label: "LinkedIn", href: "http://www.linkedin.com/in/jo/" },
      { label: "Blog", href: "https://blog.example.com" },
    ]);
  });
});

describe("reviews", () => {
  const two = () => profile({ reviews: [review({ name: "Jane Doe", role: "CTO at Acme" }), review({ name: "John Roe", role: "", link: "" })] });

  it("lists the reviews, and opens only the one asked for (`focusUid`)", () => {
    setup({ cards: ["reviews"], initial: two(), focusUid: "r1" });
    const toggles = screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-expanded"));
    expect(toggles.map((b) => b.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
    expect(toggles[0]).toHaveTextContent("Jane Doe"); // the row header names the reviewer
    expect(toggles[0]).toHaveTextContent("CTO at Acme");
  });

  it("sends name, role, text and link, and adds a new review", async () => {
    const { user } = setup({ cards: ["reviews"], initial: profile({ reviews: [] }) });
    expect(screen.getByText("No reviews yet.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add review" }));
    await user.type(lastField("Name"), "Jane Doe");
    await user.type(lastField("Role"), "CTO at Acme");
    await user.type(lastField("Review"), "Great work.");
    await user.type(lastField("Link"), "https://www.linkedin.com/in/jane/");
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect(sentTo(saveProfileSection)).toEqual({
      reviews: [{ name: "Jane Doe", role: "CTO at Acme", text: "Great work.", link: "https://www.linkedin.com/in/jane/" }],
    });
  });

  it("removes a review only after confirming", async () => {
    const { user } = setup({ cards: ["reviews"], initial: two() });
    await user.click(screen.getByRole("button", { name: "Remove review 1" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Jane Doe will be removed when you save/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    await user.click(save());
    await waitFor(() => expect(saveProfileSection).toHaveBeenCalled());
    expect((sentTo(saveProfileSection).reviews as { name: string }[]).map((r) => r.name)).toEqual(["John Roe"]);
  });

  it("refuses to save a review without a name or text", async () => {
    const { user } = setup({ cards: ["reviews"], initial: profile({ reviews: [] }) });
    await user.click(screen.getByRole("button", { name: "Add review" }));
    await user.click(save());
    expect(saveProfileSection).not.toHaveBeenCalled();
  });
});
