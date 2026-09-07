export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedAttachmentMime = (typeof ALLOWED_ATTACHMENT_MIME)[number];

export function detectMime(bytes: Uint8Array): AllowedAttachmentMime | null {
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
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return "application/pdf";
  }
  return null;
}

export function validateAttachment(input: {
  bytes: Uint8Array;
  name: string;
}):
  | { ok: true; mime: AllowedAttachmentMime; sizeBytes: number }
  | { ok: false; error: string; status: 413 | 415 } {
  const { bytes } = input;
  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: "Ukuran lampiran maksimal 5 MB.", status: 413 };
  }
  const mime = detectMime(bytes);
  if (mime === null) {
    return {
      ok: false,
      error:
        "Jenis file tidak didukung. Hanya gambar (JPEG, PNG, GIF, WebP) atau PDF.",
      status: 415,
    };
  }
  return { ok: true, mime, sizeBytes: bytes.length };
}

export function sanitizeAttachmentName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\x00-\x1f\x7f]/g, "").trim();
  if (clean.length === 0) {
    return "lampiran";
  }
  return clean.slice(0, 120);
}
