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
```

- `MONGODB_URI` connects Mongoose to MongoDB Atlas.
- `AUTH_SECRET` signs Auth.js session tokens.
- `AUTH_URL` tells Auth.js the app's canonical URL for redirects and callbacks.

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

- [docs/PLAN.md](docs/PLAN.md) is the roadmap, architecture notes, decisions log, and current task list.
- [AGENTS.md](AGENTS.md) documents repo conventions and the planning/build-agent workflow.

## Deployment

The app is Vercel-compatible. Configure the same environment variables in the hosting provider and keep MongoDB Atlas network access aligned with the deployed runtime.
