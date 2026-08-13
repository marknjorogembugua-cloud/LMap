import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import WorkerDetailView from "./WorkerDetailView";

type Props = { params: Promise<{ id: string }> };

async function getWorker(id: string) {
  return prisma.workerProfile.findUnique({
    where: { userId: id },
    include: {
      certifications: { orderBy: [{ year: "desc" }, { createdAt: "desc" }] },
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          phone: true,
          reviewsReceived: {
            include: { reviewer: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const worker = await getWorker(id);
  if (!worker) return { title: "Worker not found — LinkMeApp" };

  const name = worker.user.name ?? "A LinkMeApp worker";
  const title = `${name} · ${worker.category} — LinkMeApp`;
  const description =
    worker.bio?.trim() ||
    `${worker.category} in ${worker.area}, ${worker.county}${
      worker.ratingCount ? ` · ${worker.ratingAvg.toFixed(1)}★ (${worker.ratingCount} reviews)` : ""
    }`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default async function WorkerDetailPage({ params }: Props) {
  const { id } = await params;
  const worker = await getWorker(id);

  return <WorkerDetailView id={id} initialWorker={worker} />;
}
