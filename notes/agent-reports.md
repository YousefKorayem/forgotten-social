# Agent reports (interim handoff log)

**Purpose:** After a **build agent** (Cursor Agent mode / subagent—the **planning agent does not write app code**) finishes a slice, **append a new entry at the top** of this file. The **planning agent** reads this log to advise you and update [`docs/PLAN.md`](../docs/PLAN.md) / [`AGENTS.md`](../AGENTS.md); it **does not** replace build-agent entries here.

---

### 2026-05-08 — Merge: `feat/polish-mvp` → `main`

- **Outcome:** Polish PR merged (regular merge). MVP polish on `main`. **Deferred:** OAuth (`auth`), `proxy.ts` (`middleware`).

---

### 2026-05-08 — Polish MVP pass

- **Branch:** `feat/polish-mvp`
- **Scope:** Complete [`docs/PLAN.md`](../docs/PLAN.md) **`polish`** slice. Replaced the generic create-next-app `README.md` with project setup docs, prerequisites, required env vars, local commands, and links to `docs/PLAN.md` / `AGENTS.md`. Improved global/following feed empty copy and layout; added `FeedList` skeletons for initial load and load-more states; kept feedback inline with existing `Alert` / `Card` components instead of adding a toast dependency. Added composer success feedback and small-screen submit layout polish. Added `app/not-found.tsx` for unknown routes while preserving dynamic profile `notFound()` behavior. Tightened profile header wrapping and profile empty-state copy/layout for narrow screens.

**Files created**

- `app/not-found.tsx`

**Files modified**

- `README.md`
- `components/feed-list.tsx`
- `components/home-feed.tsx`
- `components/composer.tsx`
- `app/[username]/page.tsx`
- `docs/PLAN.md` — **`polish`** completed

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — completed successfully; route list includes **`ƒ /_not-found`**

**Follow-ups**

- **`auth`** / OAuth remains deferred per plan.
- **`middleware`** remains open per plan.

---

### 2026-05-08 — Following feed API + home tabs

- **Branch:** `feat/following-feed`
- **Scope:** Implement [`docs/PLAN.md`](../docs/PLAN.md) **`following-feed`**: **`GET`** **`/api/posts/feed`** (`app/api/posts/feed/route.ts`) — **`runtime`** **`nodejs`**, **`dbConnect()`**, **`auth()`** required (**401** if unsigned); resolve viewer **`ObjectId`**; **`Follow.find({ follower })`** → **`following`** ids; empty → **`{ posts: [], nextCursor: null }`**; else **`Post.find({ author: { $in } })`** newest-first (**`_id`** desc), cursor + limit aligned with **`GET`** **`/api/posts`** (**400** invalid cursor); batch **`likedByMe`** like global feed. Shared serialization/cursor/limit in **`lib/post-feed-shared.ts`** + **`lib/feed-constants.ts`**; **`app/api/posts/route.ts`** refactored to import helpers. **Home:** shadcn **`Tabs`** (**variant** **`line`**) **For you** vs **Following**; **For you** keeps **Composer** + inject-post **`FeedList`** on **`/api/posts`**; **Following** uses **`FeedList`** **`apiPath`** **`/api/posts/feed`** (composer omitted). Signed-out users: **Following** tab hidden (single-column global feed only).

**Files created**

- `app/api/posts/feed/route.ts`
- `lib/post-feed-shared.ts`
- `lib/feed-constants.ts`
- `components/ui/tabs.tsx` (shadcn)

**Files modified**

- `app/api/posts/route.ts` — shared feed helpers
- `components/feed-list.tsx` — **`apiPath`**, optional empty copy
- `components/home-feed.tsx` — tabs + following **`FeedList`**
- `app/page.tsx` — home blurb
- `docs/PLAN.md` — **`following-feed`** completed

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — success; route **`ƒ /api/posts/feed`**

**Follow-ups**

- **`polish`** per plan

---

### 2026-05-08 — Like API + `LikeButton`

- **Branch:** `feat/like-api`
- **Scope:** Implement [`docs/PLAN.md`](../docs/PLAN.md) **like** slice: **`POST`** / **`DELETE`** `app/api/posts/[id]/like/route.ts` with **`runtime = "nodejs"`**, **`dbConnect()`**, **`auth()`**, **`Like`** compound unique **`{ user, post }`**. **Like** create then **`Post.updateOne`** **`$inc`** **`likeCount`** **+1**; duplicate key **11000** on like treated as idempotent success (**200** + **`{ liked, likeCount }`**, aligned with follow duplicate handling). **Unlike:** **`Like.deleteOne`** then **`$inc`** **-1** only when a row was removed; **404** when post id invalid or post missing; **204** when post exists (idempotent whether or not a like row existed). **401** without session. **`FeedPost.likedByMe`** optional; **`GET /api/posts`** and profile **`/[username]`** batch-query **`Like`** for the signed-in viewer. **`LikeButton`** client component replaces **`PostCard`** heart placeholder (home **`FeedList`** + profile); optimistic like state and count; session loading skeleton; signed-out users get **Sign in** link on the control; **401** from API shows destructive alert + **Sign in** button.

**Files created**

- `app/api/posts/[id]/like/route.ts`
- `components/like-button.tsx`

**Files modified**

- `types/feed.ts` — `likedByMe?` on **`FeedPost`**
- `lib/serialize-feed-post.ts` — optional **`likedByMe`** on serialize
- `app/api/posts/route.ts` — **`GET`** attaches **`likedByMe`**; **`POST`** create returns **`likedByMe: false`**
- `app/[username]/page.tsx` — viewer **`Like`** lookup for profile posts
- `components/post-card.tsx` — **`LikeButton`**

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — completed successfully; route list includes **`ƒ /api/posts/[id]/like`**

**Follow-ups**

- **`following-feed`:** **`GET /api/posts/feed`** + home tab per plan

---

### 2026-05-08 — Merge: `feat/follow-api` → `main`

- **Outcome:** Follow PR merged (regular merge). `main` includes `/api/users/[username]/follow` and **`FollowButton`**. **Next build slice:** **`like`** (API + **`LikeButton`**).

---

### 2026-05-08 — Follow API + `FollowButton`

- **Branch:** `feat/follow-api`
- **Scope:** Implement [`docs/PLAN.md`](../docs/PLAN.md) **follow** slice: `POST`/`DELETE` `/api/users/[username]/follow` (`app/api/users/[username]/follow/route.ts`) with `auth()`, target resolved by lowercase `username`, reject self follow/unfollow (**400**), **401** without session, **404** when profile user missing. **`Follow.create`** with compound unique index on **`Follow`**; Mongo duplicate key **11000** on follow treated as idempotent success (**200** + `{ following, followersCount }`). **`DELETE`** uses **`Follow.deleteOne`**; idempotent **204** when target user exists (no body — whether a row was removed or not). **`POST`** documents empty-body behavior (no `request.json()`, no Zod). **`FollowButton`** client component on **`/[username]`** — hidden for logged-out or own profile, loading skeleton when session loading, optimistic follow state with **`router.refresh()`** after mutation. Replaced profile “Follow button coming soon” placeholder.

**Files created**

- `app/api/users/[username]/follow/route.ts`
- `components/follow-button.tsx`

**Files modified**

- `app/[username]/page.tsx` — `auth()` + `Follow.exists` for initial state, render `FollowButton`
- `docs/PLAN.md` — follow todo **completed**; current-state blurb updated

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — completed successfully; route list includes `ƒ /api/users/[username]/follow`

**Follow-ups**

- **`like`:** API + `LikeButton` per plan
- **`following-feed`:** next after like

---

### 2026-05-08 — Merge: `feat/profile-page` → `main`

- **Outcome:** Profile PR merged (regular merge). `main` includes `/[username]`, shared post serialization, profile counts from **`Follow`**. **Next build slice:** **`follow`** (API + `FollowButton`).

---

### 2026-05-08 — Profile page: server-rendered `/[username]`

- **Branch:** `feat/profile-page`
- **Commits:** `7d7ee09` (`feat(profile): add server-rendered profile page`); this report entry committed after on the same branch
- **Scope:** Implement [`docs/PLAN.md`](../docs/PLAN.md) **profile** slice: server-rendered dynamic profile route resolves `User.username` case-insensitively via lowercase route segment, returns `notFound()` for missing users, selects only public user fields (`username`, `name`, `image`, `bio`), counts followers/following from `Follow`, and renders the latest 20 authored posts through the shared feed post serializer and existing `PostCard`.

**Files created**

- `app/[username]/page.tsx` — profile header, avatar/bio block, counts row, empty state, latest posts list
- `lib/serialize-feed-post.ts` — shared `FeedPost` serialization reused by `app/api/posts/route.ts` and the profile page

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — completed successfully; route list includes `ƒ /[username]`

**Follow-ups**

- `follow`: replace the non-interactive follow placeholder once follow/unfollow API and `FollowButton` exist
- `like`: replace `PostCard` heart/count placeholder with `LikeButton`

---

### 2026-05-07 — Merge: `feat/feed-ui` → `main`

- **Outcome:** Feed UI PR merged (regular merge). `main` includes home feed, composer, infinite scroll; next priority per prior report: **`profile`** (`/[username]`).

---

### 2026-05-07 — Feed UI: home feed, composer, infinite scroll

- **Branch:** `feat/feed-ui`
- **Commits:** `95c177c` (feed UI); docs entry committed after on `feat/feed-ui`
- **Scope:** Implement [`docs/PLAN.md`](../docs/PLAN.md) **feed-ui**: replace boilerplate `app/page.tsx` with a max-width (`max-w-xl`) home column inside existing layout header/footer; **Composer** (client, `useSession`) posts JSON `{ content }` to `POST /api/posts`, prepends created post into **FeedList**; **PostCard** (author, optional avatar, short relative time, content, heart + like count placeholder); **FeedList** loads `GET /api/posts?limit=20`, cursor pagination via `nextCursor`, intersection-observer infinite scroll plus **Load more**, loading/error/empty states; 401 shows destructive alert + sign-in link/prompt (aligned with sign-up form fetch/error patterns); Lyra/Zinc + Phosphor on client via `@phosphor-icons/react`.

**Files created**

- `types/feed.ts` — `FeedPost`, API response shapes
- `lib/format-relative-time.ts` — compact relative labels for `createdAt` ISO strings
- `components/post-card.tsx`, `components/composer.tsx`, `components/feed-list.tsx`, `components/home-feed.tsx` — feed shell wiring prepend-on-create

**Files modified**

- `app/page.tsx` — home layout + `HomeFeed`

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — completed successfully

**Follow-ups**

- **`profile`:** `/[username]` route so post header links are not 404
- **Like API + `LikeButton`:** replace heart placeholder counts with real interaction

---

### 2026-05-07 — Merge: `feat/posts-api` → `main`

- **Outcome:** Posts API PR merged (regular merge). `main` includes `POST`/`GET` `/api/posts`, validation, cursor pagination; see entry below for implementation detail.

---

### 2026-05-07 — Posts API: `POST/GET /api/posts`

- **Branch:** `feat/posts-api`
- **Commits:** `90a5613` (posts route), `e02356a` (Post `IPost` timestamps); plus `docs: agent report for posts-api` on the same branch — pushed to `origin/feat/posts-api`
- **Scope:** Implement global feed and create post per [`docs/PLAN.md`](../docs/PLAN.md) (`posts-api`). `POST` requires session; body `{ content }` validated with Zod; `GET` returns newest-first feed with `cursor` (ObjectId) and optional `limit` (default 20, max 50). Runtime explicitly Node for Mongoose.

**Files created**

- `lib/validations/post.ts` — `createPostSchema` (trimmed content, 1–280 chars)
- `app/api/posts/route.ts` — `POST` (201 + `{ post }`), `GET` (`{ posts, nextCursor }`)

**Files modified**

- `models/Post.ts` — `IPost` includes `createdAt` / `updatedAt` so populated lean documents match Mongoose timestamps

**Verification**

- `npx tsc --noEmit` — exit **0**
- `npm run build` — completed successfully; route list includes `ƒ /api/posts`

**Follow-ups**

- `feed-ui`: composer, `PostCard`, infinite scroll against `nextCursor`
- Optional: tighten `proxy.ts` for `POST /api/posts` if mutations should be enforced at the edge

---

### 2026-05-07 — Merge: `feat/auth-credentials` → `main`

- **Outcome:** PR merged successfully (regular merge). Includes auth UI work + `chore(docs)` commit(s) on the same branch.
- **Local git:** Run `git checkout main` and `git pull origin main` so your machine matches GitHub; then delete the old feature branch if you like (`git branch -d feat/auth-credentials`).

---

### 2026-05-07 — Auth UI: sign-in / sign-up, UserNav, shared validation

- **Branch:** `feat/auth-credentials`
- **Commits:** `ccf5a09`, `56f1df7`, `5393096`, `8b048ab` (pushed to `origin/feat/auth-credentials`)
- **Scope:** Extract Zod auth schemas; `/sign-in` and `/sign-up` with shadcn Form + credentials + register API; `UserNav` (avatar dropdown / Sign In) in header; register route imports shared `registerSchema`.

**Files created**

- `lib/validations/auth.ts`
- `components/ui/form.tsx`
- `components/ui/alert.tsx`
- `app/sign-in/page.tsx`, `app/sign-in/sign-in-form.tsx`
- `app/sign-up/page.tsx`, `app/sign-up/sign-up-form.tsx`
- `components/user-nav.tsx`, `components/user-nav-dropdown.tsx`

**Files modified**

- `app/api/auth/register/route.ts`
- `app/layout.tsx`
- `package.json`, `package-lock.json`

**Verification**

- `npx tsc --noEmit` — exit **0**, silent.
- `npm run build` — completed successfully (production compile + static generation).
- `npm run dev` — compiled cleanly after restarting a duplicate dev process that had held port 3000.

**Manual smoke (browser)**

| Step | Result |
|------|--------|
| Home loads; header shows **Sign In** when logged out | Pass |
| `/sign-in` — centered card, email/password, link to `/sign-up` | Pass |
| `/sign-up` — username, email, password, name, link to `/sign-in` | Pass |
| Register → auto-login → redirect `/`, header shows account menu | Pass |
| Account menu → **Sign out** | Pass |
| Sign in again with registered credentials → signed-in header | Pass |

(Embedded browser sometimes did not follow `<Link>` client navigation; direct URLs matched expected UI. Password automation needed an explicit fill on the password field for controlled inputs.)

**Decisions / notes**

- **`react-hook-form` + `@hookform/resolvers`** added via npm — repo had no shadcn `form` primitive; CLI did not emit `form.tsx` until peer deps were present. `components/ui/form.tsx` was implemented manually to match existing Lyra patterns (`Slot` from `radix-ui`).
- **`alert`** added via `npx shadcn add alert` (task-allowed exception).
- **`safeCallbackUrl`** on auth pages — only internal paths starting with `/` (not `//`) to avoid open redirects.
- **Icons:** `@phosphor-icons/react/ssr` (e.g. `SignInIcon`, `WarningCircleIcon`, `SignOutIcon`).
- Brief **hydration warning** seen in dev overlay during manual browse; production build did not report related failures.

**Follow-ups**

- Optional: investigate dev-only hydration mismatch with theme / layout if it persists for users.
- PR opened by maintainer after review (not created by agent).

**PR / link:** Merged to `main` (add your GitHub PR URL here if you want it on record).

---

## Entry template (copy below the next `---`)

```markdown
### YYYY-MM-DD — short title

- **Branch:** `feat/...`
- **Commits:** `abc1234`, `def5678` (or "pending / local only")
- **Scope:** one-line summary
- **Files touched:** (optional bullet list)
- **What works:** …
- **Follow-ups:** …
- **PR / link:** …
```

---

_End of log — add new entries **above** the template block._
