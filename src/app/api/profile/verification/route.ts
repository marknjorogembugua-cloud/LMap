import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { uploadToPrivateStorage } from "@/lib/supabase-storage";
import { ALLOWED_IMAGE_TYPES, validateImageFile } from "@/lib/upload";

const BUCKET = "verifications";

export async function POST(req: NextRequest) {
  const auth = await requireRole("WORKER");
  if ("error" in auth) return auth.error;

  const profile = await prisma.workerProfile.findUnique({ where: { userId: auth.session.userId } });
  if (!profile) {
    return NextResponse.json({ error: "Create a worker profile first" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Upload a photo of your ID" }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  const path = `${profile.id}-${Date.now()}.${ext}`;
  await uploadToPrivateStorage(BUCKET, path, file);

  const updated = await prisma.workerProfile.update({
    where: { id: profile.id },
    data: { idImagePath: path, verificationStatus: "PENDING" },
  });

  return NextResponse.json({ ok: true, verificationStatus: updated.verificationStatus });
}
