import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { SessionPayload } from "@/lib/session";

function adminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return adminAllowlist().includes(email.toLowerCase());
}

export async function getAdminUserIds(): Promise<string[]> {
  const allowlist = adminAllowlist();
  if (allowlist.length === 0) return [];
  const admins = await prisma.user.findMany({
    where: { email: { in: allowlist, mode: "insensitive" } },
    select: { id: true },
  });
  return admins.map((a) => a.id);
}

export async function requireAdmin(): Promise<
  { session: SessionPayload } | { error: NextResponse }
> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { email: true },
  });

  if (!(await isAdminEmail(user?.email))) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  }

  return { session: auth.session };
}
