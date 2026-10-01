import { describe, it } from "node:test";
import assert from "node:assert/strict";

const JOB_STATUS_TRANSITIONS = {
  draft: ["published", "closed", "archived"],
  published: ["closed", "archived"],
  closed: ["published", "archived"],
  archived: ["draft", "published"],
};

function canTransitionJobStatus(currentStatus, targetStatus) {
  const allowed = JOB_STATUS_TRANSITIONS[currentStatus] ?? [];
  return allowed.includes(targetStatus);
}

function computeJobExpiration(publishedAt, customExpiresAt) {
  if (customExpiresAt) return new Date(customExpiresAt);
  const pubDate = publishedAt ? new Date(publishedAt) : new Date();
  return new Date(pubDate.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function checkJobAutoClose(job, now = new Date()) {
  if (job.status === "published" && job.expiresAt && new Date(job.expiresAt) <= now) {
    return {
      ...job,
      status: "closed",
      closedAt: job.expiresAt,
    };
  }
  return job;
}

function simulateRepublishJob(oldJob, existingCandidates = []) {
  if (oldJob.status !== "closed" && oldJob.status !== "archived") {
    throw new Error("Only closed or archived jobs can be republished");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1. Old job archived
  const archivedOldJob = {
    ...oldJob,
    status: "archived",
    updatedAt: now.toISOString(),
  };

  // 2. Candidates moved to Talent Pool
  const migratedCandidates = existingCandidates.map((c) => ({
    ...c,
    jobId: "talent-pool",
    jobTitle: "Talent Pool",
    movedToTalentPoolReason: `Migrated from republished job: ${oldJob.title}`,
  }));

  // 3. Cloned job with same title, published status, new 30-day window, 0 applicants
  const newJob = {
    ...oldJob,
    id: `cloned-job-${Date.now()}`,
    title: oldJob.title, // Keep same title as confirmed by user
    status: "published",
    publishedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    closedAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    applicantCount: 0,
  };

  return {
    archivedOldJob,
    newJob,
    migratedCandidates,
  };
}

describe("Job Lifecycle, Auto-Close & Republish", () => {
  describe("Job Status Transitions", () => {
    it("allows draft to transition to published, closed, or archived", () => {
      assert.equal(canTransitionJobStatus("draft", "published"), true);
      assert.equal(canTransitionJobStatus("draft", "closed"), true);
      assert.equal(canTransitionJobStatus("draft", "archived"), true);
    });

    it("allows published to transition to closed or archived", () => {
      assert.equal(canTransitionJobStatus("published", "closed"), true);
      assert.equal(canTransitionJobStatus("published", "archived"), true);
      assert.equal(canTransitionJobStatus("published", "draft"), false);
    });

    it("allows closed to transition to published (extend) or archived", () => {
      assert.equal(canTransitionJobStatus("closed", "published"), true);
      assert.equal(canTransitionJobStatus("closed", "archived"), true);
    });

    it("allows archived to be republished or returned to draft", () => {
      assert.equal(canTransitionJobStatus("archived", "published"), true);
      assert.equal(canTransitionJobStatus("archived", "draft"), true);
      assert.equal(canTransitionJobStatus("archived", "closed"), false);
    });
  });

  describe("Job Expiration & Auto-Close", () => {
    it("defaults expiration to exactly 30 days after publish date", () => {
      const pubDate = new Date("2026-10-01T00:00:00Z");
      const expiresAt = computeJobExpiration(pubDate);
      const diffDays = (expiresAt.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
      assert.equal(diffDays, 30);
    });

    it("auto-closes a published job when expiresAt has passed", () => {
      const expiredJob = {
        id: "job-1",
        title: "Frontend Developer",
        status: "published",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      const result = checkJobAutoClose(expiredJob);
      assert.equal(result.status, "closed");
      assert.equal(result.closedAt, expiredJob.expiresAt);
    });

    it("keeps job published if expiresAt is still in the future", () => {
      const activeJob = {
        id: "job-2",
        title: "Backend Engineer",
        status: "published",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days left
      };
      const result = checkJobAutoClose(activeJob);
      assert.equal(result.status, "published");
    });
  });

  describe("Republish Workflow (Batch Baru)", () => {
    it("fails to republish if job is currently active/published", () => {
      const activeJob = { id: "job-active", title: "QA Engineer", status: "published" };
      assert.throws(() => simulateRepublishJob(activeJob), /Only closed or archived/);
    });

    it("correctly archives old job, moves applicants to Talent Pool, and produces new published job with identical title", () => {
      const closedJob = {
        id: "job-closed-1",
        title: "UI/UX Designer",
        status: "closed",
        description: "Designing user interfaces",
        vacanciesCount: 2,
      };

      const existingApplicants = [
        { id: "cand-1", name: "Kandidat A", jobId: "job-closed-1" },
        { id: "cand-2", name: "Kandidat B", jobId: "job-closed-1" },
      ];

      const result = simulateRepublishJob(closedJob, existingApplicants);

      // Verify old job archived
      assert.equal(result.archivedOldJob.status, "archived");

      // Verify candidates migrated to Talent Pool safely
      assert.equal(result.migratedCandidates.length, 2);
      assert.equal(result.migratedCandidates[0].jobId, "talent-pool");
      assert.equal(result.migratedCandidates[0].jobTitle, "Talent Pool");

      // Verify new job properties
      assert.notEqual(result.newJob.id, closedJob.id);
      assert.equal(result.newJob.title, "UI/UX Designer"); // Identical title
      assert.equal(result.newJob.status, "published");
      assert.equal(result.newJob.applicantCount, 0); // Fresh pipeline
      assert.equal(result.newJob.closedAt, null);

      // Verify new job expiration is ~30 days in the future
      const newExp = new Date(result.newJob.expiresAt);
      const now = new Date();
      const diffDays = Math.round((newExp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      assert.equal(diffDays, 30);
    });
  });
});
