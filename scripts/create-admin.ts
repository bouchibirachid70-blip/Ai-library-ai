/**
 * One-time secure admin provisioning for a fresh PostgreSQL database.
 *
 * Usage (run once in a trusted environment against the production DB):
 *   DIRECT_URL=<postgres-direct-url> \
 *   ADMIN_EMAIL=<admin-email> \
 *   ADMIN_PASSWORD=<strong-password> \
 *   bun run scripts/create-admin.ts
 *
 * Behavior:
 *   - Reads ADMIN_EMAIL and ADMIN_PASSWORD from the environment.
 *   - Refuses to run in production mode if either is unset (no hardcoded
 *     fallback, no default admin@aivora.dev/admin123).
 *   - If an AdminUser with the given email already exists, updates its
 *     password hash (idempotent) and reports it.
 *   - Otherwise creates the AdminUser with a bcrypt-hashed password.
 *   - NEVER prints the password. Prints only the email and id.
 *
 * This script replaces the old insecure `ensureDefaultAdmin()` runtime call.
 * Run it once after the initial `prisma migrate deploy` on a fresh database.
 * After the admin exists, the env vars can be removed from the environment.
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url || url.startsWith("file:")) {
    throw new Error("DIRECT_URL (or DATABASE_URL) must point to PostgreSQL.");
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD (>= 8 chars) must be set in the environment. No hardcoded credentials are used.",
    );
  }

  const db = new PrismaClient({
    log: ["warn", "error"],
    datasources: { db: { url } },
  });

  try {
    const existing = await db.adminUser.findUnique({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      await db.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash, name: existing.name || "Aivora Admin" },
      });
      console.log(`Updated existing admin (id=${existing.id}, email=${email}).`);
    } else {
      const created = await db.adminUser.create({
        data: { email, name: "Aivora Admin", passwordHash },
      });
      console.log(`Created admin (id=${created.id}, email=${email}).`);
    }
    console.log("Done. You can now log in at /admin/login.");
    console.log(
      "Tip: remove ADMIN_EMAIL/ADMIN_PASSWORD from the environment after provisioning.",
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("Admin provisioning failed:", e?.message || e);
  process.exit(1);
});
