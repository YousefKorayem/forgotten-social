---
name: ForgottenSocial Next.js App
overview: Build a Twitter-style social network ("ForgottenSocial") as a Next.js 16 App Router full-stack app with TypeScript, Tailwind + shadcn/ui, MongoDB/Mongoose, and NextAuth.js. We'll ship an MVP with auth, profiles, text posts, likes, follows, and a following-only feed, in incremental phases.
todos:
  - id: scaffold
    content: Scaffold Next.js 16 + TS app with create-next-app, install Tailwind, set up shadcn/ui, add base layout and theme
    status: completed
  - id: github
    content: "Create GitHub repo via gh CLI and push initial commit: gh repo create forgotten-social --public --source=. --remote=origin --push; protect main and use feature branches per phase"
    status: completed
  - id: db
    content: "Add MongoDB Atlas connection: lib/db.ts with cached Mongoose connection, .env.local with MONGODB_URI"
    status: completed
  - id: models
    content: "Define Mongoose models in models/: User, Post, Follow, Like with proper indexes (unique username/email, compound unique on Follow and Like)"
    status: completed
  - id: auth
    content: Configure NextAuth.js v5 in lib/auth.ts with Credentials + GitHub + Google, JWT session, signIn callback that upserts User; expose handlers in app/api/auth/[...nextauth]/route.ts
    status: in_progress
  - id: auth-ui
    content: Build sign-in and sign-up pages with shadcn Form + zod validation; add /api/auth/register route for credentials signup with bcrypt
    status: completed
  - id: middleware
    content: Add proxy.ts (Next.js 16 middleware) to protect write routes and redirect unauthenticated users to /sign-in
    status: in_progress
  - id: posts-api
    content: Implement POST /api/posts (create) and GET /api/posts (global feed, cursor-paginated)
    status: completed
  - id: feed-ui
    content: Build home page with composer, FeedList client component, PostCard, infinite scroll for global feed
    status: completed
  - id: profile
    content: Build /[username] profile page with avatar, bio, post list, follower/following counts (server-rendered)
    status: completed
  - id: follow
    content: Implement follow/unfollow API route and FollowButton client component; ensure idempotent on duplicate-key
    status: completed
  - id: like
    content: Implement like/unlike API route with $inc on Post.likeCount; add LikeButton client component with optimistic updates
    status: completed
  - id: following-feed
    content: Implement GET /api/posts/feed (following-only) and add Following tab on home page
    status: in_progress
  - id: polish
    content: "Polish: empty states, loading skeletons, error toasts, 404s, basic responsive styling, README with setup steps"
    status: pending
isProject: false
---

> **Source of truth:** This file is the canonical roadmap (todos, architecture, decisions, gotchas). It lives in the repo so contributors and AI agents do not need Cursor’s `.cursor/plans/` directory.

> **Collaboration:** The **planning agent** (dedicated chat) updates this file, sequences work, and writes **handoff prompts**—it does **not** implement application code by default; see [`AGENTS.md`](../AGENTS.md). **Build agents** (Cursor Agent mode / subagents) implement features per this plan and append reports to [`notes/agent-reports.md`](../notes/agent-reports.md).

# ForgottenSocial — Full-Stack Plan

## Stack (locked in)

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York / Lyra / Zinc)
- **DB**: MongoDB Atlas + Mongoose
- **Auth**: NextAuth.js (Auth.js v5) with Credentials + GitHub/Google OAuth
- **Deployment** (later): Vercel + MongoDB Atlas

## Current state

- **App root:** `forgotten-social/` (workspace parent is often `ForgottenSocial/`).
- **Merged to `main`:** Credentials auth end-to-end; handoff docs + README pointers; **`posts-api`**; **`feed-ui`**; **`profile`**; **`follow`**; **`like`** (`POST`/`DELETE` `/api/posts/[id]/like`, **`LikeButton`** on **`PostCard`**, **`FeedPost.likedByMe`** on feed/profile when signed in). PRs merged with **regular merge** as preferred; run **`git pull origin main`** after merging.
- **Done (baseline):** Scaffold (Next 16, Tailwind, shadcn Lyra/Zinc), Mongo `lib/db.ts` + Atlas, Mongoose models (`User`, `Post`, `Follow`, `Like`), health API smoke test, NextAuth v5 split config (`auth.config.ts` + `lib/auth.ts`), credentials provider, `/api/auth/register`, sign-in/sign-up pages, shared zod validations (`lib/validations/auth.ts`), `UserNav` in layout, JWT session augmentation in `types/next-auth.d.ts`, `proxy.ts` matcher scaffold (protected paths may still be empty). Agent report: [`notes/agent-reports.md`](../notes/agent-reports.md).
- **In progress:** **`following-feed`** — `GET /api/posts/feed` (posts from accounts the viewer follows only), plus a **Following** tab on the home feed next to the global feed. Then **`polish`**. OAuth deferred — todo **`auth`** open.
- **Handoff:** **Planning agent** — read [`AGENTS.md`](../AGENTS.md) (planning vs build), then this file, then [`notes/agent-reports.md`](../notes/agent-reports.md). **Build agent** — follow this plan, ship code, append to `notes/agent-reports.md`.

## Decisions log

- **Sessions:** JWT strategy only — no `@auth/mongodb-adapter`; Mongoose remains the sole DB layer for app data.
- **Passwords:** `bcryptjs` (pure JS) for hashing/compare; avoid native `bcrypt` build friction on Windows/CI.
- **UI kit:** shadcn/ui New York style, **Lyra** preset, **Zinc** base color (tweakable later).
- **NextAuth + Edge:** Split config — `auth.config.ts` is edge-safe (no DB imports); `lib/auth.ts` spreads it and adds Credentials + Node-only logic (`dbConnect`, `User.findOne`, `bcrypt.compare`).
- **Icons:** `@phosphor-icons/react/ssr`; use suffixed exports (e.g. `SunIcon`, `MoonIcon`) — bare `Sun`/`Moon` deprecated/removed in v2.
- **Git:** Feature branches + PRs; **regular merges into `main` (no squash)** per maintainer preference.
- **MVP posts:** Text-only (no images in first ship).
- **Bootstrap for new chats:** Copy the block from [`AGENTS.md`](../AGENTS.md) (“Bootstrap message” section).

## Gotchas encountered

- **MongoDB Atlas:** Network Access must allow your current IP; otherwise “bad auth” / connection failures despite correct credentials.
- **Edge runtime:** `proxy.ts` / middleware cannot import Mongoose or the full NextAuth bundle that pulls Node `stream` — use split auth config (see Decisions log).
- **Next.js 16:** `middleware.ts` renamed to **`proxy.ts`**; codemod: `npx @next/codemod@canary middleware-to-proxy .`
- **Tailwind v4 + Geist:** Map `--font-sans` / `--font-mono` in `app/globals.css` `@theme inline`; add `font-sans` on `<body>` or fonts fall back to Times New Roman.
- **Zod v4:** `z.string().email()` deprecated — use `z.email()`.
- **NextAuth types:** Augment `AdapterUser` in `types/next-auth.d.ts` for custom `username` (and JWT/session as needed).
- **Mongoose dev HMR:** Cache connection on **`globalThis`**, not `global`, in `lib/db.ts`.
- **npm naming:** Package/project folder names must be lowercase (`forgotten-social`).
- **PowerShell debugging:** `Invoke-RestMethod` may hide JSON error bodies on failures; use browser Network tab or `curl.exe` for full responses.

> Note on Express: you originally listed Express, but chose "Next.js full-stack". In this setup, Next's route handlers (`app/api/.../route.ts`) replace Express. They use the same Request/Response mental model, so the backend skills still show. If you want to truly demo Express on your resume, we can split the backend out later — say the word and I'll add a `server/` Express+Mongoose API and have Next consume it instead.

## Source control & GitHub

- `create-next-app` runs `git init` and adds a sensible `.gitignore` automatically; we just confirm `.env.local` is ignored.
- Immediately after scaffold, create the remote with the GitHub CLI and push:
  - `gh repo create forgotten-social --public --source=. --remote=origin --push`
- **Workflow per phase**: each todo below = its own short-lived feature branch + PR (e.g. `feat/auth`, `feat/posts-api`, `feat/follows`), **merged with regular merge commits (no squash)** into `main` — preserves verbose history for review and portfolio narrative.
- Keep a `README.md` updated each phase with setup steps, env vars, and screenshots.

## Target folder layout

```text
forgotten-social/
├── app/
│   ├── (auth)/sign-in/page.tsx
│   ├── (auth)/sign-up/page.tsx
│   ├── (main)/page.tsx                  # home feed
│   ├── (main)/[username]/page.tsx       # profile
│   ├── (main)/post/[id]/page.tsx        # single post (optional)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/register/route.ts       # credentials sign-up
│   │   ├── posts/route.ts               # GET feed, POST create
│   │   ├── posts/[id]/route.ts          # GET one, DELETE own
│   │   ├── posts/[id]/like/route.ts     # POST/DELETE like
│   │   ├── posts/feed/route.ts          # following-only feed
│   │   └── users/[username]/follow/route.ts
│   └── layout.tsx
├── components/                          # shadcn + custom UI
├── lib/
│   ├── db.ts                            # Mongoose connection (cached)
│   ├── auth.ts                          # NextAuth config
│   └── validations.ts                   # zod schemas
├── models/
│   ├── User.ts
│   ├── Post.ts
│   ├── Follow.ts
│   └── Like.ts
├── proxy.ts                             # Next.js 16 middleware — protect /compose, mutations
├── .env.local
└── package.json
```

## Data model (Mongoose)

Use **separate collections with refs + compound unique indexes** for `Follow` and `Like` (scales better and is more impressive than embedded arrays):

- **User**: `username` (unique), `email` (unique), `passwordHash?`, `name`, `image`, `bio`, `createdAt`
- **Post**: `author: ObjectId<User>`, `content: string (<=280)`, `likeCount: number`, `createdAt`
- **Follow**: `follower: ObjectId<User>`, `following: ObjectId<User>` — unique compound index `{follower, following}`
- **Like**: `user: ObjectId<User>`, `post: ObjectId<Post>` — unique compound index `{user, post}`; `Post.likeCount` kept in sync via Mongoose middleware or `$inc` on like/unlike

Critical detail in [`lib/db.ts`](../lib/db.ts): cache the Mongoose connection on `globalThis` to survive Next.js dev hot-reload (otherwise you leak connections).

```ts
// lib/db.ts (sketch)
import mongoose from "mongoose";
const cached = (globalThis as any)._mongoose ??= { conn: null, promise: null };
export async function dbConnect() {
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(process.env.MONGODB_URI!);
  cached.conn = await cached.promise;
  return cached.conn;
}
```

## Auth flow (NextAuth.js v5)

- `lib/auth.ts` exports `{ auth, handlers, signIn, signOut }` with `CredentialsProvider` (bcrypt-compared `passwordHash`) plus `GitHubProvider` and `GoogleProvider`.
- **Session strategy: JWT (chosen).** After sign-in, Auth.js issues a signed/encrypted JWT and stores it in an HTTP-only cookie. Each request decodes the cookie — no DB roundtrip — and that's the session. The DB only stores `User` documents; sessions live in the cookie. This keeps **Mongoose as the only DB layer**, which is what we want to demonstrate.
  - Alternative we considered: the `@auth/mongodb-adapter` "database session" strategy stores sessions/accounts/verification tokens in Mongo and uses the native MongoDB driver alongside Mongoose. We're skipping it because the extra parallel-driver complexity isn't worth the (real but minor) benefits of revocable sessions for an MVP.
- On first OAuth sign-in, the `signIn` callback upserts a `User` doc (auto-generates `username` from email).
- Add `session.user.id` and `session.user.username` via the `jwt` and `session` callbacks so the client knows who's signed in.
- [`proxy.ts`](../proxy.ts) (middleware) gates write routes (`/compose`, mutation API routes) and redirects unauthenticated users to `/sign-in`. Edge runtime: use edge-safe NextAuth config only (see Decisions log — split config).

## API routes (key ones)

- `POST /api/auth/register` — zod-validate, bcrypt-hash, create User
- `POST /api/posts` — create post (auth required)
- `GET /api/posts?cursor=...` — global feed, cursor-paginated by `_id`
- `GET /api/posts/feed?cursor=...` — following-only feed: query `Follow` for current user's following IDs, then `Post.find({ author: { $in: ids } })`
- `POST/DELETE /api/posts/:id/like` — atomic: `Like.create` + `Post.updateOne({$inc:{likeCount:1}})`; on duplicate-key (already liked), return 409
- `POST/DELETE /api/users/:username/follow` — same pattern with `Follow`
- `GET /api/users/:username` — profile + post list

All handlers: `await dbConnect()` first, then `await auth()` for the session, then validate body with zod.

## UI pages

- `/` — feed (tabs: "For you" = global, "Following" = following-only when signed in), composer at top, infinite scroll
- `/sign-in`, `/sign-up` — shadcn `Card` + `Form`
- `/[username]` — avatar, bio, follow/unfollow button, post list, follower/following counts
- Components: `PostCard`, `Composer`, `FollowButton`, `LikeButton`, `FeedList` (client component handling pagination)

Use **Server Components** for data fetching where possible (profiles, initial feed page) and Client Components only for interactive bits (composer, like button, infinite scroll).

## Phased build order

We'll build in slices so each phase is runnable. Each todo below is one focused step.

## Open assumptions (flag now if any are wrong)

- Next.js **App Router** (not Pages Router) and Auth.js **v5**
- Mongoose **`Like` and `Follow` as separate collections** (not embedded arrays)
- **JWT** session strategy (no Mongo adapter)
- **Cursor pagination** for feeds (not page-number)
- Posts are **text-only** for the MVP (no images — that was the "core + images" option)
- Deployment target is **Vercel + MongoDB Atlas** (we won't deploy yet, just keep it compatible)
