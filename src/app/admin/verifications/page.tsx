import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getSignedStorageUrl } from "@/lib/supabase-storage";
import VerificationQueue from "./VerificationQueue";

const BUCKET = "verifications";

export default async function AdminVerificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!(await isAdminEmail(user?.email))) redirect("/dashboard");

  const profiles = await prisma.workerProfile.findMany({
    where: { verificationStatus: "PENDING" },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { updatedAt: "asc" },
  });

  const items = await Promise.all(
    profiles.map(async (p) => ({
      id: p.id,
      category: p.category,
      county: p.county,
      area: p.area,
      user: p.user,
      idImageUrl: p.idImagePath ? await getSignedStorageUrl(BUCKET, p.idImagePath) : null,
    }))
  );

  return <VerificationQueue initialItems={items} />;
}
