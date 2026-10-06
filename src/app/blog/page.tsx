import type { Metadata } from "next";
import BlogHeading from "@/components/blog/BlogHeading";
import PostList from "@/components/blog/PostList";
import { getPosts } from "@/lib/posts";
import { getProfile } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const description = `Notes and write-ups by ${profile.name}: what I built, how it works, and what I learned.`;
  return {
    title: "Blog",
    description,
    alternates: { canonical: "/blog" },
    openGraph: { type: "website", url: "/blog", title: `Blog | ${profile.name}`, description },
    twitter: { card: "summary_large_image", title: `Blog | ${profile.name}`, description },
  };
}

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const [posts, params] = await Promise.all([getPosts(), searchParams]);
  const tag = typeof params.tag === "string" ? params.tag : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20">
      <BlogHeading />
      <PostList posts={posts} initialTag={tag} />
    </div>
  );
}
