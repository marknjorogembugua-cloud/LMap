import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/generated/prisma/client";
import { haversineKm } from "@/lib/geo";
import { sendPushToUser } from "@/lib/push-server";

export const NEARBY_RADIUS_KM = 15;
export const NEARBY_NOTIFY_CAP = 20;

export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityUrl: string;
  gigId?: string;
  bookingId?: string;
}) {
  try {
    await prisma.notification.create({ data: input });
  } catch (err) {
    console.error("notify failed", err);
    return;
  }

  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    url: input.entityUrl,
  });
}

export async function notifyNearbyWorkers(gig: {
  id: string;
  title: string;
  category: string;
  area: string;
  lat: number | null;
  lng: number | null;
}) {
  if (gig.lat == null || gig.lng == null) return;

  // Free-text categories rarely match exactly, so this is a best-effort
  // substring match rather than the precise equality an enum allowed.
  const candidates = await prisma.workerProfile.findMany({
    where: {
      category: { contains: gig.category, mode: "insensitive" },
      availability: "AVAILABLE",
      lat: { not: null },
      lng: { not: null },
    },
    select: { userId: true, lat: true, lng: true },
  });

  const nearby = candidates
    .map((w) => ({ ...w, distanceKm: haversineKm(gig.lat!, gig.lng!, w.lat!, w.lng!) }))
    .filter((w) => w.distanceKm <= NEARBY_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, NEARBY_NOTIFY_CAP);

  await Promise.all(
    nearby.map((w) =>
      notify({
        userId: w.userId,
        type: "GIG_NEARBY",
        title: "New job near you",
        body: `${gig.title} · ${gig.area}`,
        entityUrl: `/jobs/${gig.id}`,
        gigId: gig.id,
      })
    )
  );
}
