
# Multi-Camera Face Detection Dashboard

A web dashboard for managing multiple camera streams and face recognition across them. Built with React, Vite, TypeScript, Tailwind CSS and Supabase for persistence and auth.

This README explains how to run the project locally, what environment variables are required, where to find Supabase artifacts (migrations, functions), and how to deploy.

## Quick links

- Source: `src/`
- Supabase migrations: `supabase/migrations/`
- Supabase functions: `supabase/functions/`
- Vite scripts: see `package.json` (dev, build, preview)

## Features

- Multi-camera grid and management UI
- Face recognition dashboard (known faces, detection history)
- Alerts & notifications (includes a Telegram function)
- Authentication and persistence using Supabase
- Responsive UI built with Tailwind CSS and Radix UI primitives

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI + shadcn-style components
- Supabase (database + auth + functions)
- Recharts for charts, react-query for data fetching

## Prerequisites

- Node.js (18+ recommended)
- npm (or pnpm/yarn) - this README uses npm examples
- (Optional) Supabase CLI if you plan to run migrations or deploy local functions

## Setup (local development)

1. Clone the repo and install dependencies

```cmd
git clone <repo-url>
cd "-Multi-Camera-Face-Detection-Dashboard"
npm install
```

2. Environment variables

This project expects the Supabase project URL and a public/publishable (anon) key to be available to the client. When using Vite you should expose client-side variables with the `VITE_` prefix.

Create a file named `.env.local` in the project root with the following values (example):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

Notes:
- The repo currently contains a generated `src/integrations/supabase/client.ts` file that hardcodes a Supabase URL and key for convenience during development. For a production-ready setup, replace the hardcoded values with `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`. Example:

```ts
// src/integrations/supabase/client.ts (recommended change)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: localStorage,
		persistSession: true,
		autoRefreshToken: true,
	}
});
```

3. Run the app (Windows cmd examples)

```cmd
rem ensure .env.local exists or set vars for this session
set VITE_SUPABASE_URL=https://your-project-id.supabase.co
set VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
npm run dev
```

Open the address printed by Vite (usually http://localhost:5173).

Available scripts (from `package.json`):

- `npm run dev` — start development server (Vite)
- `npm run build` — build production bundle
- `npm run build:dev` — build using development mode
- `npm run preview` — locally preview the production build
- `npm run lint` — run eslint across the project

## Supabase: migrations & functions

This repo contains a `supabase/` directory with:

- `supabase/migrations/` — SQL migrations generated for the database schema
- `supabase/functions/` — edge functions (example: Telegram notification function)

To apply migrations or deploy functions you'll want the Supabase CLI installed:

1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Log in and link your project

```cmd
supabase login
supabase link --project-ref your-project-id
```

3. Run migrations (push local migrations to the remote DB)

```cmd
supabase db push
```

4. Deploy functions (if you use them)

```cmd
supabase functions deploy send-telegram-notification
```

Refer to the Supabase docs for details on CLI commands and auth flow. The sample `supabase/config.toml` in the repo includes the `project_id` used when this project was generated.

## Deployment

This app is a Vite-based static SPA that can be hosted on Vercel, Netlify, or any static host that supports single-page apps. There is a `vercel.json` in the repo with basic configuration — set the following environment variables in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If you deploy on Vercel, add the two variables to the Vercel dashboard (Project Settings > Environment Variables). Build and preview commands are the same as local: `npm run build` and `npm run preview` to test the production output.

## Project layout (important files)

- `src/` — main source code
	- `components/` — UI components and feature groups (dashboard, face-recognition, ui)
	- `hooks/` — React hooks (auth & face recognition helpers)
	- `integrations/supabase/` — Supabase client + generated `types.ts`
	- `pages/` — app pages (Dashboard, Login, Index)
- `supabase/` — migrations, functions, `config.toml`
- `public/` — static assets

## Troubleshooting

- Blank or white screen: check the console for errors about missing env variables or network (CORS). Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are accessible.
- Authentication issues: confirm the Supabase keys and that the project's Auth settings allow the requested flows.
- Migrations not applying: be sure `supabase` CLI is linked to the correct `project-ref` and you are authenticated.

## Contributing

If you'd like to contribute:

1. Fork and create a branch for your feature/fix
2. Make changes and run `npm run lint`
3. Open a PR with a description of your change

If you add public-facing env variables or change the Supabase schema, update this README and the `supabase/` folder as needed.

## License

This repository does not contain a license file. If you want a permissive license, add a `LICENSE` (for example MIT) and update this section.

---

If you'd like, I can also:

- change the bundled Supabase client to load from `import.meta.env` and apply that change across the repo; or
- add a small CONTRIBUTING.md and CODE_OF_CONDUCT; or
- create a short dev checklist with exact Windows cmd examples for common tasks.

Tell me which extra item you'd like next and I'll apply it.


