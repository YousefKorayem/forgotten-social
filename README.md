# ForgottenSocial

ForgottenSocial is a small Twitter-style social app built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Auth.js, and MongoDB/Mongoose. The MVP supports credentials auth, profiles, text posts, likes, follows, and global/following feeds.

## Prerequisites

- Node.js 20+ is recommended for Next.js 16.
- A MongoDB Atlas account and cluster connection string.

## Environment

Create a local `.env.local` file in this directory. Never commit `.env.local` or real secrets.

```bash
MONGODB_URI="mongodb+srv://..."
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
AUTH_GITHUB_ID="github-oauth-client-id"
AUTH_GITHUB_SECRET="github-oauth-client-secret"
AUTH_GOOGLE_ID="google-oauth-client-id"
AUTH_GOOGLE_SECRET="google-oauth-client-secret"
```

- `MONGODB_URI` connects Mongoose to MongoDB Atlas.
- `AUTH_SECRET` signs Auth.js session tokens.
- `AUTH_URL` tells Auth.js the app's canonical URL for redirects and callbacks.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` configure the GitHub OAuth provider.
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` configure the Google OAuth provider.

OAuth app setup references:

- [GitHub OAuth Apps docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- [Google OAuth 2.0 setup docs](https://developers.google.com/identity/protocols/oauth2)

## Local Development

```bash
git clone <repo-url>
cd forgotten-social
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Optional production check:

```bash
npm run build
```

## Project Docs

- [docs/PLAN.md](docs/PLAN.md) — roadmap, architecture, decisions log, YAML todos. Start with **§ Snapshot for a fresh planning chat** when resuming work without prior conversation context.
- [AGENTS.md](AGENTS.md) — repo conventions, planning vs build agents, **§ Snapshot for new chats**.

## Deployment

The app is Vercel-compatible. Configure the same environment variables in the hosting provider and keep MongoDB Atlas network access aligned with the deployed runtime.
