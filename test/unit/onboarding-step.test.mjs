import test from "node:test";
import assert from "node:assert/strict";

import { getFirstIncompleteStep } from "../../src/lib/candidate/onboarding-step.ts";

test("getFirstIncompleteStep logic", async (t) => {
  await t.test("returns 0 for empty or null data", () => {
    assert.equal(getFirstIncompleteStep(null), 0);
    assert.equal(getFirstIncompleteStep(undefined), 0);
  });

  await t.test("returns 2 if basic information is incomplete", () => {
    assert.equal(
      getFirstIncompleteStep({
        fullName: "",
        email: "candidate@example.com",
        phone: "0812345678",
        headline: "Frontend Dev",
        about: "Tentang saya",
      }),
      2
    );

    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi",
        email: "budi@example.com",
        phone: "",
        headline: "Frontend Dev",
        about: "Tentang saya",
      }),
      2
    );

    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "",
        about: "Tentang saya",
      }),
      2
    );
  });

  await t.test("returns 3 if location or target role is missing", () => {
    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "Senior Frontend Engineer",
        about: "Engineer berpengalaman 5 tahun.",
        location: "",
        targetRole: "Frontend Lead",
      }),
      3
    );

    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "Senior Frontend Engineer",
        about: "Engineer berpengalaman 5 tahun.",
        location: "Jakarta",
        targetRole: "",
      }),
      3
    );
  });

  await t.test("returns 4 if experience is missing or empty", () => {
    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "Senior Frontend Engineer",
        about: "Engineer berpengalaman 5 tahun.",
        location: "Jakarta",
        targetRole: "Frontend Lead",
        experience: [],
      }),
      4
    );
  });

  await t.test("returns 5 if education is missing or invalid", () => {
    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "Senior Frontend Engineer",
        about: "Engineer berpengalaman 5 tahun.",
        location: "Jakarta",
        targetRole: "Frontend Lead",
        experience: [{ company: "Tech Corp", role: "Software Engineer" }],
        education: [],
      }),
      5
    );
  });

  await t.test("returns 6 if skills count is less than 3", () => {
    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "Senior Frontend Engineer",
        about: "Engineer berpengalaman 5 tahun.",
        location: "Jakarta",
        targetRole: "Frontend Lead",
        experience: [{ company: "Tech Corp", role: "Software Engineer" }],
        education: [{ school: "Universitas Indonesia", program: "Ilmu Komputer" }],
        skills: ["React", "TypeScript"],
      }),
      6
    );
  });

  await t.test("returns 8 (Review & Publish) when all required steps are complete", () => {
    assert.equal(
      getFirstIncompleteStep({
        fullName: "Budi Santoso",
        email: "budi@example.com",
        phone: "0812345678",
        headline: "Senior Frontend Engineer",
        about: "Engineer berpengalaman 5 tahun.",
        location: "Jakarta",
        targetRole: "Frontend Lead",
        experience: [{ company: "Tech Corp", role: "Software Engineer" }],
        education: [{ school: "Universitas Indonesia", program: "Ilmu Komputer" }],
        skills: ["React", "TypeScript", "Next.js"],
      }),
      8
    );
  });
});
