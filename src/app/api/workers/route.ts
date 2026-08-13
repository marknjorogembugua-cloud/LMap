import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm, parseCoord } from "@/lib/geo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const county = searchParams.get("county");
  const area = searchParams.get("area");
  const originLat = parseCoord(searchParams.get("lat"));
  const originLng = parseCoord(searchParams.get("lng"));

  const workers = await prisma.workerProfile.findMany({
    where: {
      ...(category ? { category: { contains: category, mode: "insensitive" as const } } : {}),
      ...(county ? { county } : {}),
      ...(area ? { area: { contains: area, mode: "insensitive" } } : {}),
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true, phone: true } } },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  if (originLat !== null && originLng !== null) {
    const withDistance = workers.map((w) => ({
      ...w,
      distanceKm: w.lat != null && w.lng != null ? haversineKm(originLat, originLng, w.lat, w.lng) : null,
    }));
    withDistance.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    return NextResponse.json({ workers: withDistance });
  }

  return NextResponse.json({ workers });
}
