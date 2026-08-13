import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { uploadToStorage } from "@/lib/supabase-storage";
import { ALLOWED_IMAGE_TYPES, validateImageFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  const path = `avatars/${auth.session.userId}-${Date.now()}.${ext}`;
  const avatarUrl = await uploadToStorage("avatars", path, file);

  await prisma.user.update({ where: { id: auth.session.userId }, data: { avatarUrl } });

  return NextResponse.json({ ok: true, avatarUrl });
}
