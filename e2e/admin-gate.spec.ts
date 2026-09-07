import { expect, test } from "playwright/test";

// Regression: the layout gate's 3s timer must not clobber a denial recorded
// by a page-level 401/403. Logged-out visitors stay on the denied popup.
test("logged-out visitor stays on the denied popup past the ceremony", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("Memverifikasi akses admin")).toBeVisible();
  await expect(page.getByText("Error 401")).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(4000);
  await expect(page.getByText("Error 401")).toBeVisible();
  await expect(page.getByText("Metrik Utama")).toHaveCount(0);
});

test("admin dashboard API rejects anonymous callers", async ({ request }) => {
  const res = await request.get("/api/admin/dashboard");
  expect(res.status()).toBe(401);
});
