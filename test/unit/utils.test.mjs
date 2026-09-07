import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { UUID_RE, cn } from "../../src/lib/utils.ts";

describe("UUID_RE", () => {
  it("accepts canonical v1–v5 UUIDs", () => {
    assert.equal(UUID_RE.test("123e4567-e89b-42d3-a456-426614174000"), true);
    assert.equal(UUID_RE.test("123e4567-e89b-12d3-a456-426614174000"), true);
  });

  it("rejects non-UUIDs, bad versions, and bad variants", () => {
    assert.equal(UUID_RE.test("not-a-uuid"), false);
    assert.equal(UUID_RE.test("123e4567-e89b-02d3-a456-426614174000"), false); // version 0
    assert.equal(UUID_RE.test("123e4567-e89b-42d3-c456-426614174000"), false); // variant c
  });
});

describe("cn", () => {
  it("merges classes and dedups conflicting Tailwind utilities", () => {
    assert.equal(cn("px-2 px-4"), "px-4");
    assert.equal(cn("a", "b"), "a b");
  });
});
