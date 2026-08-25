import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

const REQUIRED_ENV_VARS = [
  "E2E_RECRUITER_EMAIL",
  "E2E_RECRUITER_PASSWORD",
  "E2E_CANDIDATE_EMAIL",
  "E2E_CANDIDATE_PASSWORD",
];

const missingVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missingVars.length > 0) {
  console.error(
    `[setup] Missing required environment variables: ${missingVars.join(", ")}\n` +
      `[setup] Required vars:\n` +
      REQUIRED_ENV_VARS.map((name) => `  - ${name}`).join("\n") +
      `\n[setup] Optional: E2E_BASE_URL (default: ${BASE_URL})\n` +
      `[setup] Example: E2E_RECRUITER_EMAIL=... E2E_RECRUITER_PASSWORD=... E2E_CANDIDATE_EMAIL=... E2E_CANDIDATE_PASSWORD=... npm run test:e2e`
  );
  process.exit(1);
}

const RECRUITER = {
  email: process.env.E2E_RECRUITER_EMAIL,
  password: process.env.E2E_RECRUITER_PASSWORD,
};
const CANDIDATE = {
  email: process.env.E2E_CANDIDATE_EMAIL,
  password: process.env.E2E_CANDIDATE_PASSWORD,
};

const SCREENSHOT_DIR = path.resolve(process.cwd(), "scratch/flow_screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const logs = [];
const logStep = (stepNum, stepDesc, detail = "") => {
  const entry = `[Step ${stepNum}] ${stepDesc}${detail ? " -> " + detail : ""}`;
  console.log(entry);
  logs.push(entry);
};

class StepFailure extends Error {}

function fail(step, expected, actual) {
  throw new StepFailure(
    `STEP FAILED: ${step}\n  expected: ${expected}\n  actual:   ${actual}`
  );
}

function expectTruthy(condition, step, expected, actual) {
  if (!condition) fail(step, expected, actual);
}

async function api(page, method, urlPath, body) {
  return page.evaluate(async ({ method, urlPath, body }) => {
    const res = await fetch(urlPath, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }, { method, urlPath, body });
}

function expectStatus(step, res, expectedStatuses) {
  const allowed = Array.isArray(expectedStatuses) ? expectedStatuses : [expectedStatuses];
  expectTruthy(
    res.ok && allowed.includes(res.status),
    `${step} (API ${res.requestLabel || ""})`.trim(),
    `HTTP ${allowed.join(" or ")}`,
    `HTTP ${res.status} body=${JSON.stringify(res.data)?.slice(0, 300)}`
  );
}

async function nav(page, step, urlPath) {
  const res = await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: "load" });
  expectTruthy(
    res && res.ok(),
    step,
    `HTTP 2xx for GET ${urlPath}`,
    res ? `HTTP ${res.status()}` : "no response received"
  );
  return res;
}

async function login(page, step, roleButtonLabel, creds) {
  await nav(page, step, "/login");
  const roleBtn = page.locator(`button:has-text('${roleButtonLabel}')`).first();
  if (await roleBtn.isVisible().catch(() => false)) {
    await roleBtn.click();
  }
  await page.fill("input[type='email']", creds.email);
  await page.fill("input[type='password']", creds.password);
  await page.click("button[type='submit']");
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  } catch {
    fail(step, "browser redirected away from /login after submit", `still on ${page.url()}`);
  }
}

async function getTokenBalance(page, step) {
  const res = await api(page, "GET", "/api/tokens");
  expectStatus(step, res, 200);
  const balance = res.data?.token?.balance;
  expectTruthy(
    typeof balance === "number" && Number.isFinite(balance),
    step,
    "GET /api/tokens returns token.balance as a number",
    `token=${JSON.stringify(res.data?.token)}`
  );
  return balance;
}

async function findConsentItem(page, step, candidateProfileId) {
  const res = await api(page, "GET", "/api/consent-requests");
  expectStatus(step, res, 200);
  const requests = res.data?.requests;
  expectTruthy(
    Array.isArray(requests),
    step,
    "GET /api/consent-requests returns { requests: [...] }",
    `body=${JSON.stringify(res.data)?.slice(0, 300)}`
  );
  return requests.find((r) => r.candidateProfileId === candidateProfileId) || null;
}

async function isShortlisted(page, candidateProfileId) {
  const res = await api(page, "GET", "/api/shortlists");
  expectStatus("Shortlist state", res, 200);
  const shortlists = res.data;
  expectTruthy(
    Array.isArray(shortlists),
    "Shortlist state",
    "GET /api/shortlists returns an array of shortlists",
    `body=${JSON.stringify(res.data)?.slice(0, 300)}`
  );
  return shortlists.some((sl) =>
    (sl.items || []).some((item) => item.candidateProfileId === candidateProfileId)
  );
}

async function run() {
  console.log("=== STARTING 14-STEP CROSS-ACCOUNT FLOW VERIFICATION ===");
  const browser = await chromium.launch({ headless: true });

  let failed = false;
  try {
    const recruiterContext = await browser.newContext();
    const candidateContext = await browser.newContext();

    const pageR = await recruiterContext.newPage();
    const pageC = await candidateContext.newPage();

    // ----------------------------------------------------
    // STEP 1: Recruiter login, token grant, navigate to /search
    // ----------------------------------------------------
    logStep(1, `Recruiter logging in (${RECRUITER.email})`);
    await login(pageR, "Step 1: recruiter login", "Recruiter / Hiring", RECRUITER);
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/01_recruiter_login.png` });

    logStep(1, "Granting 50 test tokens to recruiter");
    const grantRes = await api(pageR, "POST", "/api/dev/token-grant", {
      amount: 50,
      idempotencyKey: `test-grant-${Date.now()}`,
    });
    expectStatus(
      "Step 1: dev token grant (requires DEV_TOKEN_GRANT_ENABLED=true in development)",
      grantRes,
      200
    );

    logStep(1, "Recruiter navigating to /search");
    await nav(pageR, "Step 1: GET /search", "/search");
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/02_recruiter_search.png` });

    // ----------------------------------------------------
    // STEP 2: Open Candidate Profile
    // ----------------------------------------------------
    logStep(2, "Opening candidate profile from /search results");
    const talentLinks = pageR.locator("a[href^='/talent/']");
    await talentLinks.first().waitFor({ state: "visible", timeout: 15000 });
    const talentLinkCount = await talentLinks.count();
    expectTruthy(
      talentLinkCount > 0,
      "Step 2: search results contain talent links",
      "at least 1 a[href^='/talent/'] element",
      `${talentLinkCount} elements`
    );
    const candidateHref = await talentLinks.first().getAttribute("href");
    expectTruthy(
      typeof candidateHref === "string" && /^\/talent\/[0-9a-f-]{36}$/.test(candidateHref),
      "Step 2: talent link href format",
      "'/talent/<uuid>'",
      `href=${candidateHref}`
    );
    const candidateId = candidateHref.replace("/talent/", "");
    logStep(2, `Target candidate path: ${candidateHref}`);

    await nav(pageR, "Step 2: GET candidate profile page", `/talent/${candidateId}`);
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/03_candidate_profile_initial.png` });

    // ----------------------------------------------------
    // STEP 3: Toggle Candidate Shortlist (assert membership flips)
    // ----------------------------------------------------
    logStep(3, "Toggling candidate shortlist");
    const wasShortlisted = await isShortlisted(pageR, candidateId);

    const toggleBtn = pageR.locator("button[aria-label='Toggle shortlist']").first();
    expectTruthy(
      await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false),
      "Step 3: shortlist toggle button visible on profile",
      "visible button[aria-label='Toggle shortlist']",
      "button not found/not visible"
    );
    await toggleBtn.click();

    const nowShortlisted = await isShortlisted(pageR, candidateId);
    expectTruthy(
      nowShortlisted === !wasShortlisted,
      "Step 3: shortlist membership flips after toggle click",
      `shortlisted ${wasShortlisted} -> ${!wasShortlisted}`,
      `shortlisted ${wasShortlisted} -> ${nowShortlisted}`
    );
    logStep(3, `Shortlist toggled: ${wasShortlisted} -> ${nowShortlisted}`);
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/04_shortlist_toggled.png` });

    // ----------------------------------------------------
    // STEP 4: Send Consent Request (skip if one already exists for reruns)
    // ----------------------------------------------------
    logStep(4, "Sending consent request to candidate via API");
    const existingConsent = await findConsentItem(pageR, "Step 4: list consent requests", candidateId);
    if (!existingConsent) {
      const consentRes = await api(pageR, "POST", "/api/consent-requests", {
        candidateProfileIds: [candidateId],
        purpose: "Screening kandidat",
      });
      expectStatus("Step 4: POST /api/consent-requests", consentRes, 201);
      expectTruthy(
        typeof consentRes.data?.batchId === "string" && Array.isArray(consentRes.data?.itemIds),
        "Step 4: consent creation response shape",
        "{ batchId: string, itemIds: string[] }",
        `body=${JSON.stringify(consentRes.data)?.slice(0, 300)}`
      );
      logStep(4, `Consent request created batchId=${consentRes.data.batchId}`);
    } else {
      logStep(4, `Consent request already exists itemId=${existingConsent.itemId}, skipping create`);
    }
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/05_consent_requested.png` });

    // ----------------------------------------------------
    // STEP 5: Candidate Login & Navigate to /candidate/contact-requests
    // ----------------------------------------------------
    logStep(5, `Candidate logging in (${CANDIDATE.email})`);
    await login(pageC, "Step 5: candidate login", "Talent / Candidate", CANDIDATE);
    await pageC.screenshot({ path: `${SCREENSHOT_DIR}/06_candidate_login.png` });

    logStep(5, "Candidate opening /candidate/contact-requests");
    await nav(pageC, "Step 5: GET /candidate/contact-requests", "/candidate/contact-requests");
    await pageC.screenshot({ path: `${SCREENSHOT_DIR}/07_candidate_contact_requests.png` });

    // ----------------------------------------------------
    // STEP 6: Candidate Approves Consent (verified via API)
    // ----------------------------------------------------
    logStep(6, "Candidate approving consent request");
    const consentToApprove = await findConsentItem(pageC, "Step 6: candidate lists consent requests", candidateId);
    expectTruthy(
      consentToApprove !== null,
      "Step 6: consent request exists for this candidate",
      "a consent item with matching candidateProfileId",
      "no consent item found for candidate"
    );

    if (consentToApprove.consentState !== "consented") {
      const approveRes = await api(pageC, "PATCH", `/api/consent-requests/${consentToApprove.itemId}`, {
        decision: "approved",
      });
      expectStatus("Step 6: PATCH consent decision", approveRes, 200);
      expectTruthy(
        approveRes.data?.consentStatus === "approved",
        "Step 6: consent decision persisted as approved",
        "{ consentStatus: 'approved' }",
        `body=${JSON.stringify(approveRes.data)?.slice(0, 300)}`
      );

      const verified = await findConsentItem(pageC, "Step 6: re-read consent after approval", candidateId);
      expectTruthy(
        verified?.consentState === "consented",
        "Step 6: consentState is 'consented' after approval",
        "consentState === 'consented'",
        `consentState=${verified?.consentState}`
      );
    }
    logStep(6, "Consent approved and verified by candidate");
    await pageC.waitForTimeout(1000);
    await pageC.screenshot({ path: `${SCREENSHOT_DIR}/08_consent_approved.png` });

    // ----------------------------------------------------
    // STEP 7 & 8: Recruiter revisits /shortlist and candidate profile
    // ----------------------------------------------------
    logStep(7, "Returning to Recruiter session");
    const reloadRes = await pageR.reload({ waitUntil: "load" });
    expectTruthy(
      reloadRes && reloadRes.ok(),
      "Step 7: recruiter session still authenticated after reload",
      "reload returns HTTP 2xx",
      reloadRes ? `HTTP ${reloadRes.status()}` : "no response"
    );

    logStep(8, "Recruiter opening /shortlist");
    await nav(pageR, "Step 8: GET /shortlist", "/shortlist");
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/09_recruiter_shortlist.png` });

    logStep(8, `Recruiter returning to candidate profile /talent/${candidateId}`);
    await nav(pageR, "Step 8: GET candidate profile (post-consent)", `/talent/${candidateId}`);
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/10_recruiter_candidate_profile_ready.png` });

    // ----------------------------------------------------
    // STEP 9, 10, 11: Run Screening, Check Token Deduction & Score
    // ----------------------------------------------------
    logStep(9, "Executing AI screening run");
    const balanceBefore = await getTokenBalance(pageR, "Step 9: read token balance before screening");

    const consentForRun = await findConsentItem(pageR, "Step 9: recruiter lists consent requests", candidateId);
    expectTruthy(
      consentForRun !== null && typeof consentForRun.itemId === "string",
      "Step 9: approved consent item available for screening",
      "consent item with itemId for candidate",
      `found=${JSON.stringify(consentForRun)?.slice(0, 300)}`
    );

    const startRes = await api(pageR, "POST", "/api/screening-runs", {
      candidateProfileId: candidateId,
      consentRequestItemId: consentForRun.itemId,
      idempotencyKey: `run-${Date.now()}`,
    });
    expectStatus("Step 9: POST /api/screening-runs", startRes, [200, 201]);
    expectTruthy(
      typeof startRes.data?.runId === "string" && startRes.data.runId.length > 0,
      "Step 9: screening run started with runId",
      "{ runId: string }",
      `body=${JSON.stringify(startRes.data)?.slice(0, 300)}`
    );
    const runId = startRes.data.runId;
    logStep(9, `Screening run started runId=${runId}`);

    const resultRes = await api(pageR, "POST", `/api/screening-runs/${runId}/result`, {
      skills: ["React", "TypeScript"],
    });
    expectStatus("Step 9: POST screening result", resultRes, 200);
    const score = resultRes.data?.score?.score;
    expectTruthy(
      typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100,
      "Step 11: screening result contains real score in [0, 100] (no fabricated fallback)",
      "score.score as number within 0..100",
      `score=${JSON.stringify(resultRes.data?.score)}`
    );
    logStep(11, `Screening score saved: ${score}/100`);

    const balanceAfter = await getTokenBalance(pageR, "Step 10: read token balance after screening");
    expectTruthy(
      balanceAfter === balanceBefore - 1,
      "Step 10: screening deducts exactly 1 token",
      `balance ${balanceBefore} -> ${balanceBefore - 1}`,
      `balance ${balanceBefore} -> ${balanceAfter}`
    );
    logStep(10, `Screening token deducted by 1: ${balanceBefore} -> ${balanceAfter}`);

    await nav(pageR, "Step 9: reload candidate profile with screening result", `/talent/${candidateId}`);
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/11_screening_result.png` });

    // ----------------------------------------------------
    // STEP 12 & 13: Start Conversation & Send Message
    // ----------------------------------------------------
    logStep(12, "Recruiter creating conversation");
    const convRes = await api(pageR, "POST", "/api/conversations", { candidateProfileId: candidateId });
    expectStatus("Step 12: POST /api/conversations", convRes, [200, 201]);
    expectTruthy(
      typeof convRes.data?.conversationId === "string" && /^[0-9a-f-]{36}$/.test(convRes.data.conversationId),
      "Step 12: conversation created with conversationId uuid",
      "{ conversationId: '<uuid>' }",
      `body=${JSON.stringify(convRes.data)?.slice(0, 300)}`
    );
    const conversationId = convRes.data.conversationId;
    logStep(12, `Conversation ID: ${conversationId}`);

    logStep(12, "Recruiter navigating to /messages");
    await nav(pageR, "Step 12: GET /messages", `/messages?conversationId=${conversationId}`);

    logStep(13, "Recruiter sending message");
    const testMsgText = `Halo! Perusahaan kami sangat tertarik dengan latar belakang Anda. Mohon ketersediaannya untuk tahap wawancara singkat. (Sent at ${new Date().toLocaleTimeString("id-ID")})`;

    const msgTextarea = pageR.locator("textarea[aria-label='Isi pesan']").first();
    expectTruthy(
      await msgTextarea.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false),
      "Step 13: message composer textarea visible",
      "visible textarea[aria-label='Isi pesan']",
      "textarea not found/not visible"
    );
    await msgTextarea.fill(testMsgText);

    const sendButton = pageR.locator("button[aria-label='Kirim pesan']").first();
    await sendButton.click();

    const msgListRes = await api(pageR, "GET", `/api/messages?conversationId=${conversationId}`);
    expectStatus("Step 13: GET sent messages", msgListRes, 200);
    const sentMessage = (msgListRes.data?.messages || []).find((m) => m.body === testMsgText);
    expectTruthy(
      sentMessage !== undefined,
      "Step 13: sent message persisted with exact body",
      `a message with body '${testMsgText}'`,
      `messages=${JSON.stringify(msgListRes.data?.messages)?.slice(0, 400)}`
    );
    logStep(13, `Message sent successfully: "${testMsgText}"`);
    await pageR.screenshot({ path: `${SCREENSHOT_DIR}/13_recruiter_sent_message.png` });

    // ----------------------------------------------------
    // STEP 14: Candidate verifies received message
    // ----------------------------------------------------
    logStep(14, "Candidate opening /messages to verify received message");
    await nav(pageC, "Step 14: GET /messages as candidate", `/messages?conversationId=${conversationId}`);
    await pageC.waitForTimeout(2000);
    await pageC.screenshot({ path: `${SCREENSHOT_DIR}/14_candidate_messages.png` });

    const candidateMsgRes = await api(pageC, "GET", `/api/messages?conversationId=${conversationId}`);
    expectStatus("Step 14: candidate reads conversation", candidateMsgRes, 200);
    const receivedByCandidate = (candidateMsgRes.data?.messages || []).find((m) => m.body === testMsgText);
    expectTruthy(
      receivedByCandidate !== undefined,
      "Step 14: candidate sees the recruiter's message",
      `a message with body '${testMsgText}'`,
      `messages=${JSON.stringify(candidateMsgRes.data?.messages)?.slice(0, 400)}`
    );
    logs.push(`[Step 14] Message received by candidate verified`);

    logStep(14, "=== ALL 14 STEPS COMPLETED & ASSERTED SUCCESSFULLY ===");
  } catch (err) {
    failed = true;
    if (err instanceof StepFailure) {
      console.error(err.message);
      logs.push(err.message);
    } else {
      console.error("Test Failure Error:", err);
      logs.push(`Unexpected error: ${err.message}`);
    }
  } finally {
    await browser.close();
    fs.writeFileSync(`${SCREENSHOT_DIR}/test_log.txt`, logs.join("\n"));
  }

  if (failed) {
    console.error("=== RESULT: FAILED (see failure details above) ===");
    process.exit(1);
  }
  console.log("=== RESULT: PASSED ===");
}

run();
