<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ForgottenSocial — agent guide

## Project

**ForgottenSocial** is a Twitter-style social network built as a portfolio full-stack app. MVP scope: credentials auth, profiles, text posts, likes, follows, and a following-only feed. Backend is Next.js route handlers (`app/api/.../route.ts`), not a separate Express server.

## Snapshot for new chats (copy into memory before answering)

Read **[`docs/PLAN.md`](docs/PLAN.md) § Snapshot for a fresh planning chat** for the full picture. Quick facts:

- **Repo:** `forgotten-social/` — run `npm run dev` here.
- **MVP status:** Core todos through **`polish`** are **done** on **`main`** (feeds, profile, follow, like, following tab, README polish, `not-found`).
- **Deferred:** OAuth (**`auth`** todo), route protection (**`middleware`** / **`proxy.ts`**).
- **Truth source:** YAML front-matter + § Current state + § Snapshot in [`docs/PLAN.md`](docs/PLAN.md); implementation history in [`notes/agent-reports.md`](notes/agent-reports.md).

When the maintainer opens a **new** planning chat with an empty context window, **read those files first**—do not rely on an older chat’s summary.

## Planning agent vs build agents (mandatory split)

These are **different roles**. Do not blur them.

### Planning agent (this chat)

The **planning agent** is for **planning only**: roadmap, sequencing, tradeoffs, PR review guidance, and **copy-paste handoff prompts** for you to run in Cursor **Agent** mode or other **subagent** sessions.

**In scope**

- Edit **documentation**: [`docs/PLAN.md`](docs/PLAN.md), this file, [`notes/agent-reports.md`](notes/agent-reports.md) (meta / clarity only—not replacing build-agent entries), [`README.md`](README.md) pointers when needed.
- Summarize state, suggest next branch names, draft **`gh pr create`** messaging, and produce **implementation prompts** that reference `docs/PLAN.md` and existing patterns.

**Out of scope (unless you explicitly tell this chat to implement)**

- **No application code**: do not add or change files under `app/` (except docs routes if ever added), `components/` (UI product code), `lib/` (runtime helpers **used by the app**), `models/`, API routes, auth wiring, styles for product UI, or `package.json` dependencies for features.
- Subagents own **all** of that.

If the maintainer explicitly asks the planning agent to implement something, that is a **deliberate exception**—default remains **planning and prompts only**.

### Build agents (subagents / Agent mode)

**Build agents** implement features: write and refactor application code, run tests and builds, create commits, push branches, and **append** an entry to [`notes/agent-reports.md`](notes/agent-reports.md) when a slice is done.

**Workflow:** Planning agent clarifies the spec and hands you a prompt → you paste it into **Agent** mode (or a dedicated build chat) → build agent ships code and reports.

## Repo layout

- Workspace root: `ForgottenSocial/` (parent folder; may not be a git root).
- **Next.js app (git repo)**: `forgotten-social/` — run commands from here (`npm install`, `npm run dev`).

## Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (New York style, Lyra preset, Zinc base) |
| DB | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js (Auth.js v5), JWT sessions, Credentials (OAuth deferred) |
| Icons | `@phosphor-icons/react/ssr` — use suffixed names (e.g. `SunIcon`, `MoonIcon`) |

## Conventions

- **Branches**: short-lived feature branches (`feat/...`, `chore/...`) + PRs into `main`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description` (lowercase description after the colon). Examples: `feat(api): add posts route`, `fix(models): align Post timestamps`, `chore(docs): update PLAN after feed-ui merge`. Prefer **`chore(docs): …`** for documentation-only changes; avoid a loose **`docs:`** prefix without a conventional type/scope.
- **Merges**: **regular merge commits** into `main` (no squash) — preserves verbose history for review and portfolio narrative.
- **After a PR merges:** Update local `main` (`git checkout main`, then `git pull origin main`), then remove the local feature branch if you no longer need it: `git branch -d <branch-name>` (safe delete if Git sees it as merged). Use `git branch -D <branch-name>` only if you intentionally force-delete despite Git’s warning.
- **Secrets**: never commit `.env.local`. Required vars include `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL` (see README when present).

## Pointers (read before large changes)

1. **Plan & todos** (canonical, in repo):  
   [`docs/PLAN.md`](docs/PLAN.md)  
   — phased build order, data model, API sketch, **current state**, **decisions log**, **gotchas** (YAML front-matter lists todo ids for tracking).
2. **Subagent / interim reports** (this repo):  
   [`notes/agent-reports.md`](notes/agent-reports.md)  
   — append after labor-intensive agent runs; newest entries at top.

## Gotchas index (details in [`docs/PLAN.md`](docs/PLAN.md))

- **MongoDB Atlas**: IP Access List must allow your current IP or you get auth / connection failures.
- **Edge vs Node**: Route `proxy.ts` (middleware) runs on the Edge runtime — **no Mongoose** there. Use split NextAuth config: edge-safe [`auth.config.ts`](auth.config.ts), full config with Credentials in [`lib/auth.ts`](lib/auth.ts).
- **Next.js 16**: `middleware.ts` → **`proxy.ts`** (run codemod `npx @next/codemod@canary middleware-to-proxy .` if migrating).
- **Mongoose in dev**: cache connection on **`globalThis`** in [`lib/db.ts`](lib/db.ts) to avoid connection leaks on HMR.
- **Zod v4**: prefer `z.email()` instead of deprecated `z.string().email()`.
- **NextAuth types**: augment `AdapterUser` (and session/JWT) in [`types/next-auth.d.ts`](types/next-auth.d.ts) for custom fields like `username`.
- **Tailwind v4 + Geist**: map `--font-sans` / `--font-mono` in `app/globals.css` `@theme inline` and use `font-sans` on `<body>` if fonts fall back to Times.
- **npm package names**: lowercase only (e.g. `forgotten-social`, not `ForgottenSocial`).
- **PowerShell**: `Invoke-RestMethod` can hide API error bodies; use browser Network tab or `curl.exe` for debugging.

---

## Bootstrap message (paste into a new **planning** chat)

```text
You are the planning agent for ForgottenSocial (Next.js 16 + TS + Tailwind + MongoDB).
Planning only: roadmap, docs, review guidance, and handoff prompts for Agent mode / subagents.
Do not implement app code (app/, components/, lib/* runtime code, models/, API routes) unless I explicitly ask you to.

Read in order:
1. forgotten-social/AGENTS.md (including § Snapshot for new chats)
2. forgotten-social/docs/PLAN.md — especially § Snapshot for a fresh planning chat + YAML todos + § Current state
3. forgotten-social/notes/agent-reports.md — newest entries first

Then summarize: (a) MVP shipped vs deferred, (b) optional next steps (OAuth, proxy, deploy).
Wait for my confirmation before assuming implementation work.
```
