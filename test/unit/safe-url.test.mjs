import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeUrl } from "../../src/lib/cv/templates.ts";

describe("safeUrl", () => {
  it("passes through http/https/mailto/relative URLs (trimmed)", () => {
    assert.equal(safeUrl("https://example.com/cv"), "https://example.com/cv");
    assert.equal(safeUrl("  https://example.com  "), "https://example.com");
    assert.equal(safeUrl("mailto:a@b.co"), "mailto:a@b.co");
    assert.equal(safeUrl("/talent/123"), "/talent/123");
  });

  it("falls back to # for javascript:, protocol-relative, and bare strings", () => {
    assert.equal(safeUrl("javascript:alert(1)"), "#");
    assert.equal(safeUrl("//evil.com/x"), "#");
    assert.equal(safeUrl("notaurl"), "#");
  });
});
