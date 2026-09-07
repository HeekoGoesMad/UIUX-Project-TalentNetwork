export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_BANNER_BYTES = 8 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

export function detectImageMime(bytes: Uint8Array): AllowedImageMime | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function validateProfileImage(input: {
  bytes: Uint8Array;
  type: "avatar" | "banner";
}):
  | { ok: true; mime: AllowedImageMime; sizeBytes: number }
  | { ok: false; error: string; status: 413 | 415 } {
  const maxBytes = input.type === "banner" ? MAX_BANNER_BYTES : MAX_AVATAR_BYTES;
  const maxMb = input.type === "banner" ? "8" : "5";

  if (input.bytes.length > maxBytes) {
    return {
      ok: false,
      error: `Ukuran foto ${input.type === "banner" ? "banner" : "profil"} maksimal ${maxMb} MB.`,
      status: 413,
    };
  }

  const mime = detectImageMime(input.bytes);
  if (!mime) {
    return {
      ok: false,
      error: "Jenis file tidak didukung. Hanya gambar (JPEG, PNG, GIF, WebP).",
      status: 415,
    };
  }

  return { ok: true, mime, sizeBytes: input.bytes.length };
}

export function sanitizeMediaName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (clean.length === 0) return "media";
  return clean.slice(0, 100);
}
