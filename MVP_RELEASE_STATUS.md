# Aivora MVP release status

## Changes in this package

- Removed the demo admin email/password from the login screen and stopped pre-filling the demo email.
- Updated the deployment database helper so PostgreSQL/Supabase projects skip the legacy SQLite file packaging and `prisma db push` step.
- Removed automatic schema mutation from the development startup script; migrations must be run explicitly after review.
- Removed `--accept-data-loss` from the `db:push` script, removed the generic destructive database-reset script, named the development migration command explicitly, and added a migration-status command.
- Replaced the form resolver's unsafe `as never` cast with separate Zod input/output types for React Hook Form.
- Updated the runtime startup script to require a PostgreSQL `DATABASE_URL`, never fall back to SQLite, hide connection strings in logs, and fail fast if the standalone server is missing.
- Removed the demo admin email from the login form and left the email field empty.
- Added regression tests for the PostgreSQL database packaging path and runtime environment checks.

## Live Supabase database

- Added and secured `public._prisma_migrations`.
- Recorded the existing `20260101000000_init` Prisma migration using the checksum of the repository's migration SQL.
- Verified the baseline row is marked finished and checked the current counts: 22 tools, 10 categories, 3 articles, 2 submissions, 381 clicks, 1 admin user.
- No application tables or existing rows were deleted.

## Verification

- `tests/database-runtime-build.sh`: passed, including the PostgreSQL regression case.
- `tests/start-runtime-env.sh`: passed (missing and SQLite database URLs are rejected).
- Shell syntax checks for the edited startup/build scripts: passed.
- The form's resolver now uses `z.input`/`z.output` typing rather than bypassing the compiler; a full dependency-backed TypeScript check remains blocked by unavailable dependencies.
- `git diff --check`: passed.
- `tests/python-runtime-build.sh`: could not complete because the environment could not download the required Python 3.12 runtime; this test concerns the optional Python service, not the Next.js app.
- A full Next.js production build and dependency-backed TypeScript check have not been run: dependency installation timed out in this environment, so `node_modules` is unavailable. The global `tsc` output is therefore dominated by missing dependency/type declarations and is not a valid project type-check.

## Still required before public launch

1. Reset/provision the admin account with a strong private password. The database currently contains `admin@aivora.dev`; this package does not know the existing password and does not change it.
2. Set production `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (at least 16 random characters), `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the hosting environment. Keep secrets out of source control. `ADMIN_EMAIL`/`ADMIN_PASSWORD` are needed only while running the one-time provisioning script; they should not remain configured unnecessarily afterward.
3. Install dependencies in the actual deployment environment and run the full production build and smoke tests. This was not possible here because dependency installation timed out.
4. Deploy the updated source and verify public pages, tool clicks, submission, article publishing, admin login, and CRUD.

Historical diagnostic reports under `docs/` predate the latest edits and must not be treated as a current, dependency-backed TypeScript/build result.

This is a focused MVP stabilization pass, not a claim that production deployment has completed.

## Hardening pass (static audit; no dependencies could be installed)

- Tool/submission `websiteUrl` now accepts only `http(s)` URLs (blocks stored `javascript:` links).
- JSON-LD output is escaped so descriptions containing `</script>` cannot inject script (stored XSS).
- Pagination params (`page`, `limit`) no longer produce NaN → Prisma 500 on bad input.
- Click tracking only works for approved tools.
- JWT signing/verification pinned to HS256 (app and proxy).
- Added `tests/validation.test.mjs` (`npm run test:unit`) — passed under Node 22.
- NOT run (no network): `npm/bun install`, `prisma generate`, `tsc`, `eslint`, `next build`, live DB read/write tests.
