import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import DisputeQueue from "./DisputeQueue";

export default async function AdminDisputesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!(await isAdminEmail(user?.email))) redirect("/dashboard");

  const disputes = await prisma.dispute.findMany({
    where: { status: "OPEN" },
    include: {
      raisedBy: { select: { name: true, email: true, phone: true } },
      booking: {
        include: {
          gig: { select: { title: true, client: { select: { name: true, email: true, phone: true } } } },
          worker: { select: { name: true, email: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const items = disputes.map((d) => ({
    id: d.id,
    reason: d.reason,
    createdAt: d.createdAt.toISOString(),
    raisedBy: d.raisedBy,
    booking: {
      id: d.booking.id,
      title: d.booking.gig.title,
      agreedAmountKes: d.booking.agreedAmountKes,
      status: d.booking.status,
      client: d.booking.gig.client,
      worker: d.booking.worker,
    },
  }));

  return <DisputeQueue initialItems={items} />;
}
