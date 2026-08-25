import { expect, test } from "playwright/test";

test.describe("route parity", () => {
  test("public routes respond successfully", async ({ request }) => {
    for (const route of ["/", "/login", "/register", "/pricing", "/jobs"]) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(200);
    }
  });

  test("canonical recruiter and candidate routes are available", async ({ request }) => {
    for (const route of [
      "/recruiter",
      "/recruiter/dashboard",
      "/recruiter/assessments",
      "/candidate",
      "/candidate/assessments",
    ]) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(200);
    }
  });

  test("legacy redirects preserve their canonical destinations", async ({ request }) => {
    const redirects = [
      ["/dashboard", "/recruiter/dashboard"],
      ["/search", "/recruiter/discover"],
      ["/shortlist", "/recruiter/shortlists"],
      ["/profile", "/candidate/profile"],
      ["/talent/route-parity-candidate", "/recruiter/discover/route-parity-candidate"],
    ] as const;

    for (const [source, destination] of redirects) {
      const response = await request.get(source, { maxRedirects: 0 });
      expect(response.status(), source).toBeGreaterThanOrEqual(300);
      expect(response.status(), source).toBeLessThan(400);
      expect(response.headers().location, source).toBe(destination);
    }
  });

  test("protected routes redirect unauthenticated navigation to login", async ({ page }) => {
    for (const route of ["/recruiter/dashboard", "/candidate", "/recruiter/assessments", "/candidate/assessments"]) {
      await page.goto(route);
      await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("next") === route);
      expect(new URL(page.url()).searchParams.get("next")).toBe(route);
    }
  });
});
