import { expect, test } from "playwright/test";

test.describe("jobs and assessment smoke coverage", () => {
  test("public jobs discovery exposes a reachable job detail route", async ({ page, request }) => {
    const response = await page.goto("/jobs");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading").first()).toBeVisible();

    const detailLink = page.getByRole("link", { name: /lihat detail/i }).first();
    await expect(detailLink).toBeVisible();
    const detailPath = await detailLink.getAttribute("href");
    expect(detailPath).toMatch(/^\/jobs\/[^/]+$/);

    const detailResponse = await request.get(detailPath!);
    expect(detailResponse.status()).toBe(200);
    await detailLink.click();
    await expect(page).toHaveURL(new RegExp(`${detailPath!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("recruiter and candidate assessment routes respond successfully", async ({ request }) => {
    for (const route of ["/recruiter/assessments", "/candidate/assessments"]) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(200);
    }
  });

  test("notifications require authentication", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("next") === "/notifications");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/notifications");
  });

  test("notification preferences require authentication", async ({ request }) => {
    const response = await request.get("/api/notification-preferences");
    expect([401, 403, 503]).toContain(response.status());
  });

  test("public pages produce no uncaught browser errors", async ({ browser }) => {
    for (const route of ["/", "/jobs", "/pricing"]) {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(`console: ${message.text()}`);
      });

      await page.goto(route);
      await expect(page.locator("#main-content")).toBeVisible();
      expect(errors, route).toEqual([]);
      await page.close();
    }
  });
});
