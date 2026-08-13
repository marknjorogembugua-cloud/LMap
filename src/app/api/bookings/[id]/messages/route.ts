import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { sendMessageSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

async function authorize(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { workerId: true, gig: { select: { clientId: true, title: true } } },
  });
  if (!booking) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const allowed = booking.workerId === userId || booking.gig.clientId === userId;
  if (!allowed) return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) };
  return { booking };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const authz = await authorize(id, auth.session.userId);
  if ("error" in authz) return authz.error;

  const messages = await prisma.message.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const authz = await authorize(id, auth.session.userId);
  if ("error" in authz) return authz.error;

  const body = await req.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { bookingId: id, senderId: auth.session.userId, body: parsed.data.text },
    include: { sender: { select: { id: true, name: true } } },
  });

  const recipientId =
    auth.session.userId === authz.booking.workerId
      ? authz.booking.gig.clientId
      : authz.booking.workerId;

  await notify({
    userId: recipientId,
    type: "NEW_MESSAGE",
    title: "New message",
    body: parsed.data.text.slice(0, 80),
    entityUrl: `/messages/${id}`,
    bookingId: id,
  });

  return NextResponse.json({ ok: true, message });
}
