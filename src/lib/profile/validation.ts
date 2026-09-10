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

/**
 * Safely extracts the internal object key from a Supabase storage URL or relative path.
 * Returns null if the URL belongs to an external provider (e.g. Unsplash) or is invalid.
 */
export function extractStorageKey(
  urlOrPath: string | null | undefined,
  bucketName: string = "profile-media"
): string | null {
  if (!urlOrPath || typeof urlOrPath !== "string") return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  // Ignore mock, demo, or external URLs
  if (trimmed.startsWith("development-mock/")) return null;
  if (
    trimmed.includes("images.unsplash.com") ||
    trimmed.includes("api.dicebear.com") ||
    trimmed.startsWith("data:")
  ) {
    return null;
  }

  // Check if it's a Supabase public object URL: .../storage/v1/object/public/<bucket>/<key>
  const publicMarker = `/storage/v1/object/public/${bucketName}/`;
  const publicIdx = trimmed.indexOf(publicMarker);
  if (publicIdx !== -1) {
    const key = trimmed.slice(publicIdx + publicMarker.length).split("?")[0]?.trim();
    return key && key.length > 0 ? decodeURIComponent(key) : null;
  }

  // Check if it starts with `<bucketName>/`
  if (trimmed.startsWith(`${bucketName}/`)) {
    const key = trimmed.slice(bucketName.length + 1).split("?")[0]?.trim();
    return key && key.length > 0 ? decodeURIComponent(key) : null;
  }

  // Check if it starts directly with folder prefixes avatars/ or banners/
  if (trimmed.startsWith("avatars/") || trimmed.startsWith("banners/")) {
    const key = trimmed.split("?")[0]?.trim();
    return key && key.length > 0 ? decodeURIComponent(key) : null;
  }

  return null;
}

