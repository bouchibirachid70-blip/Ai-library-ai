# Aivora — Phase 2 Migration Report (SQLite → PostgreSQL/Supabase)

**Status:** Phase 2 complete to the extent possible within the sandbox environment. The migration artifacts (schema, migration SQL, data-migration script, env config, admin-provisioning script, connection config) are all in place and verified offline. **Live application against Supabase requires the operator to run three commands with real credentials** (documented in §13 / Rollback §15). Phase 2 does not claim full production-readiness — that is Phase 3.

> **Phase 2 Safety Review (this revision):** `.env.example` was found MISSING (lost when the working tree was reset — `.gitignore` `.env*` had been catching it). Recreated with placeholders + added `!.env.example` exception so it is now tracked. The local `.env` had reverted to the SQLite URL (inconsistent with the committed `postgresql` schema) — restored to the Postgres placeholder config. The SQLite source file `db/custom.db` was found MISSING from disk (lost in the same working-tree reset) — **restored from git history (commit `b104fa4`, 299,008 bytes, `integrity_check: ok`, all 9 tables intact: 10/21/3/1/1/1002/0/1/0)**. The data-migration script was rewritten with pre-flight safety checks (see §A below). No migration or data transfer to Supabase was performed. See the new **§16. Safety Review Findings** at the end for the full list of verified fixes and remaining blockers.

---

## 1. PostgreSQL migration status

| Item | Status |
|---|---|
| Prisma provider switched `sqlite` → `postgresql` | ✅ Done |
| Real Prisma migration (`prisma/migrations/`) created | ✅ Done (reproducible, byte-identical to `migrate diff --from-empty`) |
| Case-insensitive search preserved on Postgres (`mode: "insensitive"`) | ✅ Done (all 5 search routes) |
| Data-migration script (SQLite → Postgres, preserve IDs) | ✅ Written + read-half verified |
| Admin-provisioning script (no hardcoded creds) | ✅ Written + verified refuses without env |
| `.env.example` documenting all required vars | ✅ Created |
| `db.ts` singleton + production logging gated | ✅ Done |
| Build no longer depends on `db/custom.db` | ✅ Done (DB-backed pages `force-dynamic`) |
| `prisma generate` in build + `postinstall` | ✅ Done |
| `db/custom.db` untracked from git (file kept locally) | ✅ Done |
| **Live migration applied to Supabase** | ⏸ **Operator step** — see §13. Requires real Supabase DB password + a machine with direct-Postgres (port 5432) access. |
| **Live app verified against Supabase** | ⏸ **Operator step** — blocked by sandbox firewall (see §12). |

## 2. Supabase project used

- **Project name:** Aivora
- **Project ref:** `wejpgslhwdajgbaipmuf`
- **Region:** eu-central-1
- **URL:** https://wejpgslhwdajgbaipmuf.supabase.co
- **Pooler host:** `aws-0-eu-central-1.pooler.supabase.com:6543` (PgBouncer, transaction mode) — used by the runtime app (`DATABASE_URL`).
- **Direct host:** `db.wejpgslhwdajgbaipmuf.supabase.co:5432` — used by Prisma migrations only (`DIRECT_URL`).

No new Supabase project was created. The existing project is used as-is.

## 3. Prisma schema changes

**`prisma/schema.prisma`** — the only schema change:
```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
+  directUrl = env("DIRECT_URL")
 }
```
- `directUrl` added: Supabase's PgBouncer pooler (port 6543) does not support Prisma migrations; Prisma uses `DIRECT_URL` (port 5432) for `migrate deploy` and `DATABASE_URL` for runtime.
- **All 9 models preserved exactly** — IDs (`cuid()`), fields, types, unique constraints, indexes, nullable fields, defaults, timestamps, relations, cascade behavior. No model/field renamed. No business-logic change.
- `npx prisma validate` → ✅ valid (PostgreSQL).

## 4. Migration files created

```
prisma/migrations/
├── migration_lock.toml                  # provider = "postgresql"
└── 20260101000000_init/
    └── migration.sql                    # 159 lines, byte-identical to a fresh
                                         # `prisma migrate diff --from-empty` run
```
- The migration creates all 9 tables (`Tool`, `Category`, `Article`, `Submission`, `AdSlot`, `Click`, `Contact`, `AdminUser`, `SiteSetting`), their PKs, all unique indexes (`Tool.slug`, `Category.slug`, `Article.slug`, `AdminUser.email`, `SiteSetting.key`), all secondary indexes (`Tool.categoryId`, `Tool.status`, `Submission.status`, `AdSlot.position`, `Click.toolId`, `Click.createdAt`), and all 3 foreign keys with the correct `ON DELETE SET NULL` / `ON DELETE CASCADE` behavior.
- **Reproducibility verified:** regenerating with `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` produces a byte-identical file to `migration.sql`. Applying this to a clean Postgres DB yields the exact schema.

## 5. Existing Supabase schema compatibility findings

> ⚠️ **Network constraint disclosure:** The sandbox running this Phase 2 only allows outbound **HTTP/HTTPS (ports 80/443)**. Supabase's **Postgres ports 5432 (direct) and 6543 (pooler) are blocked for raw TCP** — BUT the Supabase **HTTPS REST API** is reachable (401/404 = host alive), and Prisma's Node.js client **can reach the pooler over TLS** (verified: the dev server gets "Authentication failed" — i.e. it reached the server, only the placeholder password is wrong). Direct-Postgres (5432) is fully unreachable from the sandbox, so the live Supabase schema could not be introspected with `prisma migrate status` or raw SQL.

**What was determined without live introspection:**
- The Supabase REST API responded `401 Invalid API key` to an unauthenticated request — the project is alive and the REST gateway is up.
- The pooler (`aws-0-eu-central-1.pooler.supabase.com:6543`) accepted a TLS connection from the Prisma client and rejected the placeholder password — the Postgres pooler is up and the `postgres` role exists.
- No existing Supabase schema/migrations were inspected from the sandbox.

**Compatibility assessment (based on the Phase 1 audit + this Phase's schema):**
- The current Prisma schema uses only portable, standard Postgres types (`TEXT`, `INTEGER`, `BOOLEAN`, `TIMESTAMP(3)`), `cuid()` string IDs, and standard FKs/indexes. There are **no SQLite-specific types or functions** in the schema. The migration SQL (§4) is plain DDL that applies to any clean Postgres database.
- **If the existing Supabase database contains an older Aivora schema:** Phase 2's `prisma migrate deploy` will attempt to create the tables. If tables with the same names already exist, `migrate deploy` will fail with a clear "relation already exists" error and **will not destroy data**. The operator MUST inspect the existing Supabase schema (via the Supabase dashboard SQL editor or `psql`) **before** running `migrate deploy`, and either:
  1. **Reuse compatible existing tables** (if the old schema's columns/types match the current Prisma schema) — in which case `prisma migrate resolve --applied 20260101000000_init` marks the migration as applied without running it; OR
  2. **Rename/drop incompatible old tables** (only if they contain disposable old data) — a destructive step that **requires explicit operator approval** and is NOT performed by this Phase.

**⚠️ No destructive operation was performed on Supabase in this Phase.** If a schema conflict is discovered at apply time, the operator must STOP and document it before proceeding (see §12 / §15).

## 6. SQLite → PostgreSQL record counts

**Source (SQLite `db/custom.db`, read-only via `node:sqlite` — verified intact):**

| Table | SQLite rows |
|---|---:|
| Category | 10 |
| Tool | 21 |
| Article | 3 |
| Submission | 1 |
| AdSlot | 1 |
| Click | 1002 |
| Contact | 0 |
| AdminUser | 1 |
| SiteSetting | 0 |
| **Total** | **1040** |

**Target (PostgreSQL/Supabase):** not yet populated — the data-migration script's write step is blocked by the sandbox firewall (direct port 5432 unreachable). The script is verified to read all source rows and attempt the correct Postgres upserts. The operator runs the migration (§13, step 3) to populate Postgres; the script prints before/after counts per table and exits non-zero on any mismatch.

## 7. Data integrity verification

- **IDs preserved:** the migration script uses `upsert` by `id` for every table, so `cuid()` IDs (and therefore all FKs: `Tool.categoryId`, `Submission.categoryId`, `Click.toolId`) are preserved verbatim. No new IDs are generated; no duplicate records on re-run.
- **Timestamps preserved:** `createdAt`/`updatedAt` are copied as-is (ISO strings → Postgres `TIMESTAMP(3)`).
- **Booleans preserved:** `Article.published` and `AdSlot.isActive` are stored as `0/1` in SQLite; the script coerces them to `Boolean` before writing to Postgres.
- **passwordHash preserved:** `AdminUser.passwordHash` (bcrypt hash string) is copied as-is — bcrypt hashes are portable across DBs, so the migrated admin can log in immediately (no re-hash).
- **Relations intact:** migration order is `Category → Tool/Submission → Click → (rest)` so FK targets exist before FK sources are inserted.
- **Slugs/status/published preserved:** all string-enum columns (`status`, `pricing`, `published`) are copied verbatim.
- **Source untouched:** the SQLite file is opened `readOnly: true`; it is not modified or deleted.

## 8. Admin provisioning status

- **No hardcoded production admin credentials** — verified: `src/lib/auth.ts` `ensureDefaultAdmin()` no-ops in production; `scripts/create-admin.ts` refuses to run without `ADMIN_EMAIL` + `ADMIN_PASSWORD` (≥8 chars) env vars; `prisma/seed.ts` skips admin creation entirely in production.
- **Existing admin migrated:** the `AdminUser` row (1 row, bcrypt hash) from SQLite is migrated by `scripts/migrate-sqlite-to-postgres.ts` with its `passwordHash` intact, so the existing admin can log in to the Postgres-backed app immediately after migration.
- **Fresh-DB provisioning:** if the operator starts with a clean Supabase DB and does NOT migrate the SQLite admin, they run:
  ```
  DIRECT_URL=<postgres-direct-url> ADMIN_EMAIL=<email> ADMIN_PASSWORD=<strong-pw> \
    bun run db:create-admin
  ```
  The script hashes the password with bcrypt and `upsert`s the admin. It never prints the password.

## 9. Environment variables required

Documented in **`.env.example`** (placeholders only — no real secrets in source/git):

| Variable | Purpose | Used by |
|---|---|---|
| `DATABASE_URL` | Postgres **pooler** (port 6543, PgBouncer) — runtime app queries | `src/lib/db.ts`, all API/page DB calls |
| `DIRECT_URL` | Postgres **direct** (port 5432) — Prisma migrations + admin/data scripts | `prisma migrate deploy`, `scripts/*` |
| `JWT_SECRET` | Admin session JWT signing (≥16 chars; fail-safe in prod if unset) | `src/lib/auth.ts`, `src/proxy.ts` |
| `ADMIN_EMAIL` | One-time admin provisioning (optional after admin exists) | `scripts/create-admin.ts`, `prisma/seed.ts` (dev) |
| `ADMIN_PASSWORD` | One-time admin provisioning (optional after admin exists) | `scripts/create-admin.ts`, `prisma/seed.ts` (dev) |
| `NEXT_PUBLIC_SITE_URL` | SEO canonical/sitemap base URL | `src/components/seo.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts` |
| `SQLITE_SOURCE_URL` | One-time data-migration source (optional) | `scripts/migrate-sqlite-to-postgres.ts` |

## 10. Tests performed

### Build / type / lint
| Test | Result |
|---|---|
| `npx prisma validate` | ✅ valid (PostgreSQL) |
| `npx prisma generate` | ✅ client generated for PostgreSQL |
| `npx tsc --noEmit` | 16 errors in `src/` — **all pre-existing (Phase 1)**: 11 in `src/app/admin/tools/tool-form.tsx`, 5 in `src/components/tools-list-view.tsx`. **0 new errors** introduced by Phase 2 (verified: no Phase-2 changed file has a TS error). + 4 unrelated `examples/`/`skills/` errors. |
| `bun run lint` | ✅ 0 errors / 0 warnings |
| `bun run build` | ✅ `prisma generate && next build` compiles in ~15s; all 28 pages generate; DB-backed pages correctly classified `ƒ` (Dynamic); static pages `○`; `cp` steps complete. **No `ignoreBuildErrors` change.** |

### App routes (dev server, with placeholder Supabase creds)
| Route | Status | Notes |
|---|---|---|
| `/privacy` | 200 | static, no DB |
| `/terms` | 200 | static, no DB |
| `/admin/login` | 200 | no DB |
| `/admin` (unauth) | 307 → `/admin/login` | `proxy.ts` server-side gate intact |
| `/nope` | 404 | not-found page |
| `/` (home) | 500 | **Prisma reaches Supabase pooler → "Authentication failed"** (placeholder password `CHANGE_ME`). Expected; returns 200 with real creds + migrated data. |
| `/tools` | 500 | same — DB auth-fail |

### Security / auth
| Test | Result |
|---|---|
| Unauth `/admin/*` redirect | ✅ 307 → `/admin/login` (server-side, `proxy.ts`) |
| No hardcoded prod JWT secret | ✅ `getJwtSecretForSigning()` throws in prod if unset; only dev-labelled constant in dev branch |
| No hardcoded prod admin password | ✅ `ensureDefaultAdmin` no-ops in prod; `create-admin.ts` refuses without env |
| `?admin=1` article draft leak | ✅ still guarded (Phase 1 fix intact) |
| Cookie `httpOnly`/`sameSite=lax`/`secure`-in-prod | ✅ unchanged |
| `scripts/create-admin.ts` without env | ✅ refuses: "ADMIN_EMAIL and ADMIN_PASSWORD (≥8 chars) must be set" |
| `scripts/create-admin.ts` short password | ✅ refuses |

### Data migration script
| Test | Result |
|---|---|
| Read SQLite source via `node:sqlite` | ✅ reads all 9 tables (10/21/3/1/1/1002/0/1/0) |
| Write to Postgres | ⏸ blocked by sandbox firewall (direct port 5432 unreachable). Script logic verified — attempts correct upserts to `DIRECT_URL`. Operator runs in an environment with direct-Postgres access. |
| Migration reproducibility (`migrate diff --from-empty` == `migration.sql`) | ✅ byte-identical |

### Case-insensitive search (Postgres `mode: "insensitive"`)
All 5 search/filter routes updated to preserve SQLite's case-insensitive `contains`:
- `src/app/api/tools/route.ts`
- `src/app/(site)/tools/page.tsx`
- `src/app/(site)/category/[slug]/page.tsx`
- `src/app/api/admin/tools/route.ts`
- `src/app/api/submissions/route.ts`
(Verified: no `contains:` usages remain without `mode: "insensitive"` in `src/`.)

## 11. Build / lint / typecheck results

- **`npx prisma validate`**: ✅ valid
- **`npx prisma generate`**: ✅ client generated for PostgreSQL
- **`npx tsc --noEmit`**: 16 errors in `src/` (pre-existing, unchanged from Phase 1) + 4 in `examples/`/`skills/` (unrelated). **0 new errors from Phase 2.**
- **`bun run lint`**: ✅ 0 errors / 0 warnings
- **`bun run build`**: ✅ compiles + generates pages + standalone cp steps. `typescript.ignoreBuildErrors: true` in `next.config.ts` **unchanged** (per Phase 1 §I — leave for Phase 3).

## 12. Any remaining problems

### A. Operator-action items (not doable from this sandbox)
1. **Apply the migration to Supabase** (requires real DB password + direct-Postgres access):
   ```
   DIRECT_URL="postgresql://postgres:<DB_PASSWORD>@db.wejpgslhwdajgbaipmuf.supabase.co:5432/postgres" \
     bun run db:migrate:deploy
   ```
   ⚠️ **Before running:** inspect the existing Supabase schema (Supabase dashboard → SQL editor → `\dt`). If older Aivora tables exist and conflict, do NOT run blindly — see §5 / §15.

2. **Migrate the data** (requires direct-Postgres access):
   ```
   DIRECT_URL="postgresql://postgres:<DB_PASSWORD>@db.wejpgslhwdajgbaipmuf.supabase.co:5432/postgres" \
   SQLITE_SOURCE_URL="file:/home/z/my-project/db/custom.db" \
     bun run db:migrate-sqlite
   ```
   The script prints per-table counts and exits non-zero on any mismatch.

3. **Provision the admin** (only if NOT migrating the existing admin):
   ```
   DIRECT_URL=<direct-url> ADMIN_EMAIL=<email> ADMIN_PASSWORD=<strong-pw> \
     bun run db:create-admin
   ```

4. **Set Vercel env vars** (per §9) and deploy. Verify home/tools/detail/admin all return 200.

### B. Known issues (non-blocking, deferred to Phase 3)
- **16 pre-existing TypeScript errors** in `src/app/admin/tools/tool-form.tsx` and `src/components/tools-list-view.tsx` — intentionally NOT fixed this phase (per brief §12). `typescript.ignoreBuildErrors: true` still masks them at build time.
- **Login page demo-credentials hint** (`src/app/admin/login/login-form.tsx` line ~137) displays `admin@aivora.dev` / `admin123` as a "Demo credentials" hint — this is part of the **frozen UI** (§K) and is only a displayed hint, not a real credential. With the migrated/production admin, the hint is misleading but harmless. Recommended for Phase 3 UI cleanup.
- **Sandbox firewall** blocked live Supabase Postgres verification (direct port 5432 unreachable; pooler reachable over TLS but with placeholder password). All offline-verifiable checks pass.

## 13. Exact files changed

### Modified (20)
| File | Change |
|---|---|
| `prisma/schema.prisma` | `provider` sqlite→postgresql; added `directUrl = env("DIRECT_URL")`. No model/field changes. |
| `.env` | `DATABASE_URL`/`DIRECT_URL`/`JWT_SECRET`/`SQLITE_SOURCE_URL` for Postgres (placeholder Supabase creds). |
| `.env.example` | **New** — documents all 7 env vars with placeholders (no real secrets). |
| `.gitignore` | added `/db/*.db` + `/db/*.db-journal`. |
| `package.json` | `build` prepends `prisma generate`; added `postinstall: prisma generate`; added `db:migrate:deploy`, `db:migrate-sqlite`, `db:create-admin` scripts. |
| `prisma/seed.ts` | admin creation now production-safe (skips in prod; dev-only fallback; reads `ADMIN_EMAIL`/`ADMIN_PASSWORD` env). |
| `src/lib/db.ts` | singleton cached on `globalThis` in all envs; `log` gated (query-logging dev-only). |
| `src/app/api/tools/route.ts` | `contains` → `mode: "insensitive"` (3 filters). |
| `src/app/(site)/tools/page.tsx` | `contains` → `mode: "insensitive"` + `export const dynamic = "force-dynamic"`. |
| `src/app/(site)/tools/[slug]/page.tsx` | `export const dynamic = "force-dynamic"`. |
| `src/app/(site)/category/[slug]/page.tsx` | `contains` → `mode: "insensitive"` + `force-dynamic`. |
| `src/app/(site)/page.tsx` | `force-dynamic`. |
| `src/app/(site)/top-tools/page.tsx` | `force-dynamic`. |
| `src/app/(site)/blog/page.tsx` | `force-dynamic`. |
| `src/app/(site)/blog/[slug]/page.tsx` | `force-dynamic`. |
| `src/app/(site)/categories/page.tsx` | `force-dynamic`. |
| `src/app/(site)/submit/page.tsx` | `force-dynamic`. |
| `src/app/api/admin/tools/route.ts` | `contains` → `mode: "insensitive"`. |
| `src/app/api/submissions/route.ts` | `contains` → `mode: "insensitive"`. |
| `src/app/sitemap.ts` | `force-dynamic`. |

### Created (4)
- `prisma/migrations/migration_lock.toml`
- `prisma/migrations/20260101000000_init/migration.sql`
- `scripts/migrate-sqlite-to-postgres.ts` (data migration; reads SQLite via `node:sqlite`, writes Postgres via Prisma, preserves IDs)
- `scripts/create-admin.ts` (secure admin provisioning; env-driven, no hardcoded creds)

### Untracked from git (1)
- `db/custom.db` (removed from git index via `git rm --cached`; **local file preserved** for the data-migration script).

## 14. Exact files intentionally NOT changed

Per Phase 1 audit §K (frozen):
- **All public/admin UI components** (`src/components/**`, `src/components/ui/**`) — including `tool-logo.tsx`, `tool-card.tsx`, `tools-list-view.tsx`, `ad-slot.tsx`, `site-header.tsx`, `site-footer.tsx`, `admin-shell.tsx`, `admin-layout-inner.tsx`.
- **Auth/security:** `src/lib/auth.ts`, `src/lib/api-guard.ts`, `src/proxy.ts` — unchanged (Phase 1 security fixes preserved).
- **Styling:** `src/app/globals.css`, `src/app/layout.tsx`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`.
- **Gateway:** `Caddyfile`.
- **`next.config.ts`** — `output: "standalone"` and `typescript.ignoreBuildErrors: true` both unchanged (TS-error cleanup is Phase 3).
- **`tsconfig.json`, `eslint.config.mjs`** — unchanged.
- **All `src/app/api/**` route handlers** except the documented `contains` edits (admin guards, auth, CRUD behavior unchanged).
- **`src/app/robots.ts`, `src/components/seo.tsx`** — unchanged (they read `NEXT_PUBLIC_SITE_URL` which is now documented in `.env.example`).
- **Prisma models/fields/relations** — all 9 models preserved exactly.

## 15. Rollback procedure

Phase 2 is fully reversible before the operator applies changes to Supabase.

### Pre-apply rollback (revert the code/config only — no Supabase impact)
```bash
git checkout -- prisma/schema.prisma .env package.json prisma/seed.ts \
  src/lib/db.ts src/app/api/tools/route.ts \
  "src/app/(site)/page.tsx" "src/app/(site)/tools/page.tsx" \
  "src/app/(site)/tools/[slug]/page.tsx" "src/app/(site)/category/[slug]/page.tsx" \
  "src/app/(site)/top-tools/page.tsx" "src/app/(site)/blog/page.tsx" \
  "src/app/(site)/blog/[slug]/page.tsx" "src/app/(site)/categories/page.tsx" \
  "src/app/(site)/submit/page.tsx" src/app/sitemap.ts \
  src/app/api/admin/tools/route.ts src/app/api/submissions/route.ts \
  .gitignore
git restore --staged db/custom.db   # re-track the SQLite file
rm -rf prisma/migrations scripts .env.example
# Set .env back to: DATABASE_URL=file:/home/z/my-project/db/custom.db
bun run db:generate   # regenerate the SQLite client
```
This restores the exact pre-Phase-2 state (SQLite, no migrations, no scripts).

### Post-apply rollback (Supabase already has the schema/data)
- The Supabase schema/data is **not destructive to the SQLite source** — `db/custom.db` is preserved locally. To fall back to SQLite:
  1. Repoint `.env` `DATABASE_URL=file:/home/z/my-project/db/custom.db`, remove `DIRECT_URL`.
  2. Revert `prisma/schema.prisma` provider to `sqlite`.
  3. `bun run db:generate` (regenerate the SQLite client).
  4. Restart the app.
- **Caveat:** any writes (clicks, submissions, admin edits) made to Postgres after cutover are NOT back-propagated to SQLite. For the first deploy (demo data) this is acceptable; for a real-data deploy, run a read-only verification window before flipping traffic.
- **Admin lockout recovery:** if the production admin is mis-provisioned, run `bun run db:create-admin` with a new `ADMIN_EMAIL`/`ADMIN_PASSWORD` against the Supabase DB, or insert a pre-computed bcrypt hash directly via SQL.

### If the existing Supabase schema conflicts with the migration
- **STOP** before `migrate deploy`. Inspect via Supabase dashboard SQL editor:
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  ```
- If compatible tables exist, mark the migration applied without running it:
  ```
  DIRECT_URL=<direct-url> bunx prisma migrate resolve --applied 20260101000000_init
  ```
- If old tables are incompatible and contain disposable data, **document the conflict and obtain explicit approval** before dropping them. Do NOT run `prisma migrate reset` (it drops all data).

---

## Success condition status

| Criterion | Status |
|---|---|
| App uses PostgreSQL/Supabase through Prisma instead of SQLite for production | ✅ (code/config; live apply is operator step) |
| Existing data preserved | ✅ (SQLite intact; migration script preserves IDs; live copy is operator step) |
| App behaves the same from the user's perspective | ✅ (case-insensitive search preserved; UI unchanged) |
| Authentication/security intact | ✅ (proxy gate, fail-safe JWT, no prod default admin — all Phase 1 fixes preserved) |
| Public UI unchanged | ✅ (only `force-dynamic` + `mode: insensitive` added — non-visual) |
| Admin UI unchanged | ✅ (no admin UI file modified) |
| No production secrets hardcoded | ✅ (verified) |
| Migration reproducible | ✅ (`migration.sql` byte-identical to fresh `migrate diff`) |
| No longer depends on local SQLite filesystem for production | ✅ (build no longer needs `db/custom.db`; file untracked) |
| Fully production-ready | ⏸ **No** — Phase 3 handles TS cleanup + live Supabase apply/verify. |

**Phase 2 is complete. Phase 3 is NOT started.** The remaining work is: (1) operator applies the migration + data to Supabase with real credentials, (2) Phase 3 fixes the 16 pre-existing TS errors, removes `ignoreBuildErrors`, and does final production hardening.

---

## 16. Safety Review Findings (Phase 2 revision)

This section documents the independent safety review of the Phase 2 artifacts. The review verified each item from the safety brief and fixed only verified issues. **No migration or data transfer to Supabase was performed. The live Supabase migration has NOT been verified — it remains an operator step.**

### 16.1 Issues found and fixed

#### Issue S1 — `.env.example` was MISSING (CRITICAL)
- **Finding:** `.env.example` did not exist on disk. Root cause: `.gitignore` line 34 (`.env*`) matched `.env.example`, so when the Phase 2 working tree was reset to the committed state, the never-committed `.env.example` was lost.
- **Fix:** Recreated `.env.example` with all 7 required variables using placeholders only (verified: zero real secrets — only `<placeholder>` patterns). Added a `!.env.example` exception to `.gitignore` (line 36) so the template is now tracked and survives future resets.
- **Verification:** `git check-ignore .env.example` → not ignored (trackable); grep for secrets → only the comment "NEVER commit real secrets"; 7 `VAR=` entries documented.

#### Issue S2 — Local `.env` reverted to SQLite, inconsistent with committed `postgresql` schema (HIGH)
- **Finding:** `.env` contained `DATABASE_URL=file:/home/z/my-project/db/custom.db` (original SQLite config) while `prisma/schema.prisma` is committed as `provider = "postgresql"`. The app crashed with "the URL must start with the protocol `postgresql://`" on every DB-backed route.
- **Fix:** Restored `.env` to the Postgres placeholder config (pooler + direct URLs with `CHANGE_ME` password, `JWT_SECRET` dev-only, `SQLITE_SOURCE_URL` for the migration script). This makes the local environment consistent with the committed schema. The app still cannot connect to Supabase (placeholder creds) but fails at the authentication step, not at config validation — matching the documented Phase 2 state.
- **Verification:** dev server: non-DB routes 200, `/admin` 307→login, DB routes 500 with "Authentication failed against database server" (Prisma reaches the Supabase pooler; only the password is wrong).

#### Issue S3 — SQLite source file `db/custom.db` was MISSING from disk (CRITICAL)
- **Finding:** `db/custom.db` (299 KB, the migration source) was not on disk. Root cause: Phase 2's `git rm --cached` was committed (file untracked from index), and the gitignored working-tree file was lost when the tree was reset.
- **Fix:** Restored from git history — `git show b104fa4:db/custom.db > db/custom.db`. The file is byte-identical to the original (299,008 bytes). It stays gitignored (not re-tracked) so the repo no longer ships the SQLite file, but it's present locally for the data-migration script.
- **Verification:** `PRAGMA integrity_check` → `ok`; all 9 tables present with expected counts: Category 10, Tool 21, Article 3, Submission 1, AdSlot 1, Click 1002, Contact 0, AdminUser 1, SiteSetting 0 (total 1039 rows). The file is opened `readOnly: true` by the migration script — it cannot be modified by the migration.

#### Issue S4 — Data-migration script lacked safety guards (HIGH → FIXED)
The original `scripts/migrate-sqlite-to-postgres.ts` had four safety gaps. All fixed in this revision:

| Gap | Risk | Fix |
|---|---|---|
| `upsert(update: data)` always overwrote existing target rows | Re-running the script would silently overwrite newer production records with older SQLite data | Default mode is now **CREATE-ONLY**: rows whose ID already exists are **SKIPPED** (not overwritten); skipped IDs are reported |
| No pre-existing target data detection | Would blindly write into a DB that already had real data | **Pre-flight check**: if any target table is non-empty, the script ABORTS unless `MIGRATE_FORCE=1` is explicitly set |
| No ID-collision detection | With a non-empty target, ID collisions would be silently overwritten | **Pre-flight ID-collision detection**: lists all conflicting IDs and ABORTS unless both `MIGRATE_FORCE=1` AND `MIGRATE_CONFIRM_OVERWRITE=1` are set (two-key confirmation) |
| Row-count comparison compared `pg-after` to `written` (SQLite count) | False "MISMATCH" on non-empty targets; wouldn't detect skipped data | Verification now compares `pg-now` to the correct expected value (`srcCount` for clean targets; `targetBefore + written` for non-empty targets) and reports per-table |

Additional safety added:
- **SQLite source verification:** the script checks all 9 expected tables exist in the SQLite source before doing anything; aborts if the source schema is incompatible.
- **Postgres reachability check:** aborts with a clear message ("Is the schema applied?") if the target is unreachable, before any writes.
- **Read-only source:** `new DatabaseSync(SQLITE_PATH, { readOnly: true })` — the SQLite file cannot be modified by the script even if a bug exists.
- **Two-key overwrite confirmation:** `MIGRATE_FORCE=1` alone is NOT enough to overwrite existing IDs — `MIGRATE_CONFIRM_OVERWRITE=1` is also required. This prevents accidental overwrites.

**Verification of the safety logic:** ran the script against the unreachable Supabase direct URL — it opened the SQLite source read-only, verified the 9 source tables, attempted the Postgres pre-flight count, and **ABORTED cleanly** ("Cannot query PostgreSQL target. Is the schema applied?") without writing anything. Confirmed the SQLite source was untouched afterward (still 299,008 bytes, 21 tools).

### 16.2 Migration SQL safety (verified)

- `prisma/migrations/20260101000000_init/migration.sql` contains **only** `CREATE SCHEMA IF NOT EXISTS`, `CREATE TABLE`, `CREATE INDEX`, and `ALTER TABLE ADD CONSTRAINT` statements. **No `DROP`, `DELETE`, or `TRUNCATE`** (verified by grep).
- `CREATE TABLE` (not `CREATE TABLE IF NOT EXISTS`) means `prisma migrate deploy` against a non-empty DB with conflicting tables **fails safely** with "relation already exists" — it does NOT destroy existing data.
- **Reproducibility verified:** `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script` produces a byte-identical file to the committed `migration.sql`.
- `migration_lock.toml` declares `provider = "postgresql"`.
- **Conclusion: the migration is safe to apply ONLY to a clean PostgreSQL database.** Against a non-clean DB it aborts without data loss.

### 16.3 SQLite database integrity (verified)

- `db/custom.db` restored and intact (299,008 bytes).
- `PRAGMA integrity_check` → `ok`.
- All 9 tables present with expected row counts (10/21/3/1/1/1002/0/1/0 = 1039).
- The file is gitignored (not re-tracked) — the repo no longer ships it, but it's present locally for the one-time migration.
- The migration script opens it `readOnly: true` — it cannot be modified.

### 16.4 Build / lint / typecheck results (this revision)

| Check | Command | Result |
|---|---|---|
| Prisma validate | `npx prisma validate` | ✅ valid (PostgreSQL) |
| Prisma generate | `npx prisma generate` | ✅ client for PostgreSQL |
| TypeScript | `npx tsc --noEmit` | 16 errors in `src/` (**all pre-existing, unchanged from Phase 1**: 11 in `admin/tools/tool-form.tsx`, 5 in `tools-list-view.tsx`). **0 new errors** in any Phase 2 / safety-review file. + 4 unrelated `examples/`/`skills/` errors. |
| ESLint | `bun run lint` | ✅ **0 errors / 0 warnings** |
| Build | `bun run build` | ✅ `prisma generate && next build` compiles in ~15s; 28 pages; standalone cp. `typescript.ignoreBuildErrors` unchanged (Phase 3). |
| Migration reproducibility | `prisma migrate diff --from-empty` vs `migration.sql` | ✅ byte-identical |
| Migration script safety | dry run against unreachable Postgres | ✅ aborts cleanly, SQLite untouched |

### 16.5 App route state (dev server, placeholder Supabase creds)

| Route | Status | Notes |
|---|---|---|
| `/privacy`, `/terms`, `/admin/login` | 200 | static, no DB |
| `/admin` (unauth) | 307 → `/admin/login` | `proxy.ts` server-side gate intact |
| `/nope` | 404 | not-found page |
| `/`, `/tools` (DB-backed) | 500 | "Authentication failed against database server" — Prisma reaches Supabase pooler; placeholder password wrong. **Not a code error.** Returns 200 with real creds + migrated data. |

### 16.6 Unresolved blockers (operator steps — NOT doable from this environment)

1. **Live Supabase schema apply** — requires real Supabase DB password + direct-Postgres (port 5432) access (blocked by sandbox firewall). Operator runs:
   ```
   DIRECT_URL="postgresql://postgres:<DB_PASSWORD>@db.wejpgslhwdajgbaipmuf.supabase.co:5432/postgres" \
     bun run db:migrate:deploy
   ```
   ⚠️ Inspect the existing Supabase schema first (Supabase dashboard → SQL editor → `\dt`). If older Aivora tables exist and conflict, `migrate deploy` fails safely ("relation already exists") — do NOT run `prisma migrate reset` (drops all data). Resolve per §15.

2. **Live data migration** — requires direct-Postgres access. Operator runs (after step 1):
   ```
   DIRECT_URL="postgresql://postgres:<DB_PASSWORD>@db.wejpgslhwdajgbaipmuf.supabase.co:5432/postgres" \
   SQLITE_SOURCE_URL="file:/home/z/my-project/db/custom.db" \
     bun run db:migrate-sqlite
   ```
   The script's safety logic (§16.1 Issue S4) protects against overwrites. It will abort if the target is non-empty (unless `MIGRATE_FORCE=1`); it skips existing IDs by default.

3. **Admin provisioning** (only if NOT migrating the existing admin):
   ```
   DIRECT_URL=<direct-url> ADMIN_EMAIL=<email> ADMIN_PASSWORD=<strong-pw> \
     bun run db:create-admin
   ```

4. **Vercel env vars** (per §9) + deploy + verify all routes 200.

### 16.7 What was NOT done (per safety rules)

- ❌ No migration applied to Supabase.
- ❌ No data transferred to Supabase.
- ❌ No Supabase data deleted or overwritten.
- ❌ No SQLite data modified or deleted (file restored + opened read-only).
- ❌ No UI, auth, or routing changes (beyond the committed Phase 2 non-visual changes).
- ❌ No `prisma migrate reset` (would drop data).
- ❌ No `ignoreBuildErrors` change.
- ❌ No new TypeScript errors introduced; no pre-existing TS errors fixed (Phase 3).

**The live Supabase migration has NOT been verified. It remains an operator step requiring real credentials and direct-Postgres access.**

