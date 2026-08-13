export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES[file.type]) return "Only JPEG, PNG, or WEBP images are allowed";
  if (file.size > MAX_IMAGE_SIZE) return "Image must be 5MB or smaller";
  return null;
}
