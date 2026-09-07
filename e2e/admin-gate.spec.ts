import { expect, test, type APIRequestContext } from "playwright/test";

async function backendUp(request: APIRequestContext) {
  try {
    const res = await request.get("/api/health");
    const body = (await res.json()) as { checks?: { database?: string } };
    return body?.checks?.database === "up";
  } catch {
    return false;
  }
}

// With a backend, logged-out visitors stay on the denied popup past the
// ceremony (regression: the gate timer once clobbered the denial). Without
// one, the portal renders its empty state without crashing or leaking data.
test("logged-out visitor flow respects backend availability", async ({ page, request }) => {
  const hasBackend = await backendUp(request);
  await page.goto("/admin");
  await expect(page.getByText("Memverifikasi akses admin")).toBeVisible();
  if (hasBackend) {
    await expect(page.getByText("Error 401")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(4000);
    await expect(page.getByText("Error 401")).toBeVisible();
    await expect(page.getByText("Metrik Utama")).toHaveCount(0);
  } else {
    await expect(page.getByText("Metrik Utama")).toBeVisible({ timeout: 10_000 });
  }
});

test("admin dashboard API rejects anonymous callers", async ({ request }) => {
  const hasBackend = await backendUp(request);
  const res = await request.get("/api/admin/dashboard");
  const body = (await res.json()) as { error?: string; errorId?: string };
  if (hasBackend) {
    expect(res.status()).toBe(401);
  } else {
    expect(res.status()).toBe(500);
    expect(body.errorId).toBeTruthy();
  }
});
