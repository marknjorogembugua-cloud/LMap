import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import JobDetailView from "./JobDetailView";

type Props = { params: Promise<{ id: string }> };

async function getJob(id: string) {
  return prisma.gig.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      bookings: {
        include: { worker: { select: { id: true, name: true, phone: true } } },
        orderBy: { requestedAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found — LinkMeUp" };

  const title = `${job.title} · ${job.category} — LinkMeUp`;
  const description =
    job.description.length > 160 ? `${job.description.slice(0, 157)}...` : job.description;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);

  return <JobDetailView id={id} initialJob={job} />;
}
