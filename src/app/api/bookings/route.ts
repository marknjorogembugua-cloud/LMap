import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { bookingCreateSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role"); // "worker" | "client" | null (both)

  const [asWorker, asClient] = await Promise.all([
    role === "client"
      ? []
      : prisma.booking.findMany({
          where: { workerId: auth.session.userId },
          include: {
            gig: { include: { client: { select: { name: true, phone: true, avatarUrl: true } } } },
            transaction: true,
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { requestedAt: "desc" },
        }),
    role === "worker"
      ? []
      : prisma.booking.findMany({
          where: { gig: { clientId: auth.session.userId } },
          include: {
            gig: true,
            worker: { select: { name: true, phone: true, avatarUrl: true } },
            transaction: true,
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          orderBy: { requestedAt: "desc" },
        }),
  ]);

  return NextResponse.json({ asWorker, asClient });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { gigId, workerId, agreedAmountKes } = parsed.data;

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  if (!gig) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (gig.status !== "OPEN") {
    return NextResponse.json({ error: "This job is no longer open" }, { status: 400 });
  }
  if (gig.clientId === workerId) {
    return NextResponse.json({ error: "You can't book yourself" }, { status: 400 });
  }

  const isDirectInvite = gig.targetWorkerId !== null;
  if (isDirectInvite) {
    if (auth.session.primaryRole !== "CLIENT" || auth.session.userId !== gig.clientId || workerId !== gig.targetWorkerId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  } else {
    if (auth.session.primaryRole !== "WORKER" || auth.session.userId !== workerId) {
      return NextResponse.json({ error: "Only workers can apply to an open job" }, { status: 403 });
    }
    const existing = await prisma.booking.findFirst({
      where: { gigId, workerId, status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] } },
    });
    if (existing) {
      return NextResponse.json({ error: "You already applied to this job" }, { status: 400 });
    }
  }

  const booking = await prisma.booking.create({
    data: { gigId, workerId, agreedAmountKes },
  });

  if (isDirectInvite) {
    await notify({
      userId: workerId,
      type: "APPLICATION_RECEIVED",
      title: "You've been invited to a job",
      body: gig.title,
      entityUrl: `/messages/${booking.id}`,
      bookingId: booking.id,
      gigId: gig.id,
    });
  } else {
    await notify({
      userId: gig.clientId,
      type: "APPLICATION_RECEIVED",
      title: "New applicant",
      body: `Someone applied to "${gig.title}"`,
      entityUrl: `/messages/${booking.id}`,
      bookingId: booking.id,
      gigId: gig.id,
    });
  }

  return NextResponse.json({ ok: true, booking });
}
