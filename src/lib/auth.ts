import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "aivora_admin_session";

/**
 * Resolve the JWT signing secret.
 *
 * In production we MUST NOT fall back to a predictable hardcoded secret —
 * that would let anyone forge a valid admin session token. If `JWT_SECRET`
 * is missing in production, `signToken` throws (fail safe: never issue a
 * token with a known secret) and `verifyToken` returns null (fail safe: never
 * trust a token when the secret is unset → user is redirected to login).
 *
 * In development a fixed local secret keeps DX convenient; it is guarded by
 * `NODE_ENV` and cannot silently become the production credential.
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEV_JWT_SECRET = "aivora-dev-secret-DO-NOT-USE-IN-PRODUCTION";

function getJwtSecretForSigning(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) return secret;
  if (IS_PRODUCTION) {
    throw new Error(
      "JWT_SECRET must be set to a strong value (>= 16 chars) in production.",
    );
  }
  return DEV_JWT_SECRET;
}

function getJwtSecretForVerifying(): string | null {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) return secret;
  // Never trust a token when the production secret is unset; redirect to login.
  return IS_PRODUCTION ? null : DEV_JWT_SECRET;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, getJwtSecretForSigning(), { algorithm: "HS256", expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  const secret = getJwtSecretForVerifying();
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as SessionUser;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Ensure a default admin exists for local development ONLY.
 *
 * - In production this is a no-op. It never creates an admin from hardcoded
 *   credentials. Operators must provision the initial admin out-of-band (e.g.
 *   via the seed script run in a trusted environment) and set ADMIN_EMAIL /
 *   ADMIN_PASSWORD as env vars — they are NOT read at runtime here.
 * - In development it auto-creates an admin from env vars if provided, or a
 *   clearly-labelled dev admin. This dev credential is restricted to
 *   development by `NODE_ENV` and cannot silently become the production
 *   credential.
 */
export async function ensureDefaultAdmin() {
  if (IS_PRODUCTION) return;
  const email = process.env.ADMIN_EMAIL || "admin@aivora.dev";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (!existing) {
    await db.adminUser.create({
      data: {
        email,
        name: "Aivora Admin",
        passwordHash: await hashPassword(password),
      },
    });
  }
}
