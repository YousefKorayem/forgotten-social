<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ForgottenSocial — agent guide

## Project

**ForgottenSocial** is a Twitter-style social network built as a portfolio full-stack app. MVP scope: credentials auth, profiles, text posts, likes, follows, and a following-only feed. Backend is Next.js route handlers (`app/api/.../route.ts`), not a separate Express server.

## How we use AI (planning vs building)

- **Planning / review chat** (the long-lived chat that owns [`docs/PLAN.md`](docs/PLAN.md) and this file): roadmap, tradeoffs, PR review guidance, doc updates, and handoff prompts. It **does not** implement application code unless you explicitly ask it to—default stance is **plan and review only**.
- **Build agents** (Cursor **Agent** mode, task runners, or dedicated implementation chats): write and refactor code, run tests and builds, make commits, and **append a report** to [`notes/agent-reports.md`](notes/agent-reports.md) when a slice is finished.

If something is ambiguous, the planning chat clarifies the spec; the build agent executes against [`docs/PLAN.md`](docs/PLAN.md) and existing patterns in the repo.

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
- **Commits**: conventional commits where practical.
- **Merges**: **regular merge commits** into `main` (no squash) — preserves verbose history for review and portfolio narrative.
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

## Bootstrap message (paste into a new planning chat)

```text
We're building ForgottenSocial, a Next.js 16 + TS + Tailwind + MongoDB social
network. Read these files in order before responding:

1. forgotten-social/AGENTS.md  — project guide
2. forgotten-social/notes/agent-reports.md  — recent agent work
3. forgotten-social/docs/PLAN.md
   — current todos, decisions log, gotchas

Then summarize: (a) what's done, (b) what's in flight, (c) what the next todo is.
This chat is planning/review only unless I ask you to implement—build work goes to Agent mode / subagents.
Wait for me to confirm before doing anything.
```
