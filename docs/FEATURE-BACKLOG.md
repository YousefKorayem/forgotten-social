# ForgottenSocial — Feature Backlog

> Candidate work after the MVP QA pass. This is intentionally separate from [`QA-CHECKLIST.md`](QA-CHECKLIST.md): bugs and regressions belong there; new product scope and portfolio-expansion ideas belong here.

## Near-Term UX Improvements

### Add profile link to the user dropdown

- **Type:** UX polish.
- **Why:** Signed-in users should be able to reach their own profile from the account menu without manually typing `/[username]`.
- **Suggested scope:** Add a **Profile** menu item in `UserNavDropdown` that links to `/${session.user.username}`.
- **Acceptance checks:**
  - Signed-in user menu contains a Profile link.
  - Link routes to the current user's profile.
  - Signed-out header remains unchanged.

## Optional Product Features

### Email / mailing service integration

- **Type:** Full-stack integration.
- **Why:** Demonstrates external service integration, transactional email patterns, environment configuration, and production-grade account flows.
- **Candidate providers:** Resend, Postmark, SendGrid, or Mailgun.
- **Recommended first slice:** Contact/notification plumbing only, or password-reset emails if you want auth depth.
- **Acceptance checks:**
  - Email provider credentials are read from env and documented in `README.md`.
  - Server route validates input with Zod.
  - Failure modes are handled with user-friendly UI.
  - No secrets are logged or committed.

### GitHub / Google OAuth

- **Status:** **Shipped** (2026-05) — providers + provisioning in `lib/auth.ts`, sign-in UI, README callback/env docs; see `docs/PLAN.md` YAML **`auth`** and [PR #17](https://github.com/YousefKorayem/forgotten-social/pull/17) (or merge commit on `main`).
- **Type:** Was a deferred roadmap item from `docs/PLAN.md`; kept here for follow-up ideas (account linking, more providers).
- **Why:** Shows Auth.js provider configuration, account provisioning, callback handling, and env management.
- **Suggested scope:** Implement providers in `lib/auth.ts`, add required env docs, and ensure OAuth-created users get stable usernames.
- **Acceptance checks:**
  - Credentials auth continues to work.
  - First OAuth sign-in creates or links a user safely.
  - Duplicate email behavior is defined and tested.

### Route protection via `proxy.ts`

- **Status:** **Shipped** (2026-05) — write API routes gated at edge with `401` JSON; see `docs/PLAN.md` YAML **`middleware`** and [PR #17](https://github.com/YousefKorayem/forgotten-social/pull/17). Optional follow-up: protect UI routes when you add them.
- **Type:** Was a deferred roadmap item from `docs/PLAN.md`.
- **Why:** Shows Next.js 16 middleware/proxy knowledge and Edge-runtime constraints.
- **Suggested scope:** Populate protected routes for write APIs and any protected UI routes, using the existing edge-safe auth split.
- **Acceptance checks:**
  - Unauthenticated mutation requests are blocked consistently.
  - Auth pages and public read routes remain accessible.
  - No Mongoose or Node-only imports enter `proxy.ts`.

### Notifications

- **Type:** Product feature / data modeling.
- **Why:** Demonstrates event-driven thinking and richer MongoDB relationships.
- **Suggested scope:** Create notifications for likes and follows, with a basic notifications page or dropdown badge.
- **Acceptance checks:**
  - Like/follow actions create notifications for the target user.
  - Users do not receive notifications for their own actions.
  - Notifications can be marked read.

### Comments / replies

- **Type:** Product feature / API + UI.
- **Why:** Expands the social graph and demonstrates nested or related content modeling.
- **Suggested scope:** Add replies to posts with a single-post detail page.
- **Acceptance checks:**
  - Reply creation validates length and auth.
  - Post detail page shows parent post + replies.
  - Counts stay in sync.

### Delete own posts

- **Type:** Product completeness / authorization.
- **Why:** Demonstrates ownership checks and destructive actions.
- **Suggested scope:** Add `DELETE /api/posts/[id]` and a post-card menu for the author's own posts.
- **Acceptance checks:**
  - Only the author can delete.
  - Delete updates feed/profile UI.
  - Likes for the deleted post are cleaned up or ignored safely.

### Image uploads for posts / profiles

- **Type:** Full-stack integration.
- **Why:** Demonstrates file upload constraints, hosted storage, previews, and security checks.
- **Candidate providers:** UploadThing, Cloudinary, S3-compatible storage.
- **Acceptance checks:**
  - File type and size are validated.
  - Upload errors are user-friendly.
  - Images render responsively and include alt handling where appropriate.

## Portfolio-Focused Technical Additions

### Automated tests

- **Type:** Engineering maturity.
- **Why:** Strongly improves the portfolio signal compared to adding another surface feature.
- **Suggested scope:** Unit tests for validators/helpers, route-handler integration tests for auth/posts/like/follow, and a small Playwright smoke suite.
- **Acceptance checks:**
  - Tests can run locally and in CI.
  - Critical auth and mutation paths are covered.
  - Seed/test data is isolated from production/dev data.

### CI pipeline

- **Type:** DevOps / quality gate.
- **Why:** Shows professional workflow and keeps PRs honest.
- **Suggested scope:** GitHub Actions for install, lint, typecheck, build, and eventually tests.
- **Acceptance checks:**
  - PRs run checks automatically.
  - README documents local equivalents.
  - No secrets are needed for basic checks.

### Deployment

- **Type:** Production readiness.
- **Why:** A live URL is valuable for portfolio review and surfaces real-world env/config issues.
- **Suggested scope:** Vercel deployment with Atlas, env vars, and README deploy notes.
- **Acceptance checks:**
  - Production build deploys successfully.
  - Auth callback URLs and `AUTH_URL` are correct.
  - Atlas network access is configured appropriately.

### Observability / error reporting

- **Type:** Production readiness.
- **Why:** Demonstrates mature debugging and operational awareness.
- **Suggested scope:** Add structured server logging conventions and optional Sentry.
- **Acceptance checks:**
  - Server errors include actionable context without leaking secrets.
  - Client errors are captured or surfaced clearly.
  - Known expected errors are not noisy.

## Parking Lot

- Direct messages.
- Search users/posts.
- Bookmarks.
- User settings page.
- Admin/moderation tooling.
- Rate limiting and anti-spam.
