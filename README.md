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
(`supabase/migrations/0002_click_function.sql`), and the hardening
migrations `0004` and `0005`.

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
  _lib/              # shared auth, validation, ratelimit, constants
  tools/             # /api/tools, /api/tools/:id, /api/tools/slug/:slug
  categories/        # /api/categories, /api/categories/:id, ...
  submissions/       # /api/submissions, /api/submissions/:id
  articles/          # /api/articles, /api/articles/:id, /api/articles/slug/:slug
  admin/             # /api/admin/auth, /api/admin/check, /api/admin/tools
  click.js           # atomic click tracking
  contact.js         # public contact form
  metrics.js         # admin dashboard metrics
src/
  components/        # shared UI (cards, header, footer, etc.)
  contexts/          # AdminAuthContext
  hooks/             # useTools, useCategories, useArticles, useDebounce
  layouts/           # PublicLayout, AdminLayout
  lib/               # supabase client, api wrapper, validation, format
  pages/             # public + admin pages
  types/             # TypeScript types
supabase/migrations/ # SQL migrations (schema + click function)
```
