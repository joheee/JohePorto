# johePorto: Core Structure

Personal website. Next.js (App Router, TypeScript, Tailwind) hosted on Vercel, Firebase (Firestore + Auth) as the backend.

## Stack
- **Framework:** Next.js 16 + React 19, App Router, `src/` directory, `@/*` import alias
- **Styling:** Tailwind CSS 4
- **Database:** Firebase Firestore (free Spark plan)
- **Auth:** Firebase Auth (admin only)
- **Hosting:** Vercel (Next.js app); Firebase is used only as a backend, not for hosting
- **Package manager:** npm

## Routes

### Public (two pages)
| Route | Purpose |
|---|---|
| `/` | Single-page portfolio, sections scroll top to bottom |
| `/blog` | Post list with tags and search/filter |
| `/blog/[slug]` | Individual post (shareable URL, good for SEO) |

### `/` sections
1. Hero: name, one-line pitch, social links
2. About: short bio, skills
3. Projects: card grid, details open in a modal or expand in place
4. Experience: timeline, optional CV download
5. Latest posts: 3 newest, links to `/blog`
6. Contact: form (saved to Firestore) plus email and socials

### Private
| Route | Purpose |
|---|---|
| `/admin` | Dashboard (Firebase Auth, owner only) |
| `/admin/posts` | Create, edit, publish/draft, delete posts |
| `/admin/projects` | Manage projects |
| `/admin/messages` | Read contact-form messages |

## Firestore collections
- `posts`: title, slug, content (Markdown), tags, status, createdAt
- `projects`: title, slug, summary, stack, links, featured, order
- `messages`: name, email, text, createdAt (contact form)
- `settings`: bio, experience, social links (optionally editable from admin)

## Planned folder layout (`src/`)
```
src/
  app/
    layout.tsx            shared layout, navbar, footer, theme
    page.tsx              home (portfolio sections)
    blog/
      page.tsx            post list
      [slug]/page.tsx     post detail
    admin/                protected admin pages
    api/                  route handlers (contact form, revalidate)
  components/             UI and section components
  lib/
    firebase.ts           client SDK init
    firebase-admin.ts     Admin SDK init (server only)
    posts.ts, projects.ts data access helpers
```

## Rendering and data
- Public pages are statically rendered and revalidated (ISR) when content changes in admin, to keep Firestore reads low.
- Client uses the Firebase web SDK (public config in `NEXT_PUBLIC_FIREBASE_*`).
- Server code and API routes use the Firebase Admin SDK, with the service account stored in a Vercel environment variable.

## Security
- Firestore rules: public read for published content; write only for the owner's UID; contact messages are create-only for the public.
- Rate-limit or add App Check on write endpoints.

## Free-tier notes
- Vercel Hobby is non-commercial.
- Firestore Spark: roughly 50k reads and 20k writes per day, 1 GiB storage.
- Firebase Storage may require the Blaze plan. Verify before relying on it; alternatives are Vercel Blob, Cloudinary, or images in the repo.

## Build order
1. ~~Scaffold Next.js + TypeScript + Tailwind~~ (done)
2. Firebase project, Firestore and Auth, env vars
3. Home page layout and sections
4. Admin login and posts management
5. Blog list and post pages
6. Contact form, security rules, deploy to Vercel
