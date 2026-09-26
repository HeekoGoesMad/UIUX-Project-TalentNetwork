import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";
import { safeRedirectPath, sanitizeNextParam } from "@/lib/auth/redirect";

function popupSuccessResponse(data: {
  isNew: boolean;
  hasPassword: boolean;
  role: string;
  provisioningStatus?: string;
  hasSubmittedOnboarding?: boolean;
}) {
  const safeRole =
    data.role === "candidate" || data.role === "recruiter" || data.role === "partner" || data.role === "admin"
      ? data.role
      : "candidate";

  const safeProvisioning = data.provisioningStatus === "active" ? "active" : "pending";

  const payload = {
    type: "GOOGLE_AUTH_SUCCESS",
    isNew: Boolean(data.isNew),
    hasPassword: Boolean(data.hasPassword),
    role: safeRole,
    provisioningStatus: safeProvisioning,
    hasSubmittedOnboarding: Boolean(data.hasSubmittedOnboarding),
  };

  const safePayloadJson = JSON.stringify(payload)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\//g, "\\u002f");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Menghubungkan Akun Google...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #F9FAFB;
      color: #111827;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #E5E7EB;
      border-top-color: #7C3AED;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    .check-icon {
      display: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #ECFDF5;
      color: #059669;
      font-size: 22px;
      line-height: 44px;
      font-weight: bold;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 17px; font-weight: 600; margin: 0 0 8px; color: #111827; }
    p { font-size: 13px; color: #6B7280; margin: 0 0 16px; line-height: 1.5; }
    .btn-close {
      display: none;
      background: #7C3AED;
      color: #ffffff;
      border: none;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      transition: background 0.15s;
    }
    .btn-close:hover {
      background: #6D28D9;
    }
  </style>
</head>
<body>
  <div id="spinner" class="spinner"></div>
  <div id="check-icon" class="check-icon">✓</div>
  <h2 id="status-title">Menghubungkan akun Google...</h2>
  <p id="status-desc">Jendela ini akan tertutup secara otomatis.</p>
  <button id="btn-close" type="button" class="btn-close" onclick="tryCloseWindow()">Tutup Jendela Ini</button>

  <script id="auth-payload" type="application/json">${safePayloadJson}</script>
  <script>
    function tryCloseWindow() {
      try { window.close(); } catch(e) {}
    }

    (function() {
      var payloadNode = document.getElementById("auth-payload");
      var payload = payloadNode ? JSON.parse(payloadNode.textContent) : { type: "GOOGLE_AUTH_SUCCESS" };
      var targetOrigin = window.location.origin;

      // 1. Direct window.opener postMessage strictly to same origin
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(payload, targetOrigin);
        } catch (e) {}
      }

      // 2. BroadcastChannel cross-window sync
      try {
        if ("BroadcastChannel" in window) {
          var channel = new BroadcastChannel("proofylink_oauth_channel");
          channel.postMessage(payload);
          setTimeout(function() {
            try { channel.close(); } catch (e) {}
          }, 2000);
        }
      } catch (e) {}

      // 3. LocalStorage event cross-tab sync fallback
      try {
        localStorage.setItem("proofylink_oauth_event", JSON.stringify(Object.assign({}, payload, { timestamp: Date.now() })));
      } catch (e) {}

      // Attempt immediate close
      tryCloseWindow();
      setTimeout(tryCloseWindow, 100);
      setTimeout(tryCloseWindow, 300);

      // If window remains open after 600ms (e.g. browser blocked script window.close):
      // reveal check icon and manual close button (user gesture always allows window.close)
      setTimeout(function() {
        var spinner = document.getElementById("spinner");
        var checkIcon = document.getElementById("check-icon");
        var title = document.getElementById("status-title");
        var desc = document.getElementById("status-desc");
        var btn = document.getElementById("btn-close");

        if (spinner) spinner.style.display = "none";
        if (checkIcon) checkIcon.style.display = "inline-block";
        if (title) title.textContent = "Berhasil Masuk!";
        if (desc) desc.textContent = "Akun Google Anda terhubung. Silakan klik tombol di bawah untuk kembali ke halaman utama.";
        if (btn) btn.style.display = "inline-block";
      }, 600);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function popupErrorResponse(errorMessage: string) {
  const safeErrorMessage =
    errorMessage === "Kode verifikasi tidak ditemukan" || errorMessage === "Role akun tidak valid"
      ? errorMessage
      : "Verifikasi email gagal";

  const safeErrorPayload = JSON.stringify({
    type: "GOOGLE_AUTH_ERROR",
    error: safeErrorMessage,
  })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\//g, "\\u002f");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gagal Menghubungkan Akun</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #F9FAFB;
      color: #111827;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .error-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #FEF2F2;
      color: #DC2626;
      font-size: 22px;
      line-height: 44px;
      font-weight: bold;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    h2 { font-size: 17px; font-weight: 600; margin: 0 0 8px; color: #111827; }
    p { font-size: 13px; color: #6B7280; margin: 0 0 16px; line-height: 1.5; max-width: 320px; }
    .btn-close {
      background: #DC2626;
      color: #ffffff;
      border: none;
      padding: 9px 20px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
    }
    .btn-close:hover {
      background: #B91C1C;
    }
  </style>
</head>
<body>
  <div class="error-icon">✕</div>
  <h2>Gagal Menghubungkan Akun</h2>
  <p>${safeErrorMessage}</p>
  <button type="button" class="btn-close" onclick="tryCloseWindow()">Tutup Jendela Ini</button>

  <script id="auth-error-payload" type="application/json">${safeErrorPayload}</script>
  <script>
    function tryCloseWindow() {
      try { window.close(); } catch(e) {}
    }

    (function() {
      var errNode = document.getElementById("auth-error-payload");
      var payload = errNode ? JSON.parse(errNode.textContent) : { type: "GOOGLE_AUTH_ERROR", error: "Verifikasi email gagal" };
      var targetOrigin = window.location.origin;

      if (window.opener && !window.opener.closed) {
        try { window.opener.postMessage(payload, targetOrigin); } catch (e) {}
      }

      try {
        if ("BroadcastChannel" in window) {
          var channel = new BroadcastChannel("proofylink_oauth_channel");
          channel.postMessage(payload);
          setTimeout(function() {
            try { channel.close(); } catch (e) {}
          }, 2000);
        }
      } catch (e) {}

      try {
        localStorage.setItem("proofylink_oauth_event", JSON.stringify(Object.assign({}, payload, { timestamp: Date.now() })));
      } catch (e) {}

      tryCloseWindow();
      setTimeout(tryCloseWindow, 150);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function createAuthErrorResponse(
  errorMessage: string,
  requestUrl: URL,
  isPopup: boolean
): NextResponse {
  if (isPopup) {
    return popupErrorResponse(errorMessage);
  }
  const fallbackUrl = new URL(`/login?error=${encodeURIComponent(errorMessage)}`, requestUrl.origin).toString();
  return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin));
}

function resolveRoleDestination(
  role: string,
  candidateNext: string | null,
  isNew: boolean,
  hasSubmittedOnboarding?: boolean,
  provisioningStatus?: string
): string {
  if (role === "candidate") {
    if (hasSubmittedOnboarding === false) return "/candidate/onboarding";
    if (
      candidateNext &&
      candidateNext.startsWith("/") &&
      !candidateNext.startsWith("//") &&
      (candidateNext.startsWith("/candidate") || candidateNext.startsWith("/jobs") || ["/profile", "/messages"].includes(candidateNext))
    ) {
      if (hasSubmittedOnboarding === true && candidateNext.startsWith("/candidate/onboarding")) {
        return "/candidate";
      }
      return candidateNext;
    }
    return "/candidate";
  }

  if (role === "recruiter") {
    if (isNew || hasSubmittedOnboarding === false) return "/recruiter/onboarding";
    if (provisioningStatus !== "active") return "/recruiter/pending";
    if (
      candidateNext &&
      candidateNext.startsWith("/") &&
      !candidateNext.startsWith("//") &&
      (candidateNext.startsWith("/dashboard") ||
        candidateNext.startsWith("/search") ||
        candidateNext.startsWith("/shortlist") ||
        candidateNext.startsWith("/talent") ||
        candidateNext.startsWith("/recruiter") ||
        candidateNext === "/pricing")
    ) {
      return candidateNext;
    }
    return "/dashboard";
  }

  if (role === "partner") {
    if (isNew) return "/partner/onboarding";
    if (provisioningStatus !== "active") return "/partner/pending";
    if (
      candidateNext &&
      candidateNext.startsWith("/") &&
      !candidateNext.startsWith("//") &&
      candidateNext.startsWith("/partner")
    ) {
      return candidateNext;
    }
    return "/partner";
  }

  if (role === "admin") {
    if (candidateNext && candidateNext.startsWith("/admin")) return candidateNext;
    return "/admin";
  }

  return "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextParam(requestUrl.searchParams.get("next"));
  const requestedRole = requestUrl.searchParams.get("role");
  const isPopup = requestUrl.searchParams.get("popup") === "true";
  const validRole = requestedRole === "candidate" || requestedRole === "recruiter" || requestedRole === "partner";

  if (!code) {
    return createAuthErrorResponse("Kode verifikasi tidak ditemukan", requestUrl, isPopup);
  }
  if (requestedRole && !validRole) {
    return createAuthErrorResponse("Role akun tidak valid", requestUrl, isPopup);
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) throw userError ?? new Error("Sesi verifikasi tidak ditemukan.");

    const metadataRole = data.user.user_metadata?.role;
    // Allow role fallback so continuing with Google seamlessly signs in existing accounts
    // even if a different role tab was active on the login page.
    const result = await syncAuthenticatedUser(data.user, {
      name:
        (typeof data.user.user_metadata?.full_name === "string" && data.user.user_metadata.full_name.trim()) ||
        (typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name.trim()) ||
        undefined,
      companyName: typeof data.user.user_metadata?.companyName === "string" ? data.user.user_metadata.companyName : undefined,
      role: validRole && requestedRole ? requestedRole : undefined,
      allowRoleFallback: true,
    });

    const destination = resolveRoleDestination(
      result.role,
      next,
      result.isNew,
      result.hasSubmittedOnboarding,
      result.provisioningStatus
    );

    if (metadataRole !== result.role) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: result.role },
      });
      if (metadataError) throw metadataError;
    }

    // Determine final destination: if new user registration with Google, route to optional setup-password before onboarding
    const shouldShowPasswordSetup = result.isNew && !result.hasPassword;
    const finalDestination = shouldShowPasswordSetup
      ? `/auth/setup-password?role=${result.role}&next=${encodeURIComponent(destination)}`
      : destination;

    const safeFinalDestination = safeRedirectPath(finalDestination, "/dashboard");

    if (isPopup) {
      return popupSuccessResponse({
        isNew: result.isNew,
        hasPassword: Boolean(result.hasPassword),
        role: result.role,
        provisioningStatus: result.provisioningStatus,
        hasSubmittedOnboarding: result.hasSubmittedOnboarding,
      });
    }

    return NextResponse.redirect(new URL(safeFinalDestination, requestUrl.origin));
  } catch (error) {
    console.error("Verifikasi email gagal:", error);
    return createAuthErrorResponse("Verifikasi email gagal", requestUrl, isPopup);
  }
}
