# Aivora

A production-oriented AI tools directory. Discover, search, filter, and explore AI tools.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4
- React Router
- Lucide icons
- Supabase (Postgres + Auth + RLS)
- Vercel serverless API routes

## Local development

```bash
npm install
npm run dev
```

Set the following environment variables (Vercel project settings, or a local
`.env` for development):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
IP_HASH_SALT=
VITE_SITE_URL=https://your-production-domain.com
ALLOWED_ORIGINS=https://your-production-domain.com
```

> Fill in real values from your Supabase project settings. The
> `SUPABASE_SERVICE_ROLE_KEY` is a server-only secret — never prefix it with
> `VITE_`, never commit it, and never reference it from client code. If a real
> service-role key was ever committed, rotate/revoke it in the Supabase
> dashboard immediately. `VITE_SITE_URL` (no trailing slash) drives absolute
> canonical/sitemap/robots/OG URLs; if unset, the deployed domain is derived
> from the request.

The `VITE_*` values ship to the browser; the others are server-only.

## Database

The Supabase schema lives in `supabase/migrations/0001_init.sql`. For
self-hosted deployments, apply the migration, the click-counter function
(`supabase/migrations/0002_click_function.sql`), the hardening
migrations `0004` and `0005`, and the ad slots table (`0006_ad_slots.sql`)
if you plan to use the admin **Ad slots** page.

## Admin access

There is **no** built-in admin account. To grant a user admin powers:

1. Create the user in the Supabase Auth dashboard (Authentication → Users).
2. Note their UUID.
3. Insert a row into `public.admin_users`:

   ```sql
   insert into public.admin_users (user_id, role)
   values ('00000000-0000-0000-0000-000000000000', 'admin');
   ```

4. The user can now sign in at `/admin/login`.

Authorization is verified **server-side** on every admin request. The frontend
never gets to decide who is an admin.

## Project structure

```
api/                 # Vercel serverless API routes
  _lib/              # shared auth, validation, ratelimit, constants, db-wake
  _lib/handlers/     # actual route logic (see note below)
  tools/             # [...segments].js -> /api/tools, /:id, /slug/:slug
  categories/        # [...segments].js -> /api/categories, /:id, /slug/:slug
  submissions/       # [...segments].js -> /api/submissions, /:id
  ad-slots/          # [...segments].js -> /api/ad-slots, /:id
  articles/          # [...segments].js -> /api/articles, /:id, /slug/:slug
  admin/             # [...segments].js -> /api/admin/auth|check|tools|ad-slots
  click.js           # atomic click tracking
  contact.js         # public contact form
  metrics.js         # admin dashboard metrics
src/
  components/        # shared UI (cards, header, footer, AdSlot, etc.)
  contexts/          # AdminAuthContext
  hooks/             # useTools, useCategories, useArticles, useDebounce
  layouts/           # PublicLayout, AdminLayout
  lib/               # supabase client, api wrapper, validation, format, adSlots cache
  pages/             # public + admin pages
  types/             # TypeScript types
supabase/migrations/ # SQL migrations (schema + click function + ad_slots)
```

**Why `[...segments].js` instead of one file per route?** Vercel's Hobby
(free) plan caps a deployment at **12 Serverless Functions**. Each `.js` file
directly under `api/` (outside `_lib/`) counts as one function, and one file
per REST route quickly exceeds that. Each resource folder instead has a
single **mandatory** catch-all route (`[...segments].js`, Vercel's
native/framework-agnostic dynamic-route syntax — note this is *not* the same
as Next.js's optional `[[...segments]].js`, which Vercel's plain Serverless
Functions runtime does not recognize as a route at all) that dispatches, by
segment count, to the handler that used to live at that exact path — now
moved verbatim into `api/_lib/handlers/` (no behavior changed, just where the
code lives). This keeps the project at 11 functions total. If you're on a
paid Vercel plan and prefer one file per route for readability, you can
freely split these back out.

A mandatory catch-all (`[...segments].js`) never matches the *bare* resource
path by itself (e.g. `/api/tools` with zero extra segments) — only paths
with at least one segment. `vercel.json` therefore rewrites the five bare
list/create endpoints (`/api/tools`, `/api/categories`, `/api/articles`,
`/api/submissions`, `/api/ad-slots`) to a `.../__root__` sentinel path before
they reach the function, and each router treats a single `__root__` segment
exactly like zero segments. `/api/admin/*` doesn't need this since it has no
bare-path route (always `/api/admin/auth`, `/check`, `/tools`, `/ad-slots`).
