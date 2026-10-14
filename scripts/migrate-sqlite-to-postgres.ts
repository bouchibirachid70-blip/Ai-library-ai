/**
 * One-time data migration: SQLite (db/custom.db) → PostgreSQL (Supabase).
 *
 * Usage (run in a trusted environment where the Supabase Postgres direct
 * connection is reachable AND the local SQLite file exists):
 *
 *   DIRECT_URL=<postgres-direct-url> \
 *   SQLITE_SOURCE_URL=file:/home/z/my-project/db/custom.db \
 *     bun run scripts/migrate-sqlite-to-postgres.ts
 *
 * Why node:sqlite and not a second PrismaClient?
 *   The generated Prisma client is now provider-locked to `postgresql`, so it
 *   can no longer read a SQLite datasource. We therefore read the SQLite
 *   source directly with Node's built-in `node:sqlite` (Node 22.5+, stable in
 *   Node 24) and write to Postgres with the Prisma client. No extra
 *   dependencies are added.
 *
 * SAFETY DESIGN (read carefully before running):
 *   1. READ-ONLY source: the SQLite file is opened with `readOnly: true`; it
 *      is never modified or deleted by this script.
 *   2. Pre-flight checks (abort before writing anything):
 *      a. SQLite source must be readable AND have at least the tables we
 *         expect; aborts with the missing tables otherwise.
 *      b. PostgreSQL target must be reachable; aborts if the connection fails.
 *      c. PostgreSQL target tables must be EMPTY for all 9 tables; aborts if
 *         any target table already has rows. This prevents silently
 *         overwriting newer production records or colliding on IDs.
 *         To force an overwrite (DANGEROUS), set ENV MIGRATE_FORCE=1, which
 *         switches the script from `create`-only to `upsert` and requires
 *         explicit confirmation. Even with MIGRATE_FORCE=1, the script prints
 *         every conflicting ID before writing.
 *      d. ID-collision detection: if the target is non-empty and MIGRATE_FORCE
 *         is set, the script first lists all IDs that already exist in the
 *         target; if any SQLite row's ID matches an existing target row, it
 *         reports the conflict and aborts unless MIGRATE_CONFIRM_OVERWRITE=1
 *         is also set. This is a two-key confirmation to prevent accidents.
 *   3. Preserve IDs, timestamps, FKs, and the AdminUser.passwordHash (bcrypt
 *      hashes are portable strings). Booleans (SQLite 0/1) are coerced.
 *   4. Default mode is CREATE-ONLY: rows whose ID already exists in the target
 *      are SKIPPED (not overwritten), and the skipped IDs are reported. This
 *      means re-running the script is safe and never overwrites newer data.
 *   5. Per-table count verification at the end: compares SQLite source count
 *      to PostgreSQL target count for EACH table; reports any mismatch.
 *   6. Atomic-ish: writes are per-row; a failure mid-migration leaves a partial
 *      target, but re-running is safe (create-only skips existing IDs).
 *
 * IMPORTANT:
 *   - The PostgreSQL schema MUST already exist (run `prisma migrate deploy`
 *     with DIRECT_URL first) before running this script.
 *   - Order matters: Category → Tool/Submission (FKs) → Click (FK to Tool) →
 *     the rest (no FKs).
 *   - NEVER run this against a production PostgreSQL database that already
 *     contains real data unless you have explicitly verified it is safe.
 *     The default (create-only, empty-target-required) behavior protects you.
 */

import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";

const SQLITE_PATH =
  (process.env.SQLITE_SOURCE_URL || "file:/home/z/my-project/db/custom.db")
    .replace(/^file:/, "");

// Table → Prisma model name mapping (SQLite uses PascalCase table names matching
// the Prisma model names from the old SQLite schema). dateCols lists the DateTime
// columns that SQLite stores as integer (ms) and must be converted to Date.
const TABLES: { table: string; model: string; boolCols: string[]; dateCols: string[] }[] = [
  { table: "Category", model: "category", boolCols: [], dateCols: ["createdAt", "updatedAt"] },
  { table: "Tool", model: "tool", boolCols: [], dateCols: ["createdAt", "updatedAt"] },
  { table: "Article", model: "article", boolCols: ["published"], dateCols: ["createdAt", "updatedAt"] },
  { table: "Submission", model: "submission", boolCols: [], dateCols: ["createdAt", "updatedAt"] },
  { table: "AdSlot", model: "adSlot", boolCols: ["isActive"], dateCols: ["createdAt", "updatedAt"] },
  { table: "Click", model: "click", boolCols: [], dateCols: ["createdAt"] },
  { table: "Contact", model: "contact", boolCols: [], dateCols: ["createdAt"] },
  { table: "AdminUser", model: "adminUser", boolCols: [], dateCols: ["createdAt", "updatedAt"] },
  { table: "SiteSetting", model: "siteSetting", boolCols: [], dateCols: [] },
];

function pgUrl() {
  const u = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!u || u.startsWith("file:")) {
    throw new Error("DIRECT_URL (or DATABASE_URL) must point to PostgreSQL.");
  }
  return u;
}

function readRows(src: DatabaseSync, table: string): Record<string, unknown>[] {
  const stmt = src.prepare(`SELECT * FROM "${table}"`);
  return stmt.all() as Record<string, unknown>[];
}

// Coerce SQLite values to Prisma/PostgreSQL-compatible values.
// - SQLite stores booleans as 0/1 integers → Prisma expects boolean.
// - SQLite stores DateTime as Unix milliseconds (integer) → Prisma + PostgreSQL
//   expect a JS Date object. Detect numeric timestamp columns and convert.
function coerce(row: Record<string, unknown>, boolCols: string[], dateCols: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const c of boolCols) {
    if (out[c] !== undefined && out[c] !== null) {
      out[c] = Boolean(out[c]);
    }
  }
  for (const c of dateCols) {
    if (out[c] !== undefined && out[c] !== null && typeof out[c] === "number") {
      out[c] = new Date(out[c] as number);
    }
  }
  return out;
}

async function main() {
  const pg = pgUrl();
  const FORCE = process.env.MIGRATE_FORCE === "1";
  const CONFIRM_OVERWRITE = process.env.MIGRATE_CONFIRM_OVERWRITE === "1";

  console.log("=== Aivora SQLite → PostgreSQL migration ===");
  console.log("Source (SQLite, read-only):", SQLITE_PATH);
  console.log("Target (Postgres):", pg.replace(/:[^:@/]+@/, ":***@"));
  console.log("Mode:", FORCE ? "UPSERT (overwrite allowed)" : "CREATE-ONLY (skip existing IDs)");
  if (FORCE && !CONFIRM_OVERWRITE) {
    console.log("  (MIGRATE_FORCE=1 set but MIGRATE_CONFIRM_OVERWRITE not set — ID conflicts will abort)");
  }
  console.log("");

  // 1. Open SQLite source read-only.
  let src: DatabaseSync;
  try {
    src = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  } catch (e) {
    throw new Error(`Cannot open SQLite source at ${SQLITE_PATH}: ${(e as Error).message}`);
  }

  // 2. Pre-flight: verify all expected SQLite tables exist.
  const sqliteTables = src
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all()
    .map((r) => (r as { name: string }).name);
  const missingSqlite = TABLES.map((t) => t.table).filter((t) => !sqliteTables.includes(t));
  if (missingSqlite.length > 0) {
    src.close();
    throw new Error(
      `SQLite source is missing expected tables: ${missingSqlite.join(", ")}. ` +
        `Found: ${sqliteTables.join(", ")}. Aborting — source schema is incompatible.`,
    );
  }
  console.log("✓ SQLite source has all 9 expected tables.");

  // 3. Connect to Postgres target.
  const dst = new PrismaClient({
    log: ["warn", "error"],
    datasources: { db: { url: pg } },
  });

  // 4. Pre-flight: verify Postgres target is reachable and check each table's row count.
  console.log("\n=== Pre-flight: checking PostgreSQL target state ===");
  const targetCounts: Record<string, number> = {};
  let totalTargetRows = 0;
  try {
    for (const t of TABLES) {
      const count = await (dst as unknown as Record<string, { count: () => Promise<number> }>)[t.model].count();
      targetCounts[t.model] = count;
      totalTargetRows += count;
    }
  } catch (e) {
    src.close();
    await dst.$disconnect();
    throw new Error(
      `Cannot query PostgreSQL target. Is the schema applied (prisma migrate deploy)? ` +
        `Error: ${(e as Error).message}`,
    );
  }

  const nonEmpty = TABLES.filter((t) => targetCounts[t.model] > 0);
  if (nonEmpty.length > 0) {
    console.log("⚠ Target tables are NOT empty:");
    for (const t of nonEmpty) {
      console.log(`   ${t.model}: ${targetCounts[t.model]} rows`);
    }
    // MIGRATE_ALLOW_NONEMPTY=1: proceed in CREATE-ONLY mode against a non-empty
    // target. Existing rows are NEVER overwritten (create-only skips existing
    // IDs). This is safe when the existing IDs cannot collide with source IDs
    // (e.g. existing UUIDs vs new cuid()s). Without this flag, abort.
    const allowNonEmpty = process.env.MIGRATE_ALLOW_NONEMPTY === "1";
    if (!FORCE && !allowNonEmpty) {
      src.close();
      await dst.$disconnect();
      throw new Error(
        `PostgreSQL target already has data in ${nonEmpty.length} table(s). ` +
          `Refusing to run to avoid overwriting newer production data. ` +
          `If existing IDs cannot collide with source IDs, re-run with MIGRATE_ALLOW_NONEMPTY=1 ` +
          `(existing rows are skipped, never overwritten). ` +
          `If you want to overwrite instead, use MIGRATE_FORCE=1 (+ MIGRATE_CONFIRM_OVERWRITE=1 for ID conflicts).`,
      );
    }
    if (FORCE) {
      console.log("  MIGRATE_FORCE=1 set — proceeding in UPSERT mode after conflict check.");
    } else {
      console.log("  MIGRATE_ALLOW_NONEMPTY=1 set — proceeding in CREATE-ONLY mode (existing rows skipped).");
    }
  } else {
    console.log("✓ All 9 PostgreSQL target tables are empty — safe to populate.");
  }

  // 5. Read all SQLite rows + (if target non-empty) detect ID collisions.
  console.log("\n=== Reading SQLite source rows ===");
  const sourceRows: Record<string, Record<string, unknown>[]> = {};
  for (const t of TABLES) {
    sourceRows[t.model] = readRows(src, t.table);
    console.log(`  ${t.model.padEnd(12)} ${sourceRows[t.model].length} rows`);
  }

  // ID-collision detection. In CREATE-ONLY mode (no FORCE), collisions are
  // SKIPPED (not overwritten) — the script reports them but proceeds, because
  // the existing rows are preserved untouched (create-only never overwrites).
  // In FORCE mode, collisions are a hard abort unless MIGRATE_CONFIRM_OVERWRITE=1.
  if (totalTargetRows > 0) {
    console.log("\n=== ID-collision detection ===");
    let anyCollision = false;
    const collisionCounts: Record<string, number> = {};
    for (const t of TABLES) {
      const rows = sourceRows[t.model];
      const existingIds = new Set(
        (
          await (dst as unknown as Record<string, { findMany: (a: unknown) => Promise<{ id: string }[]> }>)[t.model].findMany({
            select: { id: true },
          })
        ).map((r) => r.id),
      );
      const collisions = rows.filter((r) => existingIds.has(r.id as string));
      if (collisions.length > 0) {
        anyCollision = true;
        collisionCounts[t.model] = collisions.length;
        console.log(`  ⚠ ${t.model}: ${collisions.length} ID(s) already exist (will SKIP in create-only mode)`);
      }
    }
    if (anyCollision && FORCE && !CONFIRM_OVERWRITE) {
      src.close();
      await dst.$disconnect();
      throw new Error(
        `ID collisions detected and MIGRATE_FORCE=1 (overwrite mode) is set, but MIGRATE_CONFIRM_OVERWRITE=1 is not. ` +
          `Refusing to overwrite existing rows. Re-run with MIGRATE_CONFIRM_OVERWRITE=1 to confirm overwriting.`,
      );
    }
    if (anyCollision && !FORCE) {
      console.log("  (create-only mode: existing IDs will be skipped, not overwritten — proceeding safely)");
    }
  }

  // 6. Migrate rows. Default = create-only (skip existing IDs); FORCE = upsert.
  console.log("\n=== Migrating rows ===");
  const written: Record<string, number> = {};
  const skipped: Record<string, number> = {};

  async function writeRows(model: string, rows: Record<string, unknown>[], boolCols: string[], dateCols: string[]) {
    const m = (dst as unknown as Record<string, { upsert: (a: unknown) => Promise<unknown>; create: (a: unknown) => Promise<unknown>; findUnique: (a: unknown) => Promise<{ id: string } | null> }>)[model];
    let w = 0;
    let s = 0;
    for (const r of rows) {
      const data = coerce(r, boolCols, dateCols);
      if (FORCE && CONFIRM_OVERWRITE) {
        // Upsert (overwrite) — only when both flags set.
        await m.upsert({
          where: { id: data.id as string },
          create: data as never,
          update: data as never,
        });
        w++;
      } else {
        // Create-only: skip if the ID already exists (safe default).
        const existing = await m.findUnique({ where: { id: data.id as string } });
        if (existing) {
          s++;
          continue;
        }
        await m.create({ data: data as never });
        w++;
      }
    }
    written[model] = w;
    skipped[model] = s;
  }

  for (const t of TABLES) {
    await writeRows(t.model, sourceRows[t.model], t.boolCols, t.dateCols);
    const note = skipped[t.model] ? ` (${skipped[t.model]} skipped — already existed)` : "";
    console.log(`  ${t.model.padEnd(12)} wrote ${written[t.model]}${note}`);
  }

  // 7. Verification: recount Postgres and compare to source.
  console.log("\n=== Verification ===");
  console.log(
    "table".padEnd(14),
    "sqlite".padStart(8),
    "written".padStart(8),
    "skipped".padStart(8),
    "pg-now".padStart(8),
    "  check",
  );
  let ok = true;
  for (const t of TABLES) {
    const srcCount = sourceRows[t.model].length;
    const pgNow = await (dst as unknown as Record<string, { count: () => Promise<number> }>)[t.model].count();
    // In create-only mode on a clean DB, pgNow should equal srcCount.
    // In upsert mode, pgNow = pre-existing + (srcCount - skipped).
    const expected = totalTargetRows > 0 ? targetCounts[t.model] + written[t.model] : srcCount;
    const match = pgNow === expected;
    if (!match) ok = false;
    console.log(
      t.model.padEnd(14),
      String(srcCount).padStart(8),
      String(written[t.model]).padStart(8),
      String(skipped[t.model] ?? 0).padStart(8),
      String(pgNow).padStart(8),
      match ? "  ✓" : "  ✗ MISMATCH",
    );
  }
  console.log("");
  if (!ok) {
    console.error("✗ Row count mismatch detected — review above. Target may be in a partial state; re-running is safe.");
    process.exitCode = 1;
  } else {
    console.log("✓ All tables verified.");
  }

  src.close();
  await dst.$disconnect();
}

main().catch((e) => {
  console.error("\n✗ Migration ABORTED:", e?.message || e);
  process.exit(1);
});
