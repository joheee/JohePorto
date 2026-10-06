// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { post } from "@/test/fixtures";
import { BlogEditor, NewPostButton, PostActions } from "./BlogEditor";

const savePost = vi.hoisted(() => vi.fn());
const deletePost = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/actions", () => ({ savePost, deletePost }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const posts = [post({ slug: "one", title: "First post" }), post({ slug: "two", title: "Second post", status: "draft", publishedAt: "" })];

const setup = () => {
  const user = userEvent.setup();
  render(
    <BlogEditor posts={posts}>
      <NewPostButton />
      <PostActions slug="one" title="First post" published />
      <PostActions slug="two" title="Second post" published={false} />
    </BlogEditor>,
  );
  return { user, modal: () => screen.getByRole("dialog", { name: /post$/i }) };
};

beforeEach(() => {
  savePost.mockReset();
  deletePost.mockReset();
  refresh.mockReset();
  savePost.mockResolvedValue({ ok: true });
  deletePost.mockResolvedValue({ ok: true });
});

describe("BlogEditor", () => {
  it("opens an empty form for a new post and saves it as new", async () => {
    const { user, modal } = setup();
    await user.click(screen.getByRole("button", { name: "New post" }));
    expect(modal()).toHaveAccessibleName("New post");
    await user.type(within(modal()).getByLabelText(/^Title/), "My new post");
    expect(within(modal()).getByLabelText(/^Slug/)).toHaveValue("my-new-post");
    await user.type(within(modal()).getByLabelText(/^Excerpt/), "About it.");
    await user.type(within(modal()).getByLabelText(/^Post text/), "Body");
    await user.click(within(modal()).getByRole("button", { name: "Create post" }));
    await waitFor(() => expect(savePost).toHaveBeenCalledWith(expect.objectContaining({ slug: "my-new-post", title: "My new post", status: "draft", content: "Body" }), true));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("opens the chosen post for editing, with its slug locked, and saves it as an edit", async () => {
    const { user, modal } = setup();
    await user.click(screen.getAllByRole("button", { name: "Edit" })[1]);
    expect(modal()).toHaveAccessibleName("Edit post");
    expect(within(modal()).getByLabelText(/^Title/)).toHaveValue("Second post");
    expect(within(modal()).getByLabelText(/^Slug/)).toHaveAttribute("readonly");
    await user.type(within(modal()).getByLabelText(/^Title/), "!");
    await user.click(within(modal()).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(savePost).toHaveBeenCalledWith(expect.objectContaining({ slug: "two", title: "Second post!" }), false));
  });

  it("asks before throwing away unsaved edits, and closes straight away when nothing changed", async () => {
    const { user, modal } = setup();
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await user.type(within(modal()).getByLabelText(/^Title/), "x");
    await user.click(within(modal()).getByRole("button", { name: "Cancel" }));
    const ask = screen.getByRole("dialog", { name: "Discard your changes?" });
    await user.click(within(ask).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /post$/i })).toBeNull());

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await user.click(within(modal()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Discard your changes?" })).toBeNull();
  });

  it("offers View only for published posts, and deletes by slug after asking", async () => {
    const { user } = setup();
    const views = screen.getAllByRole("link", { name: "View" });
    expect(views).toHaveLength(1);
    expect(views[0]).toHaveAttribute("href", "/blog/one");
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    const ask = screen.getByRole("dialog", { name: "Delete this post?" });
    expect(deletePost).not.toHaveBeenCalled();
    await user.click(within(ask).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deletePost).toHaveBeenCalledWith("one"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
