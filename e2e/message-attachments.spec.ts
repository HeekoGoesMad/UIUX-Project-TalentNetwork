import { expect, test } from "playwright/test";

test("anonymous multipart POST is rejected", async ({ request }) => {
  const res = await request.post("/api/messages", {
    multipart: {
      conversationId: "00000000-0000-0000-0000-000000000000",
      body: "Test message with attachment",
      file: {
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      },
    },
  });

  expect(res.status()).not.toBe(201);
  expect([401, 500, 503]).toContain(res.status());
  const body = (await res.json()) as { error?: string; message?: unknown };
  expect(body.error).toBeTruthy();
  expect(body.message).toBeUndefined();
});

test("anonymous attachment download endpoint is rejected", async ({ request }) => {
  const res = await request.get("/api/messages/00000000-0000-0000-0000-000000000000/attachment");
  expect(res.status()).not.toBe(200);
  expect([401, 404, 500, 503]).toContain(res.status());
  const body = (await res.json()) as { error?: string; downloadUrl?: unknown };
  expect(body.error).toBeTruthy();
  expect(body.downloadUrl).toBeUndefined();
});

test("anonymous text-only POST remains rejected after multipart addition", async ({ request }) => {
  const res = await request.post("/api/messages", {
    data: {
      conversationId: "00000000-0000-0000-0000-000000000000",
      body: "Test text-only message",
    },
  });

  expect(res.status()).not.toBe(201);
  expect([401, 500, 503]).toContain(res.status());
  const body = (await res.json()) as { error?: string; message?: unknown };
  expect(body.error).toBeTruthy();
  expect(body.message).toBeUndefined();
});
