import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "@/lib/session";

export async function requireUser(): Promise<
  { session: SessionPayload } | { error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { session };
}

export async function requireRole(
  role: "WORKER" | "CLIENT"
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;
  if (auth.session.primaryRole !== role) {
    return {
      error: NextResponse.json(
        { error: role === "CLIENT" ? "Only clients can do this" : "Only workers can do this" },
        { status: 403 }
      ),
    };
  }
  return auth;
}
