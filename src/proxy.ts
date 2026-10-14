import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Server-side admin access control (Next.js 16 "proxy" convention, successor
 * to middleware).
 *
 * Unauthenticated requests to /admin/* (except /admin/login itself) are
 * redirected to /admin/login BEFORE any protected admin content renders. This
 * complements the existing client-side redirect in admin-layout-inner.tsx so
 * the admin application shell is never sent to an unauthenticated browser.
 *
 * Reuses the existing JWT cookie mechanism (SESSION_COOKIE + JWT_SECRET). No
 * new authentication framework is introduced. The cookie remains httpOnly and
 * is only read here for verification — it is never exposed to client code.
 *
 * Runs on the Node.js runtime (Next.js 16 "proxy" always runs on Node.js) so
 * the existing `jsonwebtoken` dependency works unchanged.
 */

const SESSION_COOKIE = "aivora_admin_session";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEV_JWT_SECRET = "aivora-dev-secret-DO-NOT-USE-IN-PRODUCTION";

function getJwtSecretForVerifying(): string | null {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) return secret;
  // Never trust a token when the production secret is unset.
  return IS_PRODUCTION ? null : DEV_JWT_SECRET;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page through (including when already authenticated, so
  // the login UI renders normally).
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = getJwtSecretForVerifying();
  let authenticated = false;
  if (token && secret) {
    try {
      jwt.verify(token, secret, { algorithms: ["HS256"] });
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect every /admin/* route. Login page is allowed through above.
  matcher: ["/admin/:path*"],
};
