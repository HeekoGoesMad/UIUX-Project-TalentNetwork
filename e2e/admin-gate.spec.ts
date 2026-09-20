import { expect, test } from "playwright/test";

// The API response is the ground-truth availability signal: auth runs before
// any DB access, so anonymous callers get 401/403 whenever Supabase is
// configured, regardless of DB health.
test("logged-out visitor never sees admin data", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page.getByText(/memverifikasi (otoritas|akses) admin/i).first()).toBeVisible();
  const probe = await request.get("/api/admin/dashboard");
  const dashboardHeading = page.getByRole("heading", { name: /metrik utama|ikhtisar operasional/i });
  if (probe.status() === 401 || probe.status() === 403) {
    const code = probe.status();
    const label = new RegExp(`(Error|Akses Ditolak [·•] Kode) ${code}`, "i");
    await expect(page.getByText(label).first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4000);
    await expect(page.getByText(label).first()).toBeVisible();
    await expect(dashboardHeading).toHaveCount(0);
  } else {
    await expect(dashboardHeading.first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4000);
    await expect(dashboardHeading.first()).toBeVisible();
  }
});

test("admin dashboard API never serves anonymous callers", async ({ request }) => {
  const res = await request.get("/api/admin/dashboard");
  // 401 with Supabase configured, 500+errorId without — but never 200+data.
  expect(res.status()).not.toBe(200);
  const body = (await res.json()) as { error?: string; errorId?: string; metrics?: unknown };
  expect(body.error).toBeTruthy();
  expect(body.metrics).toBeUndefined();
  if (res.status() === 500) expect(body.errorId).toBeTruthy();
});
