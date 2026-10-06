# johePorto

A personal portfolio for a DevOps and cloud engineer, with a private admin. All public content lives in Firestore and is edited visually from `/admin/site`, so updating the site needs no code change.

**Live:** https://www.johe.my.id

## Features

- **Public site, styled as an infra console:** a hero terminal (typed role, pitch, `terraform plan` of your skills), career-uptime strip, skills as a CI pipeline, projects as files, experience as GitHub-style releases, reviews as PR approvals, and a contact form drawn as an API request builder.
- **Themes:** ten VS Code-style colour themes (Aura Soft Dark by default, Dracula, Nord, Tokyo Night, Gruvbox Light and more), picked from the navbar.
- **Admin (owner-only):**
  - Dashboard with cache refresh, system status and resume check; site editor; blog editor; message inbox.
  - **Analytics:** cookie-free, first-party visit counts (sources, funnel, clicks, countries, tracked links).
  - **Site speed:** a button that runs Google PageSpeed Insights on the live site and keeps the history.
- **SEO and resume:** link previews, sitemap, structured data, and an ATS-friendly PDF at `/resume.pdf` built from your data.
- **Security:** nonce-based CSP, security headers, 3-hour admin sessions.
- **Blog:** Markdown posts written in the admin (`/admin/blogs`: the public list with New, Edit and Delete in a modal, drafts, tags, live preview) and published at `/blog`, styled as a terminal: a searchable listing, code blocks as terminal windows with server-side syntax colours and copy buttons, callouts, a heading outline, and a "latest posts" section on the home page.

## Tech stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, Firebase (Firestore and Auth), `@react-pdf/renderer`, `marked` and Shiki (blog), Vitest. Hosted on Vercel.

## Getting started

Requires Node 22 and a Firebase project with Firestore and Email/Password auth enabled.

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Web app config from the Firebase console |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service-account JSON on one line (server only) |
| `ADMIN_UID` | Firebase Auth UID of the one allowed admin |
| `NEXT_PUBLIC_SITE_URL` | Optional: your custom domain |
| `PAGESPEED_API_KEY` | Free Google API key for the speed test (restrict to the PageSpeed Insights API only) |
| `ANALYTICS_*` | Optional analytics settings |

Create the admin user in Firebase Authentication, put its UID in `ADMIN_UID` and in `firestore.rules`, and publish the rules in the console. Sign in at `/admin/login` and fill in your details on `/admin/site`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (also type-checks tests) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest tests |

Also run `npx tsc --noEmit` before pushing: Vercel type-checks test files, Vitest does not.

## Project structure

```
src/
  app/          pages, admin, API routes
  components/   sections, admin, layout, motion
  lib/          data access, auth, themes, analytics, pagespeed
firestore.rules security rules (publish in the console)
session.md      detailed notes and status
```

## Deploying

Push to `main` and Vercel builds it. Set the same environment variables in Vercel and redeploy after changing them.

## More

See `session.md` for architecture, data model, gotchas and next steps, and `AGENTS.md` for notes on this Next.js version.
