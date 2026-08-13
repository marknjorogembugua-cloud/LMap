import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireRole } from "@/lib/require-user";
import { gigSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { notifyNearbyWorkers } from "@/lib/notifications";
import { haversineKm, parseCoord } from "@/lib/geo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const county = searchParams.get("county");
  const mine = searchParams.get("mine");

  if (mine === "1") {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;
    const gigs = await prisma.gig.findMany({
      where: { clientId: auth.session.userId },
      include: { bookings: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ gigs });
  }

  const gigs = await prisma.gig.findMany({
    where: {
      status: "OPEN",
      targetWorkerId: null,
      ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
      ...(county ? { county } : {}),
    },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const session = await getSession();

  // Resolve where we're measuring distance from: explicit query params win,
  // otherwise fall back to the worker's own persisted live location.
  let originLat = parseCoord(searchParams.get("lat"));
  let originLng = parseCoord(searchParams.get("lng"));
  if ((originLat === null || originLng === null) && session) {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: session.userId },
      select: { lat: true, lng: true },
    });
    if (profile?.lat != null && profile?.lng != null) {
      originLat = profile.lat;
      originLng = profile.lng;
    }
  }

  if (originLat !== null && originLng !== null) {
    const withDistance = gigs.map((g) => ({
      ...g,
      distanceKm: g.lat != null && g.lng != null ? haversineKm(originLat!, originLng!, g.lat, g.lng) : null,
    }));
    withDistance.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    return NextResponse.json({ gigs: withDistance });
  }

  // No location available anywhere: fall back to the original "same area"
  // string-match boost, keeping newest-first order within each group.
  if (session) {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: session.userId },
      select: { area: true },
    });
    if (profile?.area) {
      const myArea = profile.area.trim().toLowerCase();
      gigs.sort((a, b) => {
        const aNear = a.area.trim().toLowerCase() === myArea ? 0 : 1;
        const bNear = b.area.trim().toLowerCase() === myArea ? 0 : 1;
        return aNear - bNear;
      });
    }
  }

  return NextResponse.json({ gigs });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole("CLIENT");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = gigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const gig = await prisma.gig.create({
    data: {
      clientId: auth.session.userId,
      ...parsed.data,
    },
  });

  if (!gig.targetWorkerId) {
    await notifyNearbyWorkers(gig);
  }

  return NextResponse.json({ ok: true, gig });
}
