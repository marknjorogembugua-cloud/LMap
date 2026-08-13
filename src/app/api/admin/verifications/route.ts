import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getSignedStorageUrl } from "@/lib/supabase-storage";

const BUCKET = "verifications";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const profiles = await prisma.workerProfile.findMany({
    where: { verificationStatus: "PENDING" },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { updatedAt: "asc" },
  });

  const withImages = await Promise.all(
    profiles.map(async (p) => ({
      id: p.id,
      category: p.category,
      county: p.county,
      area: p.area,
      user: p.user,
      idImageUrl: p.idImagePath ? await getSignedStorageUrl(BUCKET, p.idImagePath) : null,
    }))
  );

  return NextResponse.json({ profiles: withImages });
}
