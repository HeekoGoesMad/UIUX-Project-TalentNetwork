import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
  detectMime,
  sanitizeAttachmentName,
  validateAttachment,
} from "../../src/lib/messages/validation.ts";

const enc = new TextEncoder();

describe("message attachment validation", () => {
  it("exposes the 5 MB limit and allowlist", () => {
    assert.equal(MAX_ATTACHMENT_BYTES, 5 * 1024 * 1024);
    assert.deepEqual([...ALLOWED_ATTACHMENT_MIME], [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ]);
  });

  it("accepts JPEG magic (FFD8FF)", () => {
    assert.equal(
      detectMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00])),
      "image/jpeg",
    );
  });

  it("accepts PNG magic (89504E47)", () => {
    assert.equal(
      detectMime(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
      "image/png",
    );
  });

  it("accepts GIF magic (474946)", () => {
    assert.equal(
      detectMime(enc.encode("GIF89a....")),
      "image/gif",
    );
  });

  it("accepts WebP magic (RIFF....WEBP)", () => {
    assert.equal(
      detectMime(enc.encode("RIFF\x00\x00\x00\x00WEBP")),
      "image/webp",
    );
  });

  it("accepts PDF magic (%PDF-)", () => {
    assert.equal(
      detectMime(enc.encode("%PDF-1.7....")),
      "application/pdf",
    );
  });

  it("rejects truncated headers", () => {
    assert.equal(detectMime(new Uint8Array([0xff, 0xd8])), null);
    assert.equal(detectMime(new Uint8Array([0x89, 0x50, 0x4e])), null);
    assert.equal(detectMime(enc.encode("RIFF")), null);
    assert.equal(detectMime(enc.encode("%PD")), null);
    assert.equal(detectMime(new Uint8Array([])), null);
  });

  it("rejects text masquerading as jpg", () => {
    const bytes = enc.encode("hello world, not an image");
    assert.equal(detectMime(bytes), null);
    const res = validateAttachment({ bytes, name: "foto.jpg" });
    assert.equal(res.ok, false);
    assert.equal(res.status, 415);
  });

  it("rejects oversize with 413", () => {
    const bytes = new Uint8Array(MAX_ATTACHMENT_BYTES + 1);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff;
    const res = validateAttachment({ bytes, name: "besar.jpg" });
    assert.deepEqual(res, {
      ok: false,
      error: "Ukuran lampiran maksimal 5 MB.",
      status: 413,
    });
  });

  it("rejects unsupported type with 415", () => {
    const res = validateAttachment({
      bytes: enc.encode("plain text file"),
      name: "catatan.txt",
    });
    assert.deepEqual(res, {
      ok: false,
      error:
        "Jenis file tidak didukung. Hanya gambar (JPEG, PNG, GIF, WebP) atau PDF.",
      status: 415,
    });
  });

  it("accepts a valid attachment with mime + size", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]);
    assert.deepEqual(validateAttachment({ bytes, name: "x.png" }), {
      ok: true,
      mime: "image/png",
      sizeBytes: bytes.length,
    });
  });

  it("sanitizes path traversal to basename", () => {
    assert.equal(sanitizeAttachmentName("../../etc/passwd"), "passwd");
    assert.equal(sanitizeAttachmentName("C:\\fakepath\\cv.pdf"), "cv.pdf");
    assert.equal(sanitizeAttachmentName("a/b\\c.png"), "c.png");
  });

  it("falls back to lampiran and truncates to 120 chars", () => {
    assert.equal(sanitizeAttachmentName(""), "lampiran");
    assert.equal(sanitizeAttachmentName("   "), "lampiran");
    assert.equal(sanitizeAttachmentName("a".repeat(200)).length, 120);
  });
});
