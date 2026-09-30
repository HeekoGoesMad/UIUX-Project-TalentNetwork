import { expect, test } from "playwright/test";

test.describe("Candidate Application Pipeline - Source-aware Stepper", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
      {
        name: "proofylink-demo-session-role",
        value: "candidate",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.addInitScript(() => {
      localStorage.setItem(
        "proofylink-demo-session-v1",
        JSON.stringify({
          role: "candidate",
          email: "candidate@demo.com",
          name: "Nadia Putri Rahayu",
          hasSubmittedOnboarding: true,
          provisioningStatus: "active",
        })
      );
    });
  });

  test("recruiter-initiated application displays dynamic box 1 'Terhubung via Talent Network'", async ({ page }) => {
    await page.goto("/candidate/applications/demo-app-004");
    await expect(page.locator("#main-content")).toBeVisible();

    // Check Recruiter Initiative Badge
    await expect(page.getByText(/Inisiatif Rekruter • Talent Network/i)).toBeVisible();

    // Check date text indicates connected rather than submitted
    await expect(page.getByText(/Terhubung pada/i)).toBeVisible();

    // Check transparency banner title
    await expect(page.getByText(/Profil Anda Dipilih Langsung Melalui Talent Network/i)).toBeVisible();

    // Check Subtitle in Pipeline
    await expect(
      page.getByText(/Perjalanan proses seleksi inisiatif rekruter bersama PT Bukalapak.com Tbk/i)
    ).toBeVisible();

    // Check Step 1 Title and Description
    await expect(page.getByText("Terhubung via Talent Network")).toBeVisible();
    await expect(
      page.getByText("Profil Anda dipilih langsung oleh rekruter melalui pencarian Talent Network")
    ).toBeVisible();

    // Box 4 'Surat Penawaran' should be active
    await expect(page.getByText("Surat Penawaran", { exact: true })).toBeVisible();
    await expect(page.getByText("Tahap Aktif")).toBeVisible();
  });

  test("self-applied application maintains standard box 1 'Lamaran Terkirim'", async ({ page }) => {
    await page.goto("/candidate/applications/demo-app-001");
    await expect(page.locator("#main-content")).toBeVisible();

    // Check self-applied date text indicates sent (use first() as it appears in summary and stage history)
    await expect(page.getByText(/Dikirim pada/i).first()).toBeVisible();

    // Check Subtitle in Pipeline for standard flow
    await expect(
      page.getByText(/Perjalanan tahapan rekrutmen Anda bersama PT Fintek Karya Nusantara/i)
    ).toBeVisible();

    // Check Step 1 Title and Description
    await expect(page.getByText("Lamaran Terkirim")).toBeVisible();
    await expect(
      page.getByText("Berkas lamaran diterima di antrean inbound seleksi")
    ).toBeVisible();
  });

  test("candidate applications list displays 'Inisiatif Rekruter' badge for sourced applications", async ({ page }) => {
    await page.goto("/candidate/applications");
    await expect(page.locator("#main-content")).toBeVisible();

    // Check that LinkAja (self-applied) has "Dikirim" date on page 1
    await expect(page.getByText(/Dikirim 14 Sep 2026/i)).toBeVisible();

    // Filter to 'Penawaran' tab where Bukalapak (offer status, recruiter invitation) is listed
    await page.getByRole("button", { name: /Penawaran/i }).click();

    // Check that Bukalapak (recruiter invitation) has the badge and "Terhubung" date
    await expect(page.getByText("Inisiatif Rekruter")).toBeVisible();
    await expect(page.getByText(/Terhubung 1 Sep 2026/i)).toBeVisible();
  });
});
