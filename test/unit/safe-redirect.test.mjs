import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath, sanitizeNextParam } from "../../src/lib/auth/redirect.ts";

describe("safeRedirectPath", () => {
  it("allows valid relative paths within the allowlist", () => {
    assert.equal(safeRedirectPath("/candidate"), "/candidate");
    assert.equal(safeRedirectPath("/candidate/onboarding"), "/candidate/onboarding");
    assert.equal(safeRedirectPath("/recruiter/jobs?status=active"), "/recruiter/jobs?status=active");
    assert.equal(safeRedirectPath("/auth/setup-password?role=candidate&next=%2Fcandidate"), "/auth/setup-password?role=candidate&next=%2Fcandidate");
    assert.equal(safeRedirectPath("/dashboard"), "/dashboard");
  });

  it("rejects open redirects and dangerous protocols, falling back to /dashboard", () => {
    assert.equal(safeRedirectPath("//evil.com"), "/dashboard");
    assert.equal(safeRedirectPath("//evil.com/candidate"), "/dashboard");
    assert.equal(safeRedirectPath("https://evil.com"), "/dashboard");
    assert.equal(safeRedirectPath("javascript:alert(1)"), "/dashboard");
    assert.equal(safeRedirectPath("/candidate\\evil.com"), "/dashboard");
    assert.equal(safeRedirectPath("/unexpected-path"), "/dashboard");
    assert.equal(safeRedirectPath(null), "/dashboard");
    assert.equal(safeRedirectPath(undefined), "/dashboard");
  });
});

describe("sanitizeNextParam", () => {
  it("allows safe relative paths", () => {
    assert.equal(sanitizeNextParam("/candidate"), "/candidate");
    assert.equal(sanitizeNextParam("/recruiter/dashboard"), "/recruiter/dashboard");
  });

  it("returns null for malicious or disallowed next params", () => {
    assert.equal(sanitizeNextParam("//evil.com"), null);
    assert.equal(sanitizeNextParam("https://evil.com"), null);
    assert.equal(sanitizeNextParam("javascript:alert(document.cookie)"), null);
    assert.equal(sanitizeNextParam("/evil-path"), null);
    assert.equal(sanitizeNextParam(null), null);
  });
});
