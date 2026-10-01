import { expect, test } from "playwright/test";

test.describe("job republish and lifecycle e2e", () => {
  test("republish API endpoint requires recruiter authentication", async ({ request }) => {
    const fakeId = "00000000-0000-0000-0000-000000000001";
    const response = await request.post(`/api/jobs/${fakeId}/republish`);
    expect([401, 403, 500, 503]).toContain(response.status());
  });

  test("jobs API supports archived status filter query", async ({ request }) => {
    const response = await request.get("/api/jobs?status=archived");
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body.jobs)).toBe(true);
    }
  });

  test("recruiter jobs route is reachable and redirects unauthenticated users", async ({ page }) => {
    await page.goto("/recruiter/jobs");
    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("next") === "/recruiter/jobs");
    expect(new URL(page.url()).searchParams.get("next")).toBe("/recruiter/jobs");
  });
});
