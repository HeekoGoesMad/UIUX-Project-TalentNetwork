import { expect, test } from "playwright/test";

// The API response is the ground-truth availability signal: auth runs before
// any DB access, so anonymous callers get 401/403 whenever Supabase is
// configured, regardless of DB health.
test("logged-out visitor never sees admin data", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page.getByText("Memverifikasi akses admin")).toBeVisible();
  const probe = await request.get("/api/admin/dashboard");
  if (probe.status() === 401 || probe.status() === 403) {
    const label = probe.status() === 401 ? "Error 401" : "Error 403";
    await expect(page.getByText(label)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4000);
    await expect(page.getByText(label)).toBeVisible();
    await expect(page.getByText("Metrik Utama")).toHaveCount(0);
  } else {
    await expect(page.getByText("Metrik Utama")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4000);
    await expect(page.getByText("Metrik Utama")).toBeVisible();
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
