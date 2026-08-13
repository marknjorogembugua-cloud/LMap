import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { certificationSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/supabase-storage";
import { ALLOWED_IMAGE_TYPES, validateImageFile } from "@/lib/upload";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const profile = await prisma.workerProfile.findUnique({
    where: { userId: auth.session.userId },
    include: { certifications: { orderBy: [{ year: "desc" }, { createdAt: "desc" }] } },
  });

  return NextResponse.json({ certifications: profile?.certifications ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const profile = await prisma.workerProfile.findUnique({ where: { userId: auth.session.userId } });
  if (!profile) {
    return NextResponse.json({ error: "Create a worker profile first" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const yearRaw = form.get("year");
  const parsed = certificationSchema.safeParse({
    title: form.get("title"),
    institution: form.get("institution") || undefined,
    year: yearRaw ? Number(yearRaw) : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  let imageUrl: string | undefined;
  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    const path = `certificates/${profile.id}-${Date.now()}.${ext}`;
    imageUrl = await uploadToStorage("certificates", path, file);
  }

  const certification = await prisma.certification.create({
    data: { workerProfileId: profile.id, ...parsed.data, imageUrl },
  });

  return NextResponse.json({ ok: true, certification });
}
