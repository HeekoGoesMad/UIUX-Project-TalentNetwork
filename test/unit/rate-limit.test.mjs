import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enforceRateLimit } from "../../src/lib/api/rate-limit.ts";

describe("enforceRateLimit", () => {
  it("allows up to the limit, then blocks with a positive retryAfter", () => {
    const key = `unit-allow-${crypto.randomUUID()}`;
    assert.equal(enforceRateLimit(key, 2, 60_000).allowed, true);
    assert.equal(enforceRateLimit(key, 2, 60_000).allowed, true);
    const blocked = enforceRateLimit(key, 2, 60_000);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds >= 1);
  });

  it("isolates buckets per key", () => {
    const a = `unit-iso-a-${crypto.randomUUID()}`;
    const b = `unit-iso-b-${crypto.randomUUID()}`;
    enforceRateLimit(a, 1, 60_000);
    assert.equal(enforceRateLimit(a, 1, 60_000).allowed, false);
    assert.equal(enforceRateLimit(b, 1, 60_000).allowed, true);
  });

  it("resets the bucket after the window expires", async () => {
    const key = `unit-window-${crypto.randomUUID()}`;
    assert.equal(enforceRateLimit(key, 1, 30).allowed, true);
    assert.equal(enforceRateLimit(key, 1, 30).allowed, false);
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(enforceRateLimit(key, 1, 30).allowed, true);
  });
});
