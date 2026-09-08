import { describe, it } from "node:test";
import assert from "node:assert/strict";

const CONFIRMATION_PHRASE = "HAPUS AKUN SAYA";

function validateDeletionConfirmation(input, userEmail, acknowledged) {
  if (!acknowledged) {
    return { valid: false, reason: "Acknowledgment required" };
  }

  const clean = (input || "").trim();
  if (!clean) {
    return { valid: false, reason: "Empty phrase" };
  }

  const matchesPhrase = clean.toUpperCase() === CONFIRMATION_PHRASE;
  const matchesEmail = Boolean(userEmail && clean.toLowerCase() === userEmail.trim().toLowerCase());

  if (!matchesPhrase && !matchesEmail) {
    return { valid: false, reason: "Mismatched confirmation phrase" };
  }

  return { valid: true };
}

describe("Candidate Account Deletion Confirmation Validation", () => {
  const email = "candidate@proofylink.com";

  it("accepts exact uppercase confirmation phrase", () => {
    const res = validateDeletionConfirmation("HAPUS AKUN SAYA", email, true);
    assert.equal(res.valid, true);
  });

  it("accepts lowercase or mixed-case trimmed confirmation phrase", () => {
    const res = validateDeletionConfirmation("  hapus akun saya  ", email, true);
    assert.equal(res.valid, true);
  });

  it("accepts candidate registered email address", () => {
    const res = validateDeletionConfirmation("candidate@proofylink.com", email, true);
    assert.equal(res.valid, true);
  });

  it("accepts candidate email with mixed case and whitespace", () => {
    const res = validateDeletionConfirmation("  CANDIDATE@proofylink.com ", email, true);
    assert.equal(res.valid, true);
  });

  it("rejects mismatched phrase or wrong email", () => {
    const res1 = validateDeletionConfirmation("HAPUS AKUN", email, true);
    assert.equal(res1.valid, false);

    const res2 = validateDeletionConfirmation("other@example.com", email, true);
    assert.equal(res2.valid, false);

    const res3 = validateDeletionConfirmation("", email, true);
    assert.equal(res3.valid, false);
  });

  it("rejects if acknowledged is false even with correct phrase", () => {
    const res = validateDeletionConfirmation("HAPUS AKUN SAYA", email, false);
    assert.equal(res.valid, false);
    assert.equal(res.reason, "Acknowledgment required");
  });
});
