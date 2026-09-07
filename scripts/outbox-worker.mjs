#!/usr/bin/env node
/**
 * Notification outbox worker — retries due `notification_deliveries` email rows.
 *
 * What it does (single cron pass):
 *   1. Claims a small batch of due email deliveries (status pending/failed,
 *      next_attempt_at NULL or past) with an atomic `next_attempt_at` lease,
 *      so concurrent runs cannot double-send the same row.
 *   2. Sends each claimed email, marks it sent; on failure increments
 *      attempt_count and backs off next_attempt_at (parks the row with
 *      next_attempt_at NULL after OUTBOX_MAX_ATTEMPTS for manual retry via
 *      the existing retryNotificationDelivery helper).
 *   3. Exits 0 when everything claimed was sent (or nothing was due),
 *      2 when any delivery failed, 1 on config/connection errors.
 *
 * Why this file does NOT import from src/ (constraint, verified):
 *   - A plain `node` .mjs process cannot resolve TS `@/*` path aliases, and
 *   - `src/lib/notifications/email.ts` / `src/db` both `import "server-only"`,
 *     which throws outside the Next react-server runtime (verified with
 *     `node -e "import('server-only')"`). No loader available without adding
 *     a dependency, so the worker re-implements the exact provider contract
 *     of sendNotificationEmail (mock when NODE_ENV != production, Brevo REST
 *     otherwise) using only the global fetch. Zero changes to
 *     src/lib/notifications.ts were needed.
 *   - Claim uses a `next_attempt_at` lease instead of a pending->sending
 *     transition because the frozen notification_delivery_status enum only
 *     allows pending/sent/failed (see src/db/schema.ts) and schema is owned
 *     elsewhere. The lease UPDATE is guarded on status + due time, so only
 *     one worker wins each row.
 *
 * NON-GOAL: the request path still sends inline (createNotificationWithDeliveries
 * awaits sendNotificationEmail directly). This worker only retries rows left
 * pending/failed/due. Switching the request path to enqueue-only is follow-up
 * work behind an env flag, owned separately.
 *
 * Usage: npm run worker:outbox (see docs/runbook.md)
 * Env: DATABASE_URL (required), OUTBOX_BATCH_SIZE (default 25),
 *   OUTBOX_MAX_ATTEMPTS (default 10), OUTBOX_LEASE_SECONDS (default 300),
 *   OUTBOX_DRY_RUN=1 or --dry-run to list due rows without claiming/sending.
 */

import postgres from "postgres";

const BATCH_SIZE = positiveInt(process.env.OUTBOX_BATCH_SIZE, 25);
const MAX_ATTEMPTS = positiveInt(process.env.OUTBOX_MAX_ATTEMPTS, 10);
const LEASE_SECONDS = positiveInt(process.env.OUTBOX_LEASE_SECONDS, 300);
const DRY_RUN = process.argv.includes("--dry-run") || process.env.OUTBOX_DRY_RUN === "1";

const BASE_DELAY_MS = 5 * 60 * 1000; // matches request-path 5min first retry
const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** 5min, 10min, 20min, ... capped at 24h. failures = attempt_count after increment (>= 1). */
function backoffMs(failures) {
  const shift = Math.min(Math.max(failures - 1, 0), 8);
  return Math.min(BASE_DELAY_MS * 2 ** shift, MAX_DELAY_MS);
}

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character,
  );
}

/**
 * Same provider contract as src/lib/notifications/email.ts#sendNotificationEmail,
 * duplicated (not imported) for the reasons documented in the header.
 */
async function sendEmail({ to, subject, text }) {
  if (process.env.NODE_ENV !== "production") {
    return { providerMessageId: `mock-worker-${Date.now()}`, mode: "mock" };
  }
  const provider = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  const apiKey = (process.env.BREVO_API_KEY ?? "").trim();
  const senderEmail = (process.env.BREVO_SENDER_EMAIL ?? "").trim();
  const senderName = (process.env.BREVO_SENDER_NAME ?? "").trim();
  if (provider !== "brevo") throw new Error("Production email delivery requires EMAIL_PROVIDER=brevo.");
  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Production email delivery requires BREVO_API_KEY, BREVO_SENDER_EMAIL, and BREVO_SENDER_NAME.");
  }
  let response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("Brevo email request timed out.");
    throw new Error("Brevo email request failed before a response was received.");
  }
  if (!response.ok) throw new Error(`Brevo email request failed with status ${response.status}.`);
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Brevo email response was not valid JSON.");
  }
  if (typeof result !== "object" || result === null || typeof result.messageId !== "string" || !result.messageId) {
    throw new Error("Brevo email response did not include a messageId.");
  }
  return { providerMessageId: result.messageId, mode: "brevo" };
}

/**
 * Atomically claim up to `limit` due rows. Rows are locked with
 * FOR UPDATE SKIP LOCKED and the lease UPDATE re-checks status + due time,
 * so only one worker wins each row (no `sending` status exists in the enum).
 */
async function claimDue(sql, limit, leaseSeconds) {
  return sql.begin(async (tx) => {
    const candidates = await tx`
      SELECT d.id, d.attempt_count, n.title, n.body, u.email
      FROM notification_deliveries d
      JOIN notifications n ON n.id = d.notification_id
      JOIN users u ON u.id = n.user_id
      WHERE d.channel = 'email'
        AND d.status IN ('pending', 'failed')
        AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= now())
      ORDER BY d.created_at ASC
      LIMIT ${limit}
      FOR UPDATE OF d SKIP LOCKED`;
    if (candidates.length === 0) return [];
    const ids = candidates.map((row) => row.id);
    const leased = await tx`
      UPDATE notification_deliveries
      SET next_attempt_at = now() + make_interval(secs => ${leaseSeconds}),
        updated_at = now()
      WHERE id = ANY(${ids})
        AND status IN ('pending', 'failed')
        AND (next_attempt_at IS NULL OR next_attempt_at <= now())
      RETURNING id`;
    const leasedIds = new Set(leased.map((row) => row.id));
    return candidates.filter((row) => leasedIds.has(row.id));
  });
}

async function run() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: npm run worker:outbox [-- --dry-run]\nEnv: DATABASE_URL (required), OUTBOX_BATCH_SIZE, OUTBOX_MAX_ATTEMPTS, OUTBOX_LEASE_SECONDS, OUTBOX_DRY_RUN=1");
    return 0;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[outbox-worker] DATABASE_URL is not set.");
    return 1;
  }
  const sql = postgres(connectionString, { max: 1, idle_timeout: 20, connect_timeout: 10 });
  let sent = 0;
  let failed = 0;
  let parked = 0;
  try {
    if (DRY_RUN) {
      const due = await sql`
        SELECT d.id, d.status, d.attempt_count, d.next_attempt_at, u.email
        FROM notification_deliveries d
        JOIN notifications n ON n.id = d.notification_id
        JOIN users u ON u.id = n.user_id
        WHERE d.channel = 'email'
          AND d.status IN ('pending', 'failed')
          AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= now())
        ORDER BY d.created_at ASC
        LIMIT ${BATCH_SIZE}`;
      console.log(`[outbox-worker] dry-run: ${due.length} due deliverie(s).`);
      for (const row of due) console.log(`[outbox-worker] dry-run due: ${row.id} ${row.status} attempts=${row.attempt_count} to=${row.email}`);
      return 0;
    }
    const claimed = await claimDue(sql, BATCH_SIZE, LEASE_SECONDS);
    if (claimed.length === 0) {
      console.log("[outbox-worker] nothing due.");
      return 0;
    }
    console.log(`[outbox-worker] claimed ${claimed.length} deliverie(s).`);
    for (const row of claimed) {
      const text = row.body ?? row.title;
      try {
        const result = await sendEmail({ to: row.email, subject: row.title, text });
        const attempts = row.attempt_count + 1;
        await sql`
          UPDATE notification_deliveries
          SET status = 'sent', attempt_count = ${attempts}, provider_message_id = ${result.providerMessageId},
            sent_at = now(), next_attempt_at = NULL, last_error = NULL, updated_at = now()
          WHERE id = ${row.id}`;
        sent += 1;
        console.log(`[outbox-worker] sent ${row.id} to ${row.email} (attempt ${attempts}, ${result.mode}).`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Email delivery failed.";
        const attempts = row.attempt_count + 1;
        failed += 1;
        if (attempts >= MAX_ATTEMPTS) {
          parked += 1;
          await sql`
            UPDATE notification_deliveries
            SET status = 'failed', attempt_count = ${attempts}, last_error = ${message},
              next_attempt_at = NULL, updated_at = now()
            WHERE id = ${row.id}`;
          console.error(`[outbox-worker] parked ${row.id} after ${attempts} attempts: ${message}`);
        } else {
          const delaySecs = Math.round(backoffMs(attempts) / 1000);
          await sql`
            UPDATE notification_deliveries
            SET status = 'failed', attempt_count = ${attempts}, last_error = ${message},
              next_attempt_at = now() + make_interval(secs => ${delaySecs}), updated_at = now()
            WHERE id = ${row.id}`;
          console.error(`[outbox-worker] delivery ${row.id} failed (attempt ${attempts}, retry in ${delaySecs}s): ${message}`);
        }
      }
    }
    console.log(`[outbox-worker] done: sent=${sent} failed=${failed} parked=${parked}.`);
    return failed === 0 ? 0 : 2;
  } catch (error) {
    console.error("[outbox-worker] pass failed:", error instanceof Error ? error.message : error);
    return 1;
  } finally {
    await sql.end();
  }
}

process.exitCode = await run();
