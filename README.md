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
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` configure the GitHub OAuth provider (aliases: `GITHUB_ID` / `GITHUB_SECRET`).
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` configure the Google OAuth provider (aliases: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`).
- `AUTH_URL` must match the origin users use in the browser (e.g. `http://localhost:3000` locally). Mismatched ports or `https` vs `http` breaks OAuth redirects.

### OAuth callback URLs (local dev)

Auth.js expects these exact paths (replace host if you use another port):

| Provider | Redirect / callback URL |
|----------|-------------------------|
| GitHub | `http://localhost:3000/api/auth/callback/github` |
| Google | `http://localhost:3000/api/auth/callback/google` |

**GitHub:** create an **OAuth App** (not a GitHub App). Set **Homepage URL** to `http://localhost:3000` and **Authorization callback URL** to the GitHub row above.

**Google Cloud Console:** APIs & Services → Credentials → **Create credentials** → **OAuth client ID** → application type **Web application**. Under **Authorized JavaScript origins** add `http://localhost:3000`. Under **Authorized redirect URIs** add the Google row above. Use that client’s **Client ID** and **Client secret** in `.env.local`.

### OAuth troubleshooting

- **GitHub shows 404:** Callback URL in the GitHub OAuth App settings does not match the running app (wrong port, missing `/api/auth/callback/github`, or `https` vs `http`). Fix the URL and save.
- **Google `invalid_client` / “OAuth client was not found”:** Wrong or empty client ID/secret (typo, extra quotes/spaces in `.env.local`), using an **Android/iOS** client instead of **Web application**, or credentials from a different GCP project. Regenerate the client secret if unsure and restart `npm run dev`.

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
