# ForgottenSocial — Manual QA checklist

> Pre-feature regression pass against `main`. Focuses on things that need a real browser, real Atlas connection, real session cookies, and two test users — i.e. things the planning agent can't verify from chat.
>
> **Recommended setup:** a fresh `.env.local`, two browser sessions (one normal, one private/incognito), and two test accounts — `alice` and `bob`.
>
> ## Optional: load the dev seed for repeatable QA
>
> The seed scripts and JSON dumps are kept locally but **not committed** (see [`docs/PLAN.md`](PLAN.md) **§ Local dev utilities**). If `forgotten-social/scripts/seed/` is missing from your clone, that's expected — regenerate it from the committed instructions in `PLAN.md`, or skip and use ad-hoc accounts you create through `/sign-up`.
>
> When the utilities are present (Node 20.6+, run from `forgotten-social/`):
>
> ```bash
> node scripts/seed/generate-seed.mjs                     # writes seed/forgotten_social.*.json
> node scripts/seed/verify-seed.mjs                       # invariant check
> node --env-file=.env.local scripts/seed/import-seed.mjs # clears + imports users/posts/likes/follows
> ```
>
> Gives you 10 accounts (`alice`…`jack`) with posts, likes, and follows wired up. Password for every seeded user is **`password123`**. `alice` has 25 posts (profile pagination), `jack` has 0 posts but follows everyone (Following-feed populated + empty profile case).

## Status legend

- [ ] Pending
- [x] Passed
- [!] Bug found — capture details in the **Issues found** section at the bottom

---

## 0. Setup smoke (do this first)

- [ ] `git checkout main && git pull origin main`, then `npm install`.
- [ ] `npm audit` reviewed. Latest triage (2026-05): **`npm audit fix`** cleared **2** of **4** moderate findings (remaining **2** are transitive PostCSS via **Next** — defer bump until Next ships patched nested dependency; see [PLAN.md](PLAN.md) § Gotchas).
- [ ] `.env.local` contains `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`; Atlas IP Access List allows your current IP.
- [ ] `npm run dev` boots cleanly — no Mongoose connection error, no Tailwind/Geist warning, no NextAuth config error.
- [ ] `npx tsc --noEmit` → exit 0.
- [ ] `npm run build` → success; route list includes `/`, `/sign-in`, `/sign-up`, `/[username]`, `/_not-found`, `/api/posts`, `/api/posts/feed`, `/api/posts/[id]/like`, `/api/users/[username]/follow`, `/api/auth/register`, `/api/auth/[...nextauth]`.
- [ ] `GET http://localhost:3000/api/health` returns OK (smoke test for DB).
  - Smoke-test observation: `/api/health` returned `status: "ok"`, DB state `connected`, host `ac-nio61ag-shard-00-00.n9byejo.mongodb.net`, DB name `forgotten_social`, models `User`, `Post`, `Follow`, `Like`, and `userCount: 4`.

## 1. Auth — registration & sign-in

- [ ] **Sign up `alice`** at `/sign-up`: username, email, password, name → redirect to `/`, header swaps **Sign In** for the avatar/account menu.
- [ ] Refresh `/` — session persists (cookie working).
- [ ] **Sign out** from the account dropdown → header shows **Sign In** again.
- [ ] **Sign back in** at `/sign-in` with the same credentials → success.
- [ ] **Bad credentials** at `/sign-in` (wrong password) → inline error, no crash, no session created.
- [ ] **Duplicate registration** — try registering `alice` again with the same email *or* username → friendly validation error from `/api/auth/register`, not a 500.
- [ ] **Zod errors visible** — submit `/sign-up` with empty fields, invalid email, very short password → field-level errors render.
- [ ] **Open-redirect guard** — visit `/sign-in?callbackUrl=https://evil.com` → after sign-in you land on `/`, not the external URL. (Try `callbackUrl=//evil.com` too.)
- [ ] **Register `bob`** in a private/incognito window so you have a second account ready.
- [ ] **GitHub OAuth (first sign-in)** — click "Continue with GitHub" on `/sign-in`, approve app, and verify you return to the callback path with a valid session.
- [ ] **GitHub OAuth (repeat sign-in)** — sign out and sign back in with the same GitHub account; verify the same app user is reused (no duplicate account).
- [ ] **Google OAuth (first sign-in)** — repeat the same check with Google provider.
- [ ] **Google OAuth (repeat sign-in)** — sign out and sign back in with the same Google account; verify user reuse.
- [ ] **OAuth username collision check** — use two OAuth accounts whose email local-parts sanitize to the same base username; second account still signs in with a unique suffixed username.
- [ ] **Missing OAuth email guard** — test provider/account scenario with no email (or simulate in test provider) and verify sign-in fails with a clear message, with no user created.

## 2. Composer & global feed (`/`, "For you")

- [ ] Signed-out `/` shows feed but **no composer**, and the **Following** tab is hidden.
- [ ] Signed in as `alice`, composer is visible. Submit a post → it appears at the top of "For you" without a full reload.
- [ ] **Length validation** — try empty content and >280 chars → submit blocked with a clear error.
- [ ] **Whitespace-only** content rejected.
- [ ] **Composer success feedback** appears (per the polish slice) and clears on next compose.
- [ ] Refresh `/` — your post is still there (persisted, not just optimistic).

## 3. Infinite scroll & pagination

- [ ] Seed enough posts (use the local dev seed described in the header above, or post ~25 from `alice`) so pagination triggers.
- [ ] Scrolling to the bottom of "For you" auto-loads the next page (intersection observer).
- [ ] **Load more** button works as a fallback if you click it directly.
- [ ] When you've reached the end, no infinite spinner / no duplicate posts / no console error.
- [ ] **Skeletons** appear briefly on initial load and on load-more (per polish slice).
- [ ] **Empty feed state** — sign in as a user who follows nobody (e.g. `jack` from seed before any new follows) and check "For you" copy is sensible if global feed is empty.

## 4. Profile pages (`/[username]`)

- [ ] `/alice` (lowercase) renders header (avatar, name, bio), follower/following counts, post list.
- [ ] **Case-insensitive** routing — `/Alice`, `/ALICE` resolve to the same profile.
- [ ] **Unknown user** — `/doesnotexist` renders the dynamic `notFound()` page (not a 500).
- [ ] **Truly unknown route** — `/some/random/path` renders `app/not-found.tsx`.
- [ ] Profile **posts list** matches what `alice` actually authored (no cross-user leakage).
- [ ] **Empty profile** — view `jack`'s profile (seed user with zero posts) → empty-state copy renders cleanly on narrow widths.
- [ ] Clicking a post header link from a feed lands on the right profile.
- [ ] **Profile pagination** — `alice` has 25 seeded posts; verify her profile lists at least the most recent batch and (if implemented) supports loading more.

## 5. Follow / unfollow

Use two windows (`alice` signed in, `bob` signed in incognito).

- [ ] On `/bob` while signed in as `alice`, the **Follow** button is visible (not on your own profile, not when signed out).
- [ ] Click **Follow** → button flips to **Following** optimistically; refresh → state persists; `bob`'s follower count increments by 1; `alice`'s following count increments by 1.
- [ ] **Unfollow** flips back; counts decrement.
- [ ] **Idempotent follow** — double-click Follow rapidly; you don't end up with a duplicate row or a 500 (the route should treat 11000 as success).
- [ ] **Self-follow blocked** — visiting your own profile, the button is hidden; if you hit `POST /api/users/alice/follow` as `alice` directly (curl/devtools), you get **400**.
- [ ] **Signed-out follow** — open `/alice` in a fresh incognito window: no Follow button. Hitting the API directly returns **401**.

## 6. Like / unlike

- [ ] Like a post on the feed → heart fills, count increments optimistically.
- [ ] Refresh → like state and count persist (`likedByMe` is hydrated).
- [ ] Unlike → state and count revert; refresh confirms.
- [ ] **Cross-account** — `bob` likes one of `alice`'s posts → `alice` sees the new count when she refreshes; `bob`'s heart is filled, `alice`'s is not (each viewer's `likedByMe` is independent).
- [ ] **Idempotent like** — double-click rapidly; final count is +1, not +2; no 500.
- [ ] **Signed-out like attempt** — incognito window: clicking the heart prompts a sign-in CTA / shows the destructive 401 alert with **Sign in** button. No optimistic count change sticks after the failure.
- [ ] **Likes on profile page** — like states match what's shown on `/`.

## 7. Following feed

- [ ] As `alice`, **before following anyone**, click the **Following** tab → empty-state copy renders, no error.
- [ ] After `alice` follows `bob`, have `bob` post → reload `/`, **Following** tab shows `bob`'s post and excludes `alice`'s own posts and other unfollowed users.
- [ ] Following feed paginates the same way as For you (scroll to load more if you have enough posts).
- [ ] Unfollow `bob` → his posts disappear from Following on next load.

## 8. Header / `UserNav`

- [ ] Avatar dropdown shows correct username/name.
- [x] **Profile** link in the dropdown (if present) goes to `/[your-username]`.
- [x] **Sign out** clears session immediately and redirects sensibly.
- [ ] No hydration warning in the dev console on initial paint of the header (the Auth UI report flagged a brief one — worth re-checking).

## 9. Responsive / visual

- [ ] DevTools at **375px** (mobile): composer submit button layout, feed card spacing, profile header wrapping, tabs all readable — no horizontal scroll.
- [ ] **768px** and **1024px** also look intentional.
- [ ] Dark/light theme (if a toggle exists in your build) — both render correctly; Phosphor icons load (no missing `Sun`/`Moon` regressions).
- [ ] No Times New Roman fallback anywhere (the Tailwind v4 + Geist gotcha).

## 10. Error & edge cases

- [ ] **Browser console** clean across all pages — no red errors, no warning floods, no unhandled promise rejections.
- [ ] **Network tab**: feed requests return 200; like/follow mutations return 200/204; no 500s during normal flows.
- [ ] **Atlas offline** test — temporarily remove your IP from the Atlas allowlist (or stop the cluster), reload `/` → app degrades gracefully (error boundary or empty state, not a white screen).
- [ ] **Stale session** — delete your session cookie in DevTools, then try to compose / like → app handles 401 cleanly.
- [ ] **Direct API hits via `curl.exe`** (PowerShell `Invoke-RestMethod` hides bodies — see [`AGENTS.md`](../AGENTS.md) gotchas):
  - `POST /api/posts` without auth → 401.
  - `POST /api/posts` without auth is blocked by `proxy.ts` (401 JSON) before route logic.
  - `POST /api/posts/[id]/like` and `DELETE /api/posts/[id]/like` without auth → 401.
  - `POST /api/users/:username/follow` and `DELETE /api/users/:username/follow` without auth → 401.
  - `GET /api/posts` and `GET /api/posts/feed` remain accessible when signed out.
  - `POST /api/auth/register` and `/api/auth/*` remain reachable while signed out.
  - `POST /api/posts` with auth + invalid body → 400 with zod error.
  - `GET /api/posts?cursor=garbage` → 400.
  - `POST /api/users/nonexistent/follow` while signed in → 404.

---

## Issues found

### 2026-05-08 — Browser Back sometimes leaves the app blank / unloaded

- **Status:** **Deferred** — documented under [`docs/PLAN.md`](PLAN.md) § Gotchas (**Browser Back sometimes shows a blank page**). Revisit after a Next.js / Turbopack upgrade or if a reliable reproduction + root cause in app code is found.

### 2026-05-08 — Front page feed appears to load twice for signed-in users

- **Status:** **Resolved** — `RootLayout` now passes the server session into `SessionProvider` (`app/layout.tsx`, `app/providers.tsx`) so `useSession()` is not stuck in `loading` on first paint; `HomeFeed` no longer swaps from the signed-out shell into tabs after hydration (branch `fix/qa-followups`).

### 2026-05-08 — Deleted user with still-valid JWT remains logged in and posting errors

- **Status:** **Resolved** — mutation routes verify the JWT subject still exists in MongoDB and return **`401`** `{ error: "Session expired" }`; compose / like / follow call **`signOut({ redirect: false })`** when that payload is returned (`lib/require-session-user.ts`, API routes, `components/composer.tsx`, `components/like-button.tsx`, `components/follow-button.tsx`; branch `fix/qa-followups`).

### 2026-05-08 — 404 page logs script-tag console error from theme provider

- **Status:** **Resolved** — removed `next-themes` inline React `<script>`; theme boot runs via **`next/script`** `strategy="beforeInteractive"` plus a small client `ThemeProvider` (`lib/theme-boot-script.ts`, `components/theme-provider.tsx`, `app/layout.tsx`; branch `fix/qa-followups`).

### 2026-05-08 — 404 page shows Sign In button even for signed-in users

- **Status:** **Resolved** — `app/not-found.tsx` uses **`auth()`**; signed-in users see **Your profile** instead of **Sign in** (branch `fix/qa-followups`).
