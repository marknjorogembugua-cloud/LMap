import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

export async function uploadToStorage(bucket: string, path: string, file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// For content that must never be publicly reachable (e.g. ID documents):
// uploads into a private bucket and returns the storage path, not a URL.
// Creating the bucket here (idempotently) means there's no manual Supabase
// dashboard step required to use this.
async function ensurePrivateBucket(bucket: string) {
  const { error } = await supabase.storage.createBucket(bucket, { public: false });
  if (error && !/already exists/i.test(error.message)) throw new Error(error.message);
}

export async function uploadToPrivateStorage(bucket: string, path: string, file: File): Promise<string> {
  await ensurePrivateBucket(bucket);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

export async function getSignedStorageUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 300
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}
