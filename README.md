# johePorto

A personal portfolio site with a private admin. All public content (name, hero, bio, skills, experience, projects) is stored in Firestore and edited from `/admin`, so no code change is needed to update the site.

**Live:** https://johedotcom.vercel.app

## Features

- **Public site:** hero, about, projects, experience timeline and a contact form, with dark and light themes, smooth scrolling and a mobile menu.
- **Admin (`/admin`):** dashboard, site settings, projects, and an inbox for contact messages. Owner-only.
- **SEO:** link-preview image, sitemap, robots.txt, structured data, custom 404.
- **Planned:** blog, ATS-friendly resume page.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Motion, Lenis
- Firebase: Firestore (data) and Authentication (admin login)
- Hosted on Vercel

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

Then create your admin user in Firebase Authentication, put its UID in `ADMIN_UID` and in `firestore.rules`, and publish the rules in the console. Sign in at `/admin/login` and fill in your details under Settings.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Project structure

```
src/
  app/          pages, admin, API routes, SEO files (robots, sitemap, icons)
  components/   admin forms, layout, motion helpers, page sections
  lib/          Firestore access, auth, validation, formatting
  types/        shared types
firestore.rules security rules (publish in the Firebase console)
session.md      detailed project notes and status
```

## Deploying

Push to `main` and Vercel builds it. Add the same environment variables in Vercel, and redeploy after changing any `NEXT_PUBLIC_*` value.

## More

See `session.md` for architecture, data model, gotchas and next steps, and `AGENTS.md` for notes on this Next.js version.
