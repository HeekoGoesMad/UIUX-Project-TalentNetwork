import { describe, it } from "node:test";
import assert from "node:assert/strict";

const VALID_STAGES = [
  "new",
  "shortlisted",
  "consent_requested",
  "consent_approved",
  "screening",
  "assessment",
  "review",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
];

const RECRUITER_TRANSITIONS = {
  new: ["shortlisted", "rejected"],
  shortlisted: ["consent_requested", "screening", "rejected"],
  consent_requested: ["consent_approved", "rejected"],
  consent_approved: ["screening", "rejected"],
  screening: ["assessment", "review", "interview", "rejected"],
  assessment: ["review", "interview", "rejected"],
  review: ["interview", "offer", "rejected"],
  interview: ["offer", "hired", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

function canTransitionStage(currentStage, targetStage) {
  if (!VALID_STAGES.includes(currentStage) || !VALID_STAGES.includes(targetStage)) {
    return false;
  }
  const allowed = RECRUITER_TRANSITIONS[currentStage] ?? [];
  return allowed.includes(targetStage);
}

function validateOfferTerms(terms) {
  if (!terms || typeof terms !== "object") return { valid: false, error: "Terms must be an object" };
  const salary = (terms.salary || "").trim();
  if (!salary) return { valid: false, error: "Salary is required" };
  return { valid: true };
}

function validateInterviewSchedule(schedule) {
  if (!schedule || typeof schedule !== "object") return { valid: false, error: "Schedule must be an object" };
  if (!schedule.applicationId) return { valid: false, error: "applicationId is required" };
  if (!schedule.title || schedule.title.trim().length < 3) return { valid: false, error: "Title must be at least 3 chars" };
  const parsedDate = Date.parse(schedule.scheduledAt);
  if (isNaN(parsedDate)) return { valid: false, error: "Invalid scheduledAt" };
  return { valid: true };
}

describe("Recruiter Hiring Stage Transitions & Validations", () => {
  it("allows transition from screening to interview", () => {
    assert.equal(canTransitionStage("screening", "interview"), true);
  });

  it("allows transition from interview to offer", () => {
    assert.equal(canTransitionStage("interview", "offer"), true);
  });

  it("allows transition from interview directly to hired (Dover-style)", () => {
    assert.equal(canTransitionStage("interview", "hired"), true);
  });

  it("allows transition from offer to hired", () => {
    assert.equal(canTransitionStage("offer", "hired"), true);
  });

  it("blocks transition from hired to screening", () => {
    assert.equal(canTransitionStage("hired", "screening"), false);
  });

  it("blocks transition from rejected to offer", () => {
    assert.equal(canTransitionStage("rejected", "offer"), false);
  });

  it("validates offer terms correctly", () => {
    assert.equal(validateOfferTerms({ salary: "Rp 25.000.000 / bulan" }).valid, true);
    assert.equal(validateOfferTerms({ salary: "" }).valid, false);
    assert.equal(validateOfferTerms(null).valid, false);
  });

  it("validates interview schedule parameters", () => {
    assert.equal(
      validateInterviewSchedule({
        applicationId: "e903d6d0-990a-42a1-b841-37f2a1ebf2a7",
        title: "Technical Interview",
        scheduledAt: "2026-09-15T10:00:00.000Z",
      }).valid,
      true
    );

    assert.equal(
      validateInterviewSchedule({
        applicationId: "",
        title: "Technical Interview",
        scheduledAt: "2026-09-15T10:00:00.000Z",
      }).valid,
      false
    );

    assert.equal(
      validateInterviewSchedule({
        applicationId: "e903d6d0-990a-42a1-b841-37f2a1ebf2a7",
        title: "Hi",
        scheduledAt: "2026-09-15T10:00:00.000Z",
      }).valid,
      false
    );
  });
});
