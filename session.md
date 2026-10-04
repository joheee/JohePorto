# johePorto: Core Context

Personal portfolio site. Next.js (App Router, TypeScript, Tailwind) on Vercel, Firebase (Firestore + Auth) as the backend.
All public content (name, hero, bio, skills, experience, education, projects) lives in Firestore and is edited from a private admin. The same data generates an ATS-friendly resume PDF.

- **Live:** https://www.johe.my.id (custom domain; the apex `johe.my.id` redirects to `www`, and `johedotcom.vercel.app` still works and canonicalises to `www`). Vercel project `johedotcom`.
- **Firebase project:** `joheportobackend` (one project shared by local dev and production: same data, same rules)
- **Repo:** github.com/joheee/JohePorto, branch `main`
- **Read first:** `AGENTS.md`. This is Next.js 16: APIs differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code.

---

## Status

| Area | State |
|---|---|
| Scaffold, Firebase (Firestore, Auth), env vars | Done |
| Public home page (hero, about, projects, experience, contact) | Done, data-driven from Firestore |
| Admin: login, dashboard, settings, projects, messages inbox | Done |
| SEO (meta, OG image, robots, sitemap, JSON-LD, icons, 404/error pages) | Done (Lighthouse 100 SEO / 100 a11y) |
| **Blog** (`/blog`, `/blog/[slug]`, `/admin/posts`, "Latest posts") | **Not started** (the main open item) |
| ATS-friendly resume PDF (`/resume.pdf`), hero/footer download buttons, admin Resume card | Done (see "Resume PDF") |
| Resume data model: education, per-job location + tech stack, grouped skill catalog | Done (forms + public display) |
| Resume data entry by the owner (6 projects with bullets, leftover skills) | **Open (owner's part)** |
| Contact-form rate limiting / App Check, email notification | Not started |

The navbar has **no Blog link** on purpose until the blog exists (it caused a 404, a console error and a broken link for crawlers). Re-add `{ label: "Blog", href: "/blog" }` to `navLinks` in `src/lib/content.ts` when `/blog` ships, and add `/blog` + each post to `src/app/sitemap.ts`.

---

## Stack
- Next.js 16.3 (Turbopack) + React 19, App Router, `src/`, alias `@/*`; Tailwind CSS 4; TypeScript
- Firebase web SDK (`firebase` 12) on the client, **`firebase-admin` 13** on the server (see gotchas: do not upgrade to 14 casually)
- `motion` (animations), `lenis` (smooth scroll), `@react-pdf/renderer` 4 (resume PDF; Next lists it as a default server-external package, no config needed)
- npm; Node **22.x** (`engines` in package.json)
- Hosting: Vercel Hobby (non-commercial). Firebase is backend only.

## Routes

### Public
| Route | Notes |
|---|---|
| `/` | Static (ISR). Sections: Hero, About (bento: bio left, location/status/now right, skills as a full-width row of labelled groups), Projects, Experience (timeline + an Education timeline under it), Contact. JSON-LD (Person + WebSite). |
| `/resume.pdf` | Static (cached) text PDF built from the profile and projects; rebuilt when profile or projects are saved. Hero "Download resume" button and footer "Resume" link point here. |
| `/robots.txt`, `/sitemap.xml` | Generated. Robots blocks `/admin` and `/api/`. Sitemap currently lists only `/`. |
| `/opengraph-image`, `/twitter-image`, `/icon`, `/apple-icon` | Generated PNGs (1200x630 card from the profile; initial-letter icons). Card revalidates hourly. |
| 404 / error | `not-found.tsx` (noindex), `error.tsx` |

### Private (`/admin`, noindex)
| Route | Purpose |
|---|---|
| `/admin/login` | Email + password (Firebase Auth), show/hide password |
| `/admin` | Dashboard: stat cards, recent messages, setup checklist, **Resume card** (Preview PDF, Download, what to improve), quick actions |
| `/admin/settings` | One form for the whole profile: Hero, About, **Skills** (grouped catalog, aliases, up/down reorder, "used but not grouped" tray), Contact & links, Experience (location, tech stack), **Education** |
| `/admin/projects`, `/new`, `/[slug]` | List, create, edit, delete projects. The list uses the **same cards as the public site** (shared `ProjectCardContent`) in a 1/2/3-column grid, with the project's link pills under the card and Edit and Delete (confirm modal) at the bottom. The form mirrors Settings: Basics / Details / Links cards, chip input for the stack, counters, floating save bar with unsaved-changes tracking. The slug is auto-filled from the title on new projects and locked (with a lock icon) on edit. |
| `/admin/messages` | Inbox: read/unread, reply (mailto), delete |
| `/admin/posts` | **Planned** (dashboard shows "Posts: Blog coming soon") |

### API
- `POST /api/contact`: validates, honeypot, saves to `messages` (Admin SDK). **No rate limiting yet.**
- `POST /api/auth/session` / `DELETE`: exchanges a fresh Firebase ID token for an httpOnly session cookie (owner only) / signs out.

## Firestore data model

**`settings/profile`** (single document, the whole public profile)
`name`, `roles[]` (rotating hero line), `pitch`, `email`, `location`, `status`, `focus` ("Now" tile), `bio[]` (paragraphs), `skillGroups[{name, items[{name, aliases[]}]}]` (the skill catalog, edited in Settings > Skills) with a derived flat `skills[]` (names only, never edited; a profile that only has legacy `skills` shows them as one group "Skills"), `socials[{label,href}]`, `experience[]`, `education[]`, `updatedAt`.
Each `experience` item: `role`, `company`, `summary` (lines starting with `•` or `-` render as bullets), `location` (optional, shown after the company; older entries have none), `stack[]` (technologies, shown as chips under the entry; older entries have none), `current` (bool), `startMonth`, `startYear`, `endMonth|null`, `endYear|null`, `createdAt` (Firestore **Timestamp**, kept on edit, stamped when an entry is first saved). Sorted on the site LinkedIn-style: current roles first, then by end date, then start date. Experience is a free-order array in the admin; sorting is display-only.
Each `education` item: `school`, `degree`, `location` (optional), `summary` (same bullet formatting, e.g. GPA), `current`, start/end month+year like experience. Shown on the site as a second timeline under Experience (newest first, same sorter); edited in Settings > Education. Older profiles without the field load as `[]`.
Skills catalog rules (`lib/skills.ts`, pure): names match on a normalised key (lowercase, letters/digits/`+`/`#` only), so React JS = ReactJS = react.js; real synonyms use `aliases` (Go / Golang). A spelling can belong to one skill only (validated). Job and project `stack` chips suggest catalog skills while typing (`ChipsInput` `suggest`/`resolve`). Settings > Skills shows a tray of stack names not in any group (add one by one or all at once) and spelling variants. **Saving the profile rewrites every job stack and every project stack to the catalog spelling** (project `updatedAt` untouched); `saveProject` does the same for that project. Group order is the array order (Settings > Skills has Up/Down buttons per group, keyboard- and screen-reader-friendly); it drives the public tile and the resume. The public About tile shows the groups (no heading when there is only one group).
Fallback: if the document is missing/invalid the site shows placeholder content from `src/lib/content.ts` (`defaultProfile`).

**`projects/{slug}`** (document ID = slug, immutable)
`title`, `summary`, `description` (same bullet formatting), `stack[]`, `links[{label,href}]` (**at least one required when saving**; older projects with none still load and show one blank row to fill in), **`month`, `year`** (manual "Created" date, required), `updatedAt`.
Shown **oldest first** by month/year, ties by title. No `order` field any more.
Legacy: a project saved before month/year existed (currently `postgresql-physical-backup-with-pgbackrest`, still has `order: 0`) falls back **at read time** to the month it was last saved (shows "Oct 2026"). Edit it in `/admin/projects` to set the real date.

**`messages/{id}`**: `name`, `email`, `text`, `read` (bool; missing = unread), `createdAt` (Timestamp). Written by the API route only.

**`posts/{id}`**: planned (`title`, `slug`, `content` Markdown, `tags`, `status`, `createdAt`). Rules already exist.

**Leftover junk from early open-rules tests, safe to delete in the console:** `posts/gnsBWLddPHkVuJapWb2C`, `projects/yY5zllSxhqxAYzSr5lAw`, `settings/main`. (The post would appear on the blog once it exists.)

**Current data state (end of this session, shared Firestore):** `settings/profile` has 6 experience entries (BINUS Teaching Assistant, BINUS Network Administrator, Paxel Indonesia, Virtue Digital Indonesia (renamed from Lacak.io, Tangerang), NobleProg, Kolosal AI), each with location and tech stack from the owner's `Resume_Johevin.pdf` (Kolosal AI has location only, no stack); 1 education entry (BINUS, GPA + Coobie bullet); **7 skill groups** (DevOps Tools, Languages, Backend Framework, Fullstack Framework, Frontend Framework, Database, Cloud; 44 skills; aliases: Go/Golang, Kubernetes/K8s, Bash Script/Bash, PostgreSQL/Postgres, React JS/React); 1 real project (`postgresql-physical-backup-with-pgbackrest`, July 2026, one paragraph description, one link). Stack names used in jobs/projects but in no group yet: Debian, GitHub, Network Infrastructure, Networking, PgBackRest, REST APIs, Shell Script, Ubuntu, Unity, Zabbix. Saving Settings will rewrite `Golang` to `Go` and `ReactJS` to `React JS` in stacks.

### Security rules (`firestore.rules`, must be published in the console by hand)
Owner = a single hard-coded UID. Public read: published posts, projects, settings. Public create-only on `messages` (field/size limits). Everything else owner-only. **The app itself uses the Admin SDK (bypasses rules)**, so rules protect against direct client access with the public web config.

---

## Architecture

**Reading data:** server components call `getProfile()` (`lib/settings.ts`), `getProjects()`/`getProject()` (`lib/projects.ts`), `getMessages()` (`lib/messages.ts`): Admin SDK, `server-only`, wrapped in React `cache`. Firestore Timestamps are converted to ISO strings before reaching client components.

**Writing data:** Server Actions in `src/app/admin/(protected)/actions.ts` (`saveProfile` (also rewrites job and project stacks to the catalog spelling), `saveProject`, `deleteProject`, `setMessageRead`, `deleteMessage`). Every action: re-checks the owner (`getAdmin()`), validates with `lib/validation.ts` (`parseProfile`, `parseProject`; server is the source of truth, forms also use native `required`), writes with the Admin SDK, then `revalidatePath`. Profile/project actions revalidate `/` (layout); message actions only `/admin/messages` + `/admin`.

**Auth:** client signs in with Firebase Auth, posts the ID token to `/api/auth/session`, server verifies it (revocation check, UID === `ADMIN_UID`, sign-in < 5 min old) and sets an httpOnly session cookie that is valid for **3 hours from sign-in** (`SESSION_MAX_AGE_MS` in `lib/session-cookie.ts`; absolute, not extended by activity; Firebase signs the expiry into the cookie so the server enforces it). After that, admin pages redirect to `/admin/login` and a save returns "Not authorized. Please sign in again." (unsaved form edits are lost, so save before a long break). Cookies issued before a change keep their old expiry: sign out, or call `adminAuth().revokeRefreshTokens(uid)`, to cut them off. `lib/auth.ts`: `getAdmin()` / `requireAdmin()` verify the cookie on **every admin page and action** (layouts do not re-render on client navigation). `src/proxy.ts` (Next 16's middleware) is only an optimistic redirect for cookie-less visitors. Never rely on it alone.

**Caching:** public pages are static. A save made in the **production** admin revalidates production. Saves made from **local dev write to the same Firestore but cannot revalidate the Vercel deployment**: production shows the new data after the next deploy (or a save in the prod admin).

**Validation limits** (see `lib/validation.ts`): name 80, pitch 300, bio 8x1500, skill groups 12 x skills 40 (name 40, aliases 8x40), roles 8x60, socials 10, experience 20 (summary 2000, role/company/location 100 single-line, stack 20x40), education 10 (school/degree/location 100, details 1000), projects: title 100, summary 200, description 3000, stack 20, links 10, slug `[a-z0-9-]` max 60.

**UI system:** dark/light via `data-theme` on `<html>` (inline script, no flash); tokens in `globals.css` (`--accent` indigo, etc.). Shared admin pieces: `fields.tsx`, `FormCard`, `ChipsInput`, `AutoTextarea` (auto-height, also used on the public contact form), `ConfirmDialog` (native `<dialog>`, replaces `confirm()`/`alert()` everywhere), `DateSelects` (month/year), `AdminNav` (active tab), `Icons`. `SettingsForm` and `ProjectForm` share the same pattern (single `form` state, `toPayload()` doubles as the dirty check, `saved` snapshot for Discard, `beforeunload` warning). Public: `Section`, `Reveal`/`TimelineItem` (motion), `FormattedText` (bullet lines), `ProjectCardContent` + `ProjectLinks` (project card body and link pills, shared with the admin list; on the public site the card is a `div` with a clickable body `button` and the links **outside** it, since a link inside a button is invalid), `PingDot`, `CopyEmail`, `MobileMenu`.

**Env vars** (`.env.example`; real values in `.env`, gitignored; same names set in Vercel Production):
`NEXT_PUBLIC_FIREBASE_*` (6 web-config values), `FIREBASE_SERVICE_ACCOUNT_KEY` (service-account JSON, one line, **no surrounding quotes in Vercel**), `ADMIN_UID`, optional `NEXT_PUBLIC_SITE_URL` (custom domain; otherwise `VERCEL_PROJECT_PRODUCTION_URL`, else localhost). `NEXT_PUBLIC_*` are baked in at build time: redeploy after changing them.

## Folder layout (actual)
```
src/
  app/
    layout.tsx, page.tsx, globals.css, not-found.tsx, error.tsx
    robots.ts, sitemap.ts, opengraph-image.tsx, twitter-image.tsx, icon.tsx, apple-icon.tsx
    admin/
      layout.tsx (noindex metadata)  login/page.tsx
      (protected)/  layout.tsx (auth + nav) page.tsx (dashboard) actions.ts
                    settings/  projects/ (+ new, [slug])  messages/
    api/ auth/session/route.ts  contact/route.ts
    resume.pdf/route.tsx  (PDF route handler, force-static)
  components/  admin/  layout/  motion/  resume/ (ResumeDocument, react-pdf)  sections/  (+ AutoTextarea, CopyEmail, FormattedText, PingDot)
  lib/  auth, content (defaults + navLinks), firebase, firebase-admin, format, messages, og, projects, resume (buildResume, resumeIssues),
        session-cookie, settings, site, skills (catalog matching), validation
  types/content.ts
  proxy.ts
firestore.rules   .env.example   AGENTS.md   session.md
```

---

## Gotchas and decisions (learned the hard way)

**Vercel / Firebase**
- `firebase-admin` is pinned to **13.x**. v14 pulls `jwks-rsa` 4 -> ESM-only `jose` 6 loaded with `require()`, which crashed `/admin/login` on Vercel (`ERR_REQUIRE_ESM`) while working locally on Node 26. `engines.node` is 22.x; check the Vercel project's Node setting too.
- Missing `NEXT_PUBLIC_FIREBASE_*` at build time makes any page importing the client SDK 500 with `auth/invalid-api-key` (the home page does not import it, so it looked fine).
- Firestore `serverTimestamp()` cannot be used inside arrays: experience `createdAt` uses `Timestamp.fromDate`.
- Both environments share one Firestore: a schema change can break the *currently deployed* code reading the same documents. Deploy new code **before** saving data in the new format; when removing/renaming a field the old code requires, keep it until the deploy is live.
- Disable sign-ups in Firebase Auth settings (not verified done): the owner check is the UID, but open sign-up is unnecessary exposure.

**Next.js 16 / Tailwind 4**
- `middleware` is `proxy.ts`; `cookies()` is async; typed `LayoutProps<"/">` helpers; no `cacheComponents` here, so the model is static pages + `revalidatePath`.
- Tailwind v4 `translate-*` uses the CSS `translate` property (not `transform`); `hover:` only applies on hover-capable devices (`@media (hover: hover)`); `transition-colors` also animates `outline-color`.
- Do **not** delete `.next` or run `next build` while the user's `npm run dev` is running (they share `.next`; the user runs dev on port 3000). Build in a scratch copy instead (copy `node_modules` for real: a symlinked one breaks Turbopack).
- Lenis' CSS sets `html`/`body` height to auto: use `min-h-dvh` (not `min-h-full`) on `<body>` so the footer sinks on short pages.
- iPhone browsers zoom into inputs under 16px: `globals.css` forces 16px for fields on `pointer: coarse` (unlayered rule so it beats utilities).
- `ghostButtonClass`/`buttonClass` set `inline-flex`, so `hidden` loses to it: hide them with `max-sm:hidden` (a variant), not `hidden sm:inline-flex`.
- The admin forms have a sticky save bar: `html` has `scroll-padding-bottom` so focused fields stay clear of it. In tests, scroll targets to the middle before clicking, or the bar swallows the click.
- The global `:focus-visible` outline must **not** set `border-radius` (it reshaped round pills while focused). A control that fills its container (the project card's body button) must hide its own ring (`.card-body:focus-visible`) and let the container draw a matching `ring` via `has-[...]`, otherwise a rectangular outline cuts across the card and overlaps its border (visible after closing the pop-up, which returns focus to the card).
- A transformed child inside a scroll container (`overflow-y-auto`) flashes a scrollbar while it animates: animate the dialog itself (`dialog[open]` keyframes in `globals.css`), never its content.
- CSS grid columns need `minmax(0, 1fr)` or one long unbreakable line stretches the layout.
- `backdrop-filter` on the header makes `position: fixed` children relative to the header: use `absolute`.
- Hero button row: on phones two main buttons share a 2-column grid and the socials are an even `flex-1` row; from `sm` up both wrappers use `sm:contents` so everything sits in one row. The resume button reads "Resume" on phones and "Download resume" from `sm` (aria-label is always "Download resume"). The footer link list wraps (`flex-wrap`), because at 320px it overflowed by 5px.
- Hero entrance is CSS (`.rise`), not motion, so text paints before JS loads (LCP). Keep above-the-fold content visible in server HTML.

**This session's learnings**
- The Settings save also rewrites every project's `stack` (batch update, `updatedAt` untouched because legacy projects borrow it as their date).
- `ChipsInput` suggestion list: choose with `onMouseDown` + `preventDefault`, otherwise the input's `onBlur` commits the half-typed text first.
- In scratch scripts: `require("firebase-admin/app")` with an absolute path fails (exports map): use `module.createRequire("<project>/package.json")`; `process.loadEnvFile(".env")` replaces dotenv; `puppeteer-core` lives in the scratchpad's own `node_modules`; `tsx` via `npx tsx` runs project TypeScript (e.g. `lib/validation.ts`, `lib/skills.ts`).
- Never `pkill -f "<text that is also in my own command>"`: it kills the tool's shell. Kill by PID from `ss -ltnp` instead.
- A mocked server-action response (`0:{...}\n1:{"ok":true}`) lets a test click Save without writing data; remove the interception for tests that must really save (and restore the value afterwards).
- Element screenshots of tall cards show the sticky header/save bar painted over them: that is an artifact, not a bug.

## Testing approach
There is no test suite in the repo. Verification is done with throwaway Node scripts in the session scratchpad: `puppeteer-core` driving the system Chrome (`/usr/bin/google-chrome-stable`), signing in by minting a Firebase custom token for `ADMIN_UID` and exchanging it at `/api/auth/session`. Tips: launch with `--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4` to test hover (headless reports no hover); `waitForFunction` hangs in a background tab (call `bringToFront()`); intercept the Next server-action POST to test payloads without writing; sample `requestAnimationFrame` frames to catch animation glitches; wait ~450ms before reading colours (transitions); Lighthouse runs from a scratch install against a production build. Any test that writes data must use temporary documents and delete them by exact ID.

## Deploy checklist
1. Commit and push `main` (Vercel deploys). Confirm the deployment is on the latest commit.
2. After changing `NEXT_PUBLIC_*` or `NEXT_PUBLIC_SITE_URL`: redeploy without build cache.
3. Publish `firestore.rules` in the Firebase console if it changed (UID must be filled in).
4. Check `/`, `/admin/login`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image` on the live URL. Open the browser console on `/` and `/admin/login` and confirm there are no CSP errors; re-run securityheaders.com.
5. One-time: add the site to Google Search Console and submit the sitemap; re-scrape the link preview (LinkedIn Post Inspector etc.).

## Security headers
Set in `next.config.ts` `headers()` (checked on a production build with securityheaders.com's five headers in mind): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment, usb, browsing-topics off; clipboard stays on for the copy-email button), and a `Content-Security-Policy`. HSTS comes from Vercel. The CSP is the docs' **"without nonces"** variant on purpose: nonces force every page to render per request (no static/CDN pages), and SRI hash-CSP is experimental. So `script-src 'self' 'unsafe-inline'` (needed by Next's inline bootstrap scripts and the theme script in `layout.tsx`) and `style-src 'self' 'unsafe-inline'` (motion and `style=` attributes) remain the known weak spots; everything else is tight: `default-src 'self'`, `img-src 'self' data: blob:`, `font-src 'self'` (next/font self-hosts Geist), `connect-src 'self'` + `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `www.googleapis.com` (Firebase Auth on the login form), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` (production only). Dev adds `'unsafe-eval'` and `ws:`/`http://localhost:*`. **`/resume.pdf` gets the four plain headers but no CSP** (a CSP on a PDF response can stop Chrome's built-in viewer). Verified in a browser on a production build: zero violations on the home page (scroll, theme toggle, project modal), login (a real failed sign-in reaches Firebase and shows the normal error), and the admin pages; an external host, script and fetch are blocked as intended. **If you add a third-party script, image host, font, embed or analytics, add its origin to the matching directive or it will be blocked.** `next.config.ts` changes need a dev-server restart.

## Resume PDF
`/resume.pdf` (`src/app/resume.pdf/route.tsx`) renders a text-based, ATS-friendly PDF with `@react-pdf/renderer`: Letter, one column, built-in Times (not embedded), hyphenation off, plain-text URLs, nothing in headers/footers, laid out like the owner's own `Resume_Johevin.pdf` (Jake's-Resume style). Data comes from `lib/resume.ts` (`buildResume`: profile + projects -> sections; every description line becomes a bullet; projects newest first; skill groups become the Technical Summary; phone is not included yet). `export const dynamic = "force-static"`: built once, and profile/project saves (`revalidatePath("/", "layout")`) rebuild it (verified on a production build). Download buttons: hero ("Download resume"), footer ("Resume"). The admin dashboard has a Resume card (Preview PDF / Download) with `resumeIssues()` hints. Check output with `pdftotext`, `pdffonts`, `pdftoppm` (all installed locally). Keep descriptions and summaries as one line per point: hard-wrapped lines become separate bullets (the Coobie line in the education entry was pasted hard-wrapped and still renders as 3 bullets until the owner joins it). Layout: name 22pt centered, contact line (email, LinkedIn, GitHub from `socials`; Upwork is left out), then sections; entry header rows use `wrap={false}` + `minPresenceAhead` so headers never sit alone at a page bottom. Dates use the resume style (`Jan. 2026`, `Sept. 2025`, ` - `), the site uses `Jan 2026`. At last check the PDF was 2 pages (page 2 only holds Projects + Technical Summary, because only 1 project exists).
**Deliberately not built:** a separate HTML `/resume` preview (admin Preview opens the real PDF), phone number on the resume (owner skipped it), a per-project "include on resume" toggle (all projects are included), drag-and-drop for skill groups (up/down buttons only; dnd-kit would be the way if wanted), reordering skills inside a group.

## Next steps (suggested order)
**State at the end of this session:** all code is committed (resume PDF, hero/footer buttons, admin Resume card, skill-group reordering included); only this file's last edit may be uncommitted. Deploy before relying on it in production: the Firestore data (education, locations, stacks, skill groups) is already live and shared, but older deployed code ignores it.
1. **Finish the resume data (owner):** add the 6 projects from the PDF (Terraform Azure Managed Redis, GCP Base Infrastructure, AWS Base Infrastructure, AWS Terraform Deployment, Observability Platform, On Premise K3s Delivery Pipeline), each with a link, month/year and **one bullet per line** in the description (2-3 each); join the hard-wrapped Coobie line in Education; place the 10 leftover stack names in groups (tray in Settings > Skills); give Kolosal AI a tech stack. Then check page count (target 2) and text with `pdftotext`. The dashboard Resume card lists what is still thin.
2. **Open questions:** phone on the resume? include-on-resume toggle per project? drag-and-drop for groups? job-title wording ("Teaching Assistant at Software Laboratory Center" vs the PDF's "Teaching Assistant", "Paxel Indonesia" vs "Paxel"); LinkedIn link is `http://` in the data (the resume upgrades it to https).
3. **Public-page batch** (still awaiting answers): group same-company roles, "Show more" on long experience, hero "currently at" line, featured projects layout.
4. **Blog:** `lib/posts.ts` + validation, `/admin/posts` (list, editor with Markdown, tags via `ChipsInput`, draft/published, delete via `ConfirmDialog`), `/blog` (search + tag filter), `/blog/[slug]` (`generateMetadata`, `generateStaticParams`, JSON-LD `BlogPosting`), "Latest posts" section, dashboard Posts card + checklist step, nav link, sitemap entries. Decide: plain Markdown + image links first (image upload may need the Blaze plan).
5. **Contact hardening:** per-IP rate limit (or App Check), optional email notification (e.g. Resend).
6. **Housekeeping:** delete the leftover test documents (`posts/gnsBWLddPHkVuJapWb2C`, `projects/yY5zllSxhqxAYzSr5lAw`, `settings/main`), set the real date on the legacy project, turn off Auth sign-ups.
7. **Later:** analytics (privacy-friendly), project images, automated tests + CI.

## Build order (original plan, with status)
1. ~~Scaffold Next.js + TypeScript + Tailwind~~ done
2. ~~Firebase project, Firestore and Auth, env vars~~ done
3. ~~Home page layout and sections~~ done (+ UI polish, mobile menu, motion)
4. Admin login and posts management: **login, dashboard, settings, projects, messages done; posts pending**
5. Blog list and post pages: **pending**
6. Contact form, security rules, deploy to Vercel: **form, rules, deploy done; rate limiting pending**
7. ~~SEO~~ done (added to the plan)
