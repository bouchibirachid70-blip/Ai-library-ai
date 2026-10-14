import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Returns the session user or a 401 NextResponse. */
export async function adminGuard() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
