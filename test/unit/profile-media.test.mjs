import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_AVATAR_BYTES,
  MAX_BANNER_BYTES,
  detectImageMime,
  validateProfileImage,
  sanitizeMediaName,
  extractStorageKey,
} from "../../src/lib/profile/validation.ts";

test("profile media validation", async (t) => {
  await t.test("exposes avatar and banner byte limits", () => {
    assert.equal(MAX_AVATAR_BYTES, 5 * 1024 * 1024);
    assert.equal(MAX_BANNER_BYTES, 8 * 1024 * 1024);
  });

  await t.test("accepts JPEG magic (FFD8FF)", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(detectImageMime(bytes), "image/jpeg");
  });

  await t.test("accepts PNG magic (89504E47)", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    assert.equal(detectImageMime(bytes), "image/png");
  });

  await t.test("accepts GIF magic (474946)", () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    assert.equal(detectImageMime(bytes), "image/gif");
  });

  await t.test("accepts WebP magic (RIFF....WEBP)", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    assert.equal(detectImageMime(bytes), "image/webp");
  });

  await t.test("rejects non-image bytes (e.g. PDF)", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    assert.equal(detectImageMime(bytes), null);
  });

  await t.test("enforces avatar size limit (5 MB)", () => {
    const oversize = new Uint8Array(MAX_AVATAR_BYTES + 1);
    oversize.set([0xff, 0xd8, 0xff]);
    const res = validateProfileImage({ bytes: oversize, type: "avatar" });
    assert.equal(res.ok, false);
    assert.equal(res.status, 413);
  });

  await t.test("enforces banner size limit (8 MB)", () => {
    const oversize = new Uint8Array(MAX_BANNER_BYTES + 1);
    oversize.set([0xff, 0xd8, 0xff]);
    const res = validateProfileImage({ bytes: oversize, type: "banner" });
    assert.equal(res.ok, false);
    assert.equal(res.status, 413);
  });

  await t.test("valid image passes validation", () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = validateProfileImage({ bytes, type: "avatar" });
    assert.equal(res.ok, true);
    if (res.ok) {
      assert.equal(res.mime, "image/png");
      assert.equal(res.sizeBytes, bytes.length);
    }
  });

  await t.test("sanitizes file names against path traversal", () => {
    assert.equal(sanitizeMediaName("../../../etc/passwd.png"), "passwd.png");
    assert.equal(sanitizeMediaName("C:\\fakepath\\my-photo.jpg"), "my-photo.jpg");
    assert.equal(sanitizeMediaName(""), "media");
  });

  await t.test("extracts storage key correctly and safely", () => {
    const fullUrl =
      "https://example.supabase.co/storage/v1/object/public/profile-media/avatars/user-123/uuid-photo.webp";
    assert.equal(extractStorageKey(fullUrl), "avatars/user-123/uuid-photo.webp");

    const queryUrl =
      "https://example.supabase.co/storage/v1/object/public/profile-media/banners/user-123/banner.jpg?t=123456";
    assert.equal(extractStorageKey(queryUrl), "banners/user-123/banner.jpg");

    const bucketPath = "profile-media/avatars/user-123/uuid-photo.webp";
    assert.equal(extractStorageKey(bucketPath), "avatars/user-123/uuid-photo.webp");

    const relativePath = "avatars/user-123/uuid-photo.webp";
    assert.equal(extractStorageKey(relativePath), "avatars/user-123/uuid-photo.webp");

    // Non-supabase or external URLs should safely return null
    assert.equal(
      extractStorageKey(
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
      ),
      null
    );
    assert.equal(extractStorageKey("development-mock/avatars/test.jpg"), null);
    assert.equal(extractStorageKey(""), null);
    assert.equal(extractStorageKey(null), null);
    assert.equal(extractStorageKey(undefined), null);
  });
});

