# Aivora — Phase 1 Production Database Migration Audit

**Status:** DIAGNOSTIC ONLY. No database, frontend, or code changes were made in this phase.
**Date:** Phase 1 audit
**Target:** Migrate the data layer from SQLite/local-file to PostgreSQL/Supabase for a Vercel production deployment.
**Author:** Audit pass (read-only).

> This report is the **only** artifact produced by Phase 1. It must be sufficient for the Phase 2 implementer to perform the SQLite → PostgreSQL/Supabase migration without rediscovering the architecture.

---

## A. Current architecture

### Stack
- **Framework:** Next.js 16 (App Router), TypeScript, React 19.
- **Data layer:** Prisma ORM (`prisma@^6.11.1`, `@prisma/client@^6.11.1`).
- **Database:** SQLite, single local file at `db/custom.db` (absolute `DATABASE_URL=file:/home/z/my-project/db/custom.db` in `.env`).
- **Auth:** Custom JWT-in-httpOnly-cookie (`src/lib/auth.ts`) + bcryptjs password hashing. No NextAuth in the admin flow (NextAuth is a dependency but unused here).
- **Server-side admin gate:** `src/proxy.ts` (Next.js 16 "proxy" convention, successor to middleware) verifies the JWT cookie and redirects unauthenticated `/admin/*` requests to `/admin/login` before render.
- **API:** App Router route handlers under `src/app/api/*`. No server actions. No raw SQL. One `$transaction` (click tracking).
- **Client data:** `src/components/tools-list-view.tsx` fetches `/api/tools` from the client; admin pages fetch their respective admin APIs.

### Database access singleton
`src/lib/db.ts`:
```ts
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```
- In dev, a single client is cached on `globalThis` to survive HMR. In production a **new `PrismaClient` is created on every serverless invocation** and never cached. This is acceptable on Vercel *only if* the client connects to a remote DB (Postgres). With SQLite the production branch is broken regardless (no file).

### Build / deploy
- `next.config.ts`: `output: "standalone"`, `typescript.ignoreBuildErrors: true`, `reactStrictMode: false`.
- `package.json` `build` script: `next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/`. **Does not copy `db/`** → standalone artifact has no SQLite file.
- No `prisma/migrations/` directory. Schema is applied via `prisma db push --accept-data-loss` only. No migration history.
- `db/custom.db` is **committed to git** (299 KB), containing seeded demo data + the seeded admin password hash.
- `.env` is gitignored; `DATABASE_URL` is the only env var defined.

---

## B. Complete Prisma model inventory

Source of truth: `prisma/schema.prisma` (verified line-by-line). There are **9 models**. The task brief listed `ContactMessage`; the actual model is named **`Contact`** — the audit uses the real name.

### B.1 `Tool`
- **Fields/types:**
  - `id String @id @default(cuid())`
  - `name String` (required)
  - `slug String @unique`
  - `description String` (required)
  - `websiteUrl String` (required)
  - `categoryId String?` (nullable FK → Category)
  - `status String @default("pending")` — string enum-by-convention: `pending | approved | rejected`
  - `pricing String @default("Free")` — string enum-by-convention: `Free | Freemium | Paid | Contact for pricing`
  - `tags String @default("")` — comma-separated tags (no array; SQLite constraint per project rules)
  - `logo String?` — nullable; may be an image URL, an emoji, or empty
  - `clicksCount Int @default(0)` — denormalized counter
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
- **Relations:** `category Category?` (`onDelete: SetNull`), `clicks Click[]` (cascade from Click side).
- **Indexes:** `@@index([categoryId])`, `@@index([status])`.
- **Used by:** public Tools list (`/tools`, `/category/[slug]`, home, top-tools, tool detail), admin Tools list/create/edit, submissions approve (creates Tool), click tracking (increments `clicksCount`), sitemap, stats, dashboard.
- **User-generated data:** name/description/websiteUrl come from admin or from approved submissions; `clicksCount` is incremented by public visitors.
- **Must survive deployment:** yes — this is the core content of the directory.

### B.2 `Category`
- **Fields:** `id String @id @default(cuid())`, `name String`, `slug String @unique`, `icon String @default("🏷️")`, `description String @default("")`, `createdAt`, `updatedAt`.
- **Relations:** `tools Tool[]`, `submissions Submission[] @relation("SubmissionCategory")`.
- **Indexes:** `slug @unique` (implicit index).
- **Used by:** categories list, category detail, tool cards (badge), tool detail, admin Categories, tool form (Select), sitemap, home category grid, constants.ts (`getCategoriesWithCounts`).
- **Must survive deployment:** yes.

### B.3 `Article`
- **Fields:** `id String @id @default(cuid())`, `title String`, `slug String @unique`, `content String @default("")` (HTML), `excerpt String @default("")`, `coverImage String?`, `published Boolean @default(false)`, `createdAt`, `updatedAt`.
- **Relations:** none.
- **Indexes:** `slug @unique`.
- **Used by:** public Blog list (published only), Blog detail (published guard), admin Articles list/create/edit, sitemap, home blog preview, stats.
- **Must survive deployment:** yes — editorial content.

### B.4 `Submission`
- **Fields:** `id String @id @default(cuid())`, `toolName String`, `websiteUrl String`, `description String`, `submitterEmail String`, `categoryId String?`, `status String @default("pending")`, `createdAt`, `updatedAt`.
- **Relations:** `category Category? @relation("SubmissionCategory")` (`onDelete: SetNull`).
- **Indexes:** `@@index([status])`.
- **Used by:** public Submit form (creates `pending`), admin Submissions list/approve/reject/delete, stats.
- **User-generated data:** yes — public visitors submit. `submitterEmail` is visitor PII.
- **Must survive deployment:** pending submissions should; approved ones are converted to Tool and can be retained or archived.

### B.5 `AdSlot`
- **Fields:** `id String @id @default(cuid())`, `position String`, `code String` (full HTML/JS), `isActive Boolean @default(true)`, `createdAt`, `updatedAt`.
- **Relations:** none.
- **Indexes:** `@@index([position])`.
- **Used by:** public `AdSlot` server component (`getActiveAdSlots`), admin Ad Slots CRUD.
- **Must survive deployment:** yes — monetization config. `code` contains trusted admin HTML/JS (rendered via `dangerouslySetInnerHTML` + script execution for AdSense).

### B.6 `Click`
- **Fields:** `id String @id @default(cuid())`, `toolId String`, `createdAt DateTime @default(now())`.
- **Relations:** `tool Tool @relation` (`onDelete: Cascade`).
- **Indexes:** `@@index([toolId])`, `@@index([createdAt])`.
- **Used by:** click tracking endpoint (`POST /api/tools/[id]/click`), stats (total + 30-day counts), dashboard.
- **User-generated data:** yes — one row per visitor "Visit website" click. High write volume.
- **Must survive deployment:** no strict requirement (analytics); loss is acceptable but undesirable. This is the highest-volume table and the only one using a transaction.

### B.7 `Contact`
- **Fields:** `id String @id @default(cuid())`, `name String`, `email String`, `message String`, `createdAt DateTime @default(now())`.
- **Relations:** none. **No `updatedAt`.**
- **Indexes:** none.
- **Used by:** public Contact form (creates), admin Contact list (read), dashboard recent messages.
- **User-generated data:** yes — visitor PII (name/email/message).
- **Must survive deployment:** ideally yes (admin follow-up).

### B.8 `AdminUser`
- **Fields:** `id String @id @default(cuid())`, `email String @unique`, `name String @default("")`, `passwordHash String`, `createdAt`, `updatedAt`.
- **Relations:** none.
- **Indexes:** `email @unique`.
- **Used by:** `/api/auth/login` (findUnique by email, bcrypt compare), `ensureDefaultAdmin` (dev-only create), admin Settings (`/api/auth/me`).
- **Must survive deployment:** **critical** — without an AdminUser row, no one can log in. On a fresh production DB there must be at least one admin.

### B.9 `SiteSetting`
- **Fields:** `id String @id @default(cuid())`, `key String @unique`, `value String @default("")`.
- **Relations:** none.
- **Used by:** **not used anywhere in `src/`** (grep found zero usages). Dead model.
- **Must survive deployment:** no — currently vestigial. Can be dropped in Phase 2 or kept for future use.

---

## C. Database dependency map (every DB operation)

**Notation:** `file:line — operation(model)`.

### Public pages (server components, read-only)
- `src/app/(site)/page.tsx` (Home): `findMany(tool)` (featured, approved, orderBy clicksCount), `findMany(article)` (published), `count(tool)`; via `getCategoriesWithCounts()` → `findMany(category)` with `_count`.
- `src/app/(site)/tools/page.tsx` (Tools list SSR): `count(tool)`, `findMany(tool)` (filtered, include category); categories via `getCategoriesWithCounts()`.
- `src/app/(site)/tools/[slug]/page.tsx` (Tool detail): `findUnique(tool by slug, include category)`; related: `findMany(tool, same category, exclude current)`.
- `src/app/(site)/category/[slug]/page.tsx`: `findUnique(category by slug)`; SSR first page: `count(tool)`, `findMany(tool)`.
- `src/app/(site)/top-tools/page.tsx`: `findMany(tool, approved, orderBy clicksCount desc, take 50, include category)`.
- `src/app/(site)/blog/page.tsx`: `findMany(article, published, orderBy createdAt desc)`.
- `src/app/(site)/blog/[slug]/page.tsx`: `findUnique(article by slug)` + guard `!published → 404`.
- `src/app/sitemap.ts`: `findMany(tool, approved, select slug/updatedAt)`, `findMany(category)`, `findMany(article, published)`.

### Public API routes
- `src/app/api/tools/route.ts` GET: `count(tool)`, `findMany(tool)` — filters: `status:"approved"`, `OR[name/description/tags contains q]`, `category.slug`, `pricing`. **SQLite `contains` is case-insensitive; Postgres default is case-sensitive** — see §E.
- `src/app/api/tools/[id]/click/route.ts` POST: `findUnique(tool by slug)`, **`$transaction([click.create, tool.update clicksCount increment])`**. The only transaction in the codebase.
- `src/app/api/submissions/route.ts` POST (public): `submission.create` (status pending).
- `src/app/api/contacts/route.ts` POST (public): `contact.create`.
- `src/app/api/categories/route.ts` GET (public list): `findMany(category)` with `_count`.
- `src/app/api/articles/route.ts` GET: public branch → `article.count/findMany` (`published:true`); admin branch (`?admin=1`) → guarded by `adminGuard()`, returns all articles.

### Admin API routes (all guarded by `adminGuard()` / `getSession()`)
- `src/app/api/auth/login/route.ts` POST: `adminUser.findUnique(email lowercased)` + bcrypt compare + `setSessionCookie`.
- `src/app/api/admin/tools/route.ts` GET: `count(tool)`, `findMany(tool)` (any status, include category).
- `src/app/api/tools/create/route.ts` POST: `tool.create` (slug via `ensureUniqueSlug`).
- `src/app/api/tools/[id]/route.ts`: GET `findUnique(tool, include category)`; PUT `tool.update`; DELETE `tool.delete`.
- `src/app/api/categories/[id]/route.ts`: GET `findUnique`; PUT `update`; DELETE `delete` — **409 guard**: `count(tool, categoryId)` blocks delete unless `?force=1`.
- `src/app/api/categories/route.ts` POST: `category.create`.
- `src/app/api/submissions/route.ts` GET (admin): `count`, `findMany` (include category), filter by status/q.
- `src/app/api/submissions/[id]/approve/route.ts` POST: `submission.findUnique` → `tool.create` (approved) + `submission.update(status approved)`. **Not wrapped in a transaction** (see §E risks).
- `src/app/api/submissions/[id]/reject/route.ts` POST: `submission.update(status rejected)`.
- `src/app/api/submissions/[id]/route.ts` DELETE: `submission.delete`.
- `src/app/api/articles/route.ts` POST: `article.create`.
- `src/app/api/articles/[id]/route.ts`: GET `findUnique`; PUT `update`; DELETE `delete`.
- `src/app/api/ad-slots/route.ts`: GET `findMany`; POST `create`.
- `src/app/api/ad-slots/[id]/route.ts`: PUT `update`; DELETE `delete`.
- `src/app/api/contacts/route.ts` GET (admin): `findMany(contact, take 100)`.
- `src/app/api/stats/route.ts` GET: 11× `count(...)`, 1× `findMany(tool, orderBy clicksCount, take 5)`, 1× `findMany(contact, take 5)`.

### Admin pages (server components)
- `src/app/admin/page.tsx` (Dashboard): 11× `count`, `findMany(tool, take 5)`, `findMany(contact, take 5)`.
- `src/app/admin/tools/[id]/page.tsx`: `findUnique(tool, include category)`.
- `src/app/admin/articles/[id]/page.tsx`: `findUnique(article)`.

### Lib helpers
- `src/lib/auth.ts`: `adminUser.findUnique` (login, ensureDefaultAdmin), `adminUser.create` (dev-only).
- `src/lib/constants.ts`: `adSlot.findMany(active by position)` (`getActiveAdSlots`), `category.findMany` with `_count` (`getCategoriesWithCounts`).
- `src/lib/slug.ts` `ensureUniqueSlug`: `findUnique(tool/category/article by slug, select id)` — uniqueness loop, used on every create/edit of tools/categories/articles.

### Raw SQL / transactions
- **Raw SQL:** none anywhere.
- **Transactions:** exactly one — `src/app/api/tools/[id]/click/route.ts` (`$transaction([click.create, tool.update])`).

---

## D. SQLite-specific risks

1. **`provider = "sqlite"` in `prisma/schema.prisma`** — the only provider declaration. Must change to `"postgresql"` in Phase 2.

2. **`DATABASE_URL=file:/home/z/my-project/db/custom.db`** — absolute local filesystem path. Will not exist on Vercel. Must become a `postgresql://` / Supabase pool URL in Phase 2.

3. **`db/custom.db` committed to git** — ships the seeded admin bcrypt hash and demo data in the repo. On any host that reads this path the app would "work" but with a stale, repo-visible credential set. Should be untracked in Phase 2 (data is migrated, not copied).

4. **`prisma db push --accept-data-loss` is the only schema-applier** — no `prisma/migrations/` history. `db push` is fine for dev but **not for production** (no reviewable, reproducible migrations). Phase 2 must introduce `prisma migrate` with a baseline migration matching the Postgres schema.

5. **`contains` is case-insensitive in SQLite, case-sensitive in Postgres by default.** Affects the public Tools search:
   ```ts
   where.OR = [{ name: { contains: q } }, { description: { contains: q } }, { tags: { contains: q } }]
   ```
   On Postgres, searching `"chat"` will no longer match `"Chat"`. Phase 2 should switch to `mode: "insensitive"` (Prisma's Postgres `StringFilter` supports `{ contains: q, mode: "insensitive" }`). **Behavioral regression risk if missed.**

6. **No SQLite-specific Prisma functions used** (`$queryRaw`, `$executeRaw`, SQLite pragmas) — good. The whole data layer goes through the Prisma client, so a provider switch is mostly config + a migration.

7. **SQLite file-locking under concurrency** — SQLite is single-writer. On Vercel, concurrent serverless invocations against the same file would lock/fail. Already broken for production today; Postgres solves this via connection pooling.

8. **Build script does not copy `db/`** — `package.json` `build` copies only `.next/static` and `public/` into `.next/standalone/`. Even on a host with a persistent filesystem, the standalone artifact starts with no DB. Moot after Phase 2 (remote Postgres) but confirms current prod unreadiness.

9. **`cuid()` IDs** — generated client-side by Prisma, DB-agnostic. Compatible with Postgres. No transformation needed.

10. **Boolean / DateTime / nullable handling** — all standard Prisma types; behavior is identical on Postgres. No SQLite-only type coercion observed.

11. **`updatedAt @updatedAt`** — Prisma-managed; works identically on Postgres.

12. **`onDelete: SetNull` (Tool→Category, Submission→Category) and `onDelete: Cascade` (Click→Tool)** — Prisma emulates these for SQLite (no native FK enforcement) but on Postgres they become real DB-level FK actions. This is **stricter** on Postgres: deleting a Category will SQL-null the `categoryId` on its Tools/Submissions, and deleting a Tool will cascade-delete its Clicks. Behavior is equivalent; just ensure the FK columns are nullable (they are: `categoryId String?`). No data loss risk beyond the intended cascade.

---

## E. PostgreSQL/Supabase migration requirements

### Schema changes required in Phase 2
1. `datasource db { provider = "postgresql" url = env("DATABASE_URL") }`.
2. Introduce `prisma/migrations/` with a baseline migration generated from the final Postgres schema (`prisma migrate dev --name init` against a Supabase project, or `prisma migrate diff` from the SQLite schema).
3. **Case-insensitive search:** update `contains` filters in `src/app/api/tools/route.ts` (and any other `contains` usages — grep confirms only this file uses `contains`) to add `mode: "insensitive"`.
4. **Optional:** convert the string-enum columns (`Tool.status`, `Tool.pricing`, `Submission.status`) to Postgres `enum` types for stricter validation. Current code treats them as `String` with comment-documented values; both work on Postgres. Changing to enums is a schema decision — keeping `String` is lower-risk and code-compatible; enums are stricter. **Recommendation: keep `String` for Phase 2 to minimize code churn**, document as a future hardening.
5. **Optional:** drop `SiteSetting` (unused) or keep it. Keeping is harmless.
6. No JSON/array columns exist (project rule prohibits list primitives in Prisma; `tags` is a comma-separated `String`). No Postgres array/jsonb work needed.

### Connection requirements
- `DATABASE_URL` must be the Supabase **connection pooler** URL (port 6543, `?pgbouncer=true&connection_limit=1` recommended for serverless) for runtime queries, and the **direct connection** (port 5432) for Prisma migrations. Phase 2 should document both in `.env.example`.
- Prisma + Vercel serverless: must use a pooled connection and avoid exhausting the connection pool. The current `src/lib/db.ts` creates a client per invocation in production (no global cache) — this is acceptable with PgBouncer in `transaction` mode, but **the `log: ['query']` option should be removed in production** (perf + noise).
- Consider `@prisma/adapter-pg` / Prisma Accelerate if connection limits become an issue; not required for MVP.

### Data to migrate
- **Must migrate:** `Category` (10 rows), `Tool` (21 rows), `Article` (3 rows), `AdSlot` (1 row), `AdminUser` (1 row — the seeded admin), and any production-grown `Submission`, `Click`, `Contact` rows.
- **ID compatibility:** `cuid()` strings are portable; keep IDs unchanged so foreign keys (`categoryId`, `toolId`) remain valid. No ID transformation needed.
- **Timestamps:** stored as ISO strings in SQLite, mapped to `timestamp` in Postgres. Prisma handles the conversion; verify `createdAt`/`updatedAt` values survive a `prisma db seed` or a SQL export/import.
- **Booleans:** `Article.published`, `AdSlot.isActive` — straightforward.
- **Text/HTML:** `Article.content`, `AdSlot.code` — large text; ensure Postgres column type is `text` (unbounded), not `varchar`. Prisma `String` → Postgres `text` by default. OK.

### Migration method (recommended for Phase 2)
1. Provision Supabase Postgres project.
2. Switch `provider` to `postgresql`, set `DATABASE_URL` (direct, port 5432) for migrations.
3. `prisma migrate dev --name init` to create the baseline schema.
4. Export SQLite data (`sqlite3 db/custom.db .dump` or a Prisma script that reads all rows and writes to Postgres via a second PrismaClient) and import into Postgres, preserving IDs and timestamps.
5. Re-run `prisma/seed.ts` idempotently (it uses `findUnique` + `create`/`upsert` guards) to backfill any missing demo data — but **do not run the seed in production after real data exists**; seed is for empty-DB bootstrap only.
6. Set the runtime `DATABASE_URL` to the pooler URL.

---

## F. Data migration mapping (SQLite → PostgreSQL/Supabase)

| SQLite model | Postgres table | Preserve data? | Transformations | Notes |
|---|---|---|---|---|
| `Tool` | `Tool` | **Yes** (core content) | none (IDs/timestamps/bools portable) | `categoryId` nullable → FK `ON DELETE SET NULL`; `clicksCount` int; `status`/`pricing` as `text` |
| `Category` | `Category` | **Yes** | none | `slug` unique; keep 10 rows |
| `Article` | `Article` | **Yes** | none | `content`/`excerpt` → `text`; `published` bool; `coverImage` nullable |
| `Submission` | `Submission` | Pending yes; approved optional | none | `categoryId` nullable → FK `ON DELETE SET NULL`; `status` text; contains visitor PII (`submitterEmail`) |
| `AdSlot` | `AdSlot` | **Yes** (monetization) | none | `code` → `text` (HTML/JS); `isActive` bool; `position` indexed |
| `Click` | `Click` | Best-effort (analytics) | none | High volume; `toolId` FK `ON DELETE CASCADE`; `createdAt` indexed. Consider archiving old clicks |
| `Contact` | `Contact` | **Yes** (visitor PII) | none | No `updatedAt`; no indexes; `email`/`message` text |
| `AdminUser` | `AdminUser` | **Yes** (critical) | none — keep `passwordHash` bcrypt hash as-is | `email` unique. **Must have ≥1 row or no one can log in.** Re-hash not needed (bcrypt is portable) |
| `SiteSetting` | `SiteSetting` | No (unused) | none / drop | Zero usages in `src/` |

**ID compatibility:** all IDs are `cuid()` strings; preserve verbatim so FKs (`categoryId`, `toolId`) and slug uniqueness remain valid across the migration.

**Unique constraints to recreate on Postgres:** `Tool.slug`, `Category.slug`, `Article.slug`, `AdminUser.email`, `SiteSetting.key`.

**Indexes to recreate:** `Tool(categoryId)`, `Tool(status)`, `Submission(status)`, `AdSlot(position)`, `Click(toolId)`, `Click(createdAt)` — Prisma migration will create these.

---

## G. Authentication audit

### Current state (post prior security fixes — verified intact)
- **`AdminUser` model:** `email @unique`, `passwordHash` (bcrypt cost 10), `name`, timestamps. Stored in DB. ✓
- **Password hashing:** `bcryptjs` `hash(pw, 10)` / `bcrypt.compare`. Portable to Postgres (hash is a string). No re-hash needed on migration. ✓
- **JWT session:** `src/lib/auth.ts` signs/verifies with `JWT_SECRET`.
  - **Production fail-safe:** `getJwtSecretForSigning()` **throws** if `JWT_SECRET` missing/`<16` chars in production (never issues a token with a known secret). `getJwtSecretForVerifying()` **returns null** in production if secret unset (never trusts a token → redirect to login). ✓ No hardcoded production secret.
  - Dev-only `DEV_JWT_SECRET` is gated by `NODE_ENV !== "production"` and cannot become the production credential. ✓
- **Cookie:** `httpOnly`, `sameSite: "lax"`, `secure` in production, `path: "/"`, 7-day expiry. ✓
- **Server-side admin gate:** `src/proxy.ts` (Next.js 16 "proxy" convention) verifies the JWT cookie for `/admin/:path*` and redirects unauthenticated requests to `/admin/login` **before** any admin content renders. The login page is allowed through. ✓ Verified: `curl /admin` (no cookie) → 307 to `/admin/login`; authenticated → 200.
- **Admin API guard:** `src/lib/api-guard.ts` `adminGuard()` returns 401 on missing session. Used by all admin write routes and the `?admin=1` articles branch. ✓ Verified: `GET /api/articles?admin=1` (no cookie) → 401.
- **Default admin creation:** `ensureDefaultAdmin()` is **dev-only** (`if (IS_PRODUCTION) return;`). In production it is a no-op. The `admin@aivora.dev`/`admin123` fallbacks can only execute in development. ✓ No hardcoded production admin.

### Empty production database behavior
- **This is the key risk for Phase 2.** On a fresh Supabase Postgres DB after migration:
  - `prisma migrate deploy` creates the schema (empty tables).
  - **There is no automatic admin creation** (`ensureDefaultAdmin` is a no-op in production and is never called at boot anyway — grep confirms zero call sites).
  - **There will be no `AdminUser` row** → no one can log in → admin panel is inaccessible.
  - **Mitigation (for Phase 2 to implement):** create the initial production admin via a one-time, trusted-environment script (e.g., a `prisma/seed.ts` variant or a dedicated `scripts/create-admin.ts`) that runs **once** against the production DB using operator-provided `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, then is disabled. Alternatively, document a manual SQL insert with a pre-computed bcrypt hash. **The current `prisma/seed.ts` hardcodes `admin@aivora.dev`/`admin123` — it must NOT be run against production as-is.** Phase 2 must make the seed admin-credential-aware (read from env, skip if unset) or split into a separate non-default script.

### Prior security issues — status
| Prior issue | Status |
|---|---|
| Client-only admin protection | **Fixed** — `src/proxy.ts` server-side gate. ✓ |
| Admin draft article exposure (`?admin=1`) | **Fixed** — `adminGuard()` on the branch. ✓ |
| Hardcoded production JWT secret | **Fixed** — fail-safe, no prod fallback. ✓ |
| Default production admin credentials | **Fixed** — `ensureDefaultAdmin` no-ops in production. ✓ |
| `db/custom.db` committed with admin hash | **Open** — pre-existing; out of scope for this audit (Phase 2 should untrack after data migration). |

---

## H. Vercel deployment risks

1. **No remote DB today** — the app cannot run on Vercel as-is; the SQLite file path doesn't exist on serverless. Phase 2 (Postgres/Supabase) resolves this.
2. **`output: "standalone"`** — correct for Vercel; will work once `DATABASE_URL` points to Supabase.
3. **`typescript.ignoreBuildErrors: true`** — hides 16 real TS errors (see §I). The build will *pass* but type regressions ship undetected. Not blocking for migration but should be removed in a later cleanup phase after the TS errors are fixed.
4. **`package.json` build script** — fine for Vercel (Vercel runs `next build` natively; the `cp` steps are for self-hosted standalone and are harmless on Vercel). The missing `db/` copy is moot post-migration.
5. **Connection pooling** — Vercel serverless + Postgres requires PgBouncer (Supabase pooler, port 6543) and `connection_limit=1` per client. The current `src/lib/db.ts` creates a client per invocation in production — acceptable with pooling, but **`log: ['query']` must be disabled in production** (it logs every query to stdout — noise + cost on serverless).
6. **No `postbuild`/`prisma generate` step** — Vercel auto-runs `prisma generate` via `postinstall`? Not configured. `@prisma/client` is generated at install time (via `postinstall` hook Prisma ships), so the generated client is present in the build. Verify the Vercel build installs deps (it does by default). **Risk:** if the Prisma engine binary for the target runtime isn't matched, queries fail. Prisma 6 + Node 20 on Vercel is supported; ensure `engines.node` is not pinned incorrectly.
7. **Migrations on Vercel** — `prisma migrate deploy` must run as a build step or a one-time job, **not** per-request. Phase 2 should add a `postinstall`/build script `prisma generate && prisma migrate deploy` (using the direct DB URL, not the pooler, for migrations) or run migrations via Supabase's CI integration.
8. **Environment variables** — `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` must all be set in Vercel project env. Currently only `DATABASE_URL` is defined in `.env`; the others fall back to dev-only/insecure behavior. **Phase 2 must define and document all five** (plus a `DIRECT_URL` for migrations if using the pooler for runtime).

---

## I. TypeScript / build errors

### `npx tsc --noEmit` results (current)
- **16 errors in `src/`**:
  - `src/app/admin/tools/tool-form.tsx` — **11 errors** (TS2322): react-hook-form `Resolver`/`Control` type mismatches. The `zodResolver` is typed for a schema where `tags` is optional, but `useForm` is typed for a schema where `tags` is required. Cascades into every `Controller`/`useWatch`/`onSubmit` binding.
  - `src/components/tools-list-view.tsx` — **5 errors** (TS2322): `Type 'number' is not assignable to type 'string'` — pagination `page` (number) passed where a string is expected (in `buildUrl`/`buildApiUrl`/`PaginationLink` href constructions).
- **4 errors outside `src/`** (examples/skills — NOT part of the app):
  - `examples/websocket/frontend.tsx`, `examples/websocket/server.ts` — missing `socket.io`/`socket.io-client` modules (examples, not deps).
  - `skills/image-edit/scripts/image-edit.ts`, `skills/stock-analysis-skill/src/analyzer.ts` — SDK type mismatches in skill demos.
  - These are **excluded from the Next build** (eslint `ignores: ["examples/**", "skills"]`); they don't affect runtime or deployment.

### ESLint
- `bun run lint` → **0 errors / 0 warnings**.

### `typescript.ignoreBuildErrors: true`
- `next.config.ts` sets this. **The production `next build` will succeed despite the 16 TS errors.** This masks real type bugs; the app runs because the runtime behavior is correct (the form still submits, pagination still works), but the type system can't catch regressions.

### Classification
- **A) Blocking for migration:** none. The 16 `src/` TS errors are pre-existing and don't affect the DB layer. Migration does not depend on fixing them.
- **B) Non-blocking but should fix:** the 16 `src/` errors (admin tool-form resolver typing + tools-list-view pagination string typing). Fix after migration to re-enable the type-check gate. Also: remove `typescript.ignoreBuildErrors: true` and the `log: ['query']` in `db.ts` (production perf/noise).
- **C) Unrelated examples/skills errors:** the 4 `examples/`/`skills/` errors. Not part of the app. No action needed for migration.

---

## J. Exact files that must change in Phase 2

> Phase 2 implements the migration. These are the precise files that must change. **Do not change anything beyond this list without justification.**

1. **`prisma/schema.prisma`** — change `provider = "sqlite"` → `provider = "postgresql"`. (No other schema changes required; keep all models/fields/relations/indexes identical. Optionally drop `SiteSetting`.)
2. **`.env`** (and create **`.env.example`**) — replace `DATABASE_URL` with the Supabase **pooler** URL; add `DIRECT_URL` (Supabase direct, port 5432) for migrations; add `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`. `.env.example` must document all five+two with placeholders.
3. **`package.json`** — add a `db:migrate:deploy` script (`prisma migrate deploy`) and a `postinstall` or build step `prisma generate` (and optionally `prisma migrate deploy` for the build). The `build` script's `cp` steps can stay (harmless on Vercel).
4. **`prisma/migrations/`** (new directory) — generate baseline migration with `prisma migrate dev --name init` against the Supabase project (using `DIRECT_URL`). Commit the migrations folder.
5. **`src/app/api/tools/route.ts`** — change the three `contains: q` filters to `{ contains: q, mode: "insensitive" }` for Postgres case-insensitive search (preserves current SQLite behavior).
6. **`prisma/seed.ts`** — make admin creation env-driven and production-safe: read `ADMIN_EMAIL`/`ADMIN_PASSWORD` from env; **skip admin creation (or skip the whole seed) if unset**; never default to `admin@aivora.dev`/`admin123` when `NODE_ENV === "production"`. (Or split into a separate `scripts/create-admin.ts`.)
7. **`src/lib/db.ts`** — remove `log: ['query']` (or gate it behind `NODE_ENV !== "production"`); optionally cache the client on `globalThis` in production too if connection limits allow (otherwise leave as-is for pooled serverless).
8. **`next.config.ts`** — (optional, recommended) remove `typescript.ignoreBuildErrors: true` **after** the 16 TS errors in §I-B are fixed. Not strictly required for migration.
9. **`.gitignore`** — untrack `db/custom.db` (after data migration is verified). The `db/` folder can remain for local dev but should not be committed.

### Files that must NOT change (Phase 2)
- All `src/app/(site)/**` public pages and `src/app/admin/**` admin pages (UI frozen).
- `src/components/**` (UI frozen), including `tool-logo.tsx`, `tool-card.tsx`, `tools-list-view.tsx` (UI logic), `ad-slot.tsx`, `remote-image.tsx`, `site-header.tsx`, `site-footer.tsx`.
- `src/lib/auth.ts`, `src/lib/api-guard.ts`, `src/proxy.ts` (auth security behavior frozen — verified correct in §G).
- `src/app/api/**` route handlers **except** the single `contains` change in `tools/route.ts` (J.5) and any migration-script wiring. Auth/admin guards must remain identical.
- `src/app/sitemap.ts`, `src/app/robots.ts` (SEO).
- `globals.css`, `layout.tsx`, all styling, fonts, colors, typography.
- `tailwind.config.ts`, `postcss.config.mjs`, `components.json`.
- `Caddyfile` (gateway config).
- `next.config.ts` `output: "standalone"` (keep; only `ignoreBuildErrors` is a candidate for removal, and only after TS errors are fixed).
- The `AdminUser` model and password hashing (bcrypt) — unchanged.
- All public routes (`/`, `/tools`, `/tools/[slug]`, `/categories`, `/category/[slug]`, `/top-tools`, `/blog`, `/blog/[slug]`, `/submit`, `/contact`, `/privacy`, `/terms`, `/sitemap.xml`, `/robots.txt`).

---

## K. Files that MUST NOT be changed

(Explicit list — redundancy for safety, per the brief's requirement.)

- **Frontend (frozen design):** `src/app/(site)/page.tsx`, `src/app/(site)/tools/**`, `src/app/(site)/category/**`, `src/app/(site)/top-tools/page.tsx`, `src/app/(site)/blog/**`, `src/app/(site)/submit/**`, `src/app/(site)/contact/**`, `src/app/(site)/privacy/**`, `src/app/(site)/terms/**`, `src/app/(site)/categories/**`, `src/app/not-found.tsx`, `src/app/layout.tsx`, `src/app/globals.css`.
- **Components:** everything under `src/components/` and `src/components/ui/`.
- **Auth/security:** `src/lib/auth.ts`, `src/lib/api-guard.ts`, `src/proxy.ts`, `src/app/admin/layout.tsx`, `src/components/admin/admin-layout-inner.tsx`.
- **Admin UI:** everything under `src/app/admin/**` (pages only — DB-backed data will change underneath, but the UI files are frozen).
- **API behavior:** all `src/app/api/**` except the documented `contains` edit in `tools/route.ts`.
- **Styling/build config:** `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `tsconfig.json`, `eslint.config.mjs`.
- **Gateway:** `Caddyfile`.
- **Existing data:** do not delete or modify `db/custom.db` until Phase 2 migration is verified (then untrack, don't delete the file itself unless required).
- **Supabase:** do not modify any existing Supabase project; Phase 2 provisions/configures per this audit.

---

## L. Recommended migration order (Phase 2)

1. **Provision Supabase Postgres** project; note the pooler URL (6543) and direct URL (5432); set a strong DB password.
2. **Create `.env.example`** documenting: `DATABASE_URL` (pooler), `DIRECT_URL` (direct), `JWT_SECRET` (≥16 chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`. Update local `.env` to the pooler URL + direct URL (dev can use direct).
3. **Switch `prisma/schema.prisma`** `provider` to `"postgresql"`. No other schema changes.
4. **Generate baseline migration:** `prisma migrate dev --name init` against the Supabase project (uses `DIRECT_URL`). Commit `prisma/migrations/`.
5. **Migrate data** from SQLite → Postgres: write a one-time script that reads all rows from the SQLite `db/custom.db` (via a second `PrismaClient` pointed at a SQLite `DATABASE_URL`) and writes them to Postgres, preserving IDs, timestamps, FKs, and the `AdminUser.passwordHash`. Verify row counts match per table.
6. **Update `src/app/api/tools/route.ts`** `contains` → `mode: "insensitive"` (preserves case-insensitive search).
7. **Update `prisma/seed.ts`** to be env-driven and production-safe (no hardcoded prod admin; skip if `ADMIN_EMAIL`/`ADMIN_PASSWORD` unset in production). Or create `scripts/create-admin.ts`.
8. **Update `src/lib/db.ts`** — drop/gate `log: ['query']`.
9. **Update `package.json`** — add `db:migrate:deploy` (`prisma migrate deploy`) and ensure `prisma generate` runs at build (postinstall or in the `build` script).
10. **Provision the production admin** — run the admin-creation script once against the Supabase DB with operator-provided credentials (or insert a pre-computed bcrypt hash via SQL). Verify login works.
11. **Deploy to Vercel** with all env vars set; verify: home renders, tools list/search works (case-insensitive), tool detail + click tracking works, admin login + dashboard + CRUD works, submit→approve pipeline works, blog renders, sitemap/robots valid.
12. **Untrack `db/custom.db`** from git (after verifying the production app no longer references it). Keep the file locally for dev.
13. **(Optional, later)** remove `typescript.ignoreBuildErrors: true` and fix the 16 TS errors (admin tool-form resolver types + tools-list-view pagination) to restore the type gate.

---

## M. Risks and rollback strategy

### Risks
1. **Case-sensitive search regression** — if `mode: "insensitive"` is missed (J.5), public search behavior changes (lowercase queries stop matching capitalized data). **Mitigation:** required step L.6; add a search test before cutover.
2. **No admin on fresh prod DB** — if the admin-provisioning step (L.10) is skipped, the admin panel is locked out. **Mitigation:** documented as a required step; verify login before declaring the deploy done.
3. **`$transaction` on pooled connections** — the click-tracking transaction (`$transaction([create, update])`) requires a session that holds a connection. PgBouncer in `transaction` mode supports this, but `session`-level features don't. Supabase's default pooler is `transaction` mode — the batched `$transaction` (array form) is supported. **Mitigation:** verify click tracking works post-migration; if issues, switch the click write to two sequential calls or a `$transaction(async fn)` with `interactive` (needs `session` mode — Supabase session pooler port 5432 + `?pgbouncer=false`).
4. **Submission approval is not transactional** — `approve` does `tool.create` then `submission.update` as separate ops; a failure between leaves an approved tool + a still-`pending` submission. Pre-existing; Phase 2 should **not** change behavior, but consider wrapping in a `$transaction` in a later hardening phase.
5. **Data loss during cutover** — if production has live `Click`/`Contact`/`Submission` rows at migration time, a one-time copy will miss rows written during the window. **Mitigation:** for the first production deploy (currently demo data only) this is low-risk; for a later real-data migration, use a brief maintenance window or dual-write. Out of scope for this first Phase 2.
6. **`db/custom.db` still committed** — until L.12, the repo still ships the seeded admin hash. Low risk (bcrypt + the secret is dev-only and `ensureDefaultAdmin` no-ops in prod), but should be untracked.
7. **Prisma engine / Vercel runtime mismatch** — if the generated Prisma client's engine doesn't match the Vercel Node runtime, queries fail at runtime. **Mitigation:** use Prisma 6 (current), ensure Node 20 on Vercel; `prisma generate` runs at build.
8. **Connection pool exhaustion** — serverless bursts can open many Postgres connections. **Mitigation:** use the Supabase pooler (6543) with `connection_limit=1`; the current per-invocation client pattern is fine with pooling.
9. **Migration history drift** — `prisma db push` (current) leaves no history; after introducing `migrate`, future schema changes must go through `migrate`. **Mitigation:** document the new workflow; remove `db:push` from CI/production scripts.
10. **`SiteSetting` dead model** — harmless but adds a table. Optional to drop.

### Rollback strategy
- **Pre-cutover:** keep `db/custom.db` and the SQLite `DATABASE_URL` working in a branch; the migration is reversible by reverting `prisma/schema.prisma`, `.env`, `tools/route.ts`, `seed.ts`, `db.ts`, `package.json`.
- **Post-cutover (data already copied):** if the Postgres deploy fails, repoint `DATABASE_URL` back to a local SQLite instance (the `db/custom.db` file is still present and untracked-deletion is step L.12, after verification). **Caveat:** any new writes to Postgres after cutover are not back-propagated to SQLite — for the first deploy (demo data) this is acceptable; for a real-data deploy, do a read-only verification window before flipping traffic.
- **Migration reversibility:** because the schema is provider-agnostic (no SQLite-specific types/functions) and IDs are portable `cuid()` strings, the data can be re-exported from Postgres back to SQLite if ever needed. The migration is not destructive to the source until `db/custom.db` is untracked (L.12, post-verification).
- **Admin lockout recovery:** if the production admin is mis-provisioned, a backup admin can be created via direct SQL `INSERT INTO "AdminUser" (...)` with a freshly-computed bcrypt hash, bypassing the app.

---

## N. Verification of this audit phase

- **Files changed by this audit:** exactly one — `docs/PRODUCTION_MIGRATION_AUDIT.md` (this file). Confirmed via `git status`.
- **`npx tsc --noEmit`:** 16 errors in `src/` (11 in `src/app/admin/tools/tool-form.tsx`, 5 in `src/components/tools-list-view.tsx`) + 4 in `examples/`/`skills/` (unrelated). Detailed in §I. **Not fixed** — diagnostic only.
- **`bun run lint`:** **0 errors / 0 warnings**.
- **Database not modified; Supabase not modified; frontend not modified; auth not modified.**

---

## O. Recommendation

**READY FOR PHASE 2.**

The architecture is sufficiently understood:
- 9 Prisma models fully inventoried with fields, types, relations, indexes, cascade behavior, and usage.
- All 32 files that touch the DB are mapped; every DB operation is catalogued (one `$transaction`, zero raw SQL).
- The only SQLite-specific code assumption that affects behavior is the case-insensitive `contains` in `tools/route.ts` (must become `mode: "insensitive"` on Postgres).
- The data migration is a straight 1:1 table copy with portable `cuid()` IDs, no type coercions, no raw SQL, no SQLite-only functions.
- Auth is production-safe (verified: server-side gate, fail-safe JWT secret, no prod default admin); the sole operational gap is provisioning the first production admin, which is a documented Phase 2 step (L.10), not a code risk.
- The exact file change set (J) and do-not-change set (K) are enumerated; the migration order (L) and rollback (M) are defined.

**Phase 2 must NOT start automatically.** It should begin only after this report is reviewed and the Supabase project is provisioned. Phase 2 is a code+config change phase, not a diagnostic phase.
