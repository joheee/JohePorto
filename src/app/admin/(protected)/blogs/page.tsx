import { BlogEditor, NewPostButton, PostActions } from "@/components/admin/blogs/BlogEditor";
import BlogHeading from "@/components/blog/BlogHeading";
import PostList from "@/components/blog/PostList";
import { requireAdmin } from "@/lib/auth";
import { getAllPosts, summarize } from "@/lib/posts";

// The blog as visitors see it (the same heading and PostList as /blog), plus drafts and the editor's buttons:
// New post next to the heading, View, Edit and Delete under each post. Edit and New open a modal, like /admin/site.
export default async function AdminBlogsPage() {
  await requireAdmin();
  const posts = await getAllPosts();
  const actions = Object.fromEntries(posts.map((p) => [p.slug, <PostActions key={p.slug} slug={p.slug} title={p.title} published={p.status === "published"} />]));

  return (
    <BlogEditor posts={posts}>
      <BlogHeading actions={<NewPostButton />} />
      <PostList posts={posts.map(summarize)} actions={actions} />
    </BlogEditor>
  );
}
