import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";

function popupSuccessResponse(data: { isNew: boolean; hasPassword: boolean; role: string; destination: string }) {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
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
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 16px; font-weight: 600; margin: 0 0 6px; color: #111827; }
    p { font-size: 13px; color: #6B7280; margin: 0; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Menghubungkan akun Google...</h2>
  <p>Jendela ini akan tertutup secara otomatis.</p>
  <script>
    (function() {
      var payload = {
        type: "GOOGLE_AUTH_SUCCESS",
        isNew: ${data.isNew},
        hasPassword: ${data.hasPassword},
        role: ${JSON.stringify(data.role)},
        destination: ${JSON.stringify(data.destination)}
      };

      var delivered = false;

      // 1. Direct window.opener postMessage
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(payload, window.location.origin);
          delivered = true;
        } catch (e) {
          console.error("postMessage error:", e);
        }
      }

      // 2. BroadcastChannel cross-window sync
      try {
        if ("BroadcastChannel" in window) {
          var channel = new BroadcastChannel("proofylink_oauth_channel");
          channel.postMessage(payload);
          channel.close();
          delivered = true;
        }
      } catch (e) {
        console.error("BroadcastChannel error:", e);
      }

      // 3. LocalStorage event cross-tab sync fallback
      try {
        localStorage.setItem("proofylink_oauth_event", JSON.stringify(Object.assign({}, payload, { timestamp: Date.now() })));
        delivered = true;
      } catch (e) {}

      // If opener is connected, close immediately
      if (window.opener && !window.opener.closed) {
        setTimeout(function() { window.close(); }, 150);
        return;
      }

      // If delivered via channel or storage, close window
      if (delivered) {
        setTimeout(function() { window.close(); }, 300);
        return;
      }

      // Fallback: If not opened as popup or cannot close, redirect directly
      window.location.replace(${JSON.stringify(data.destination)});
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

function popupErrorResponse(errorMessage: string, fallbackUrl: string) {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Gagal Menghubungkan Akun</title>
</head>
<body>
  <script>
    (function() {
      var errorMsg = ${JSON.stringify(errorMessage)};
      var payload = {
        type: "GOOGLE_AUTH_ERROR",
        error: errorMsg
      };

      var delivered = false;

      // 1. Direct window.opener postMessage
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(payload, window.location.origin);
          delivered = true;
        } catch (e) {}
      }

      // 2. BroadcastChannel
      try {
        if ("BroadcastChannel" in window) {
          var channel = new BroadcastChannel("proofylink_oauth_channel");
          channel.postMessage(payload);
          channel.close();
          delivered = true;
        }
      } catch (e) {}

      // 3. LocalStorage
      try {
        localStorage.setItem("proofylink_oauth_event", JSON.stringify(Object.assign({}, payload, { timestamp: Date.now() })));
        delivered = true;
      } catch (e) {}

      if (window.opener && !window.opener.closed) {
        setTimeout(function() { window.close(); }, 150);
        return;
      }

      if (delivered) {
        setTimeout(function() { window.close(); }, 300);
        return;
      }

      window.location.replace(${JSON.stringify(fallbackUrl)});
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
  const next = requestUrl.searchParams.get("next");
  const requestedRole = requestUrl.searchParams.get("role");
  const mode = requestUrl.searchParams.get("mode");
  const isPopup = requestUrl.searchParams.get("popup") === "true";
  const validRole = requestedRole === "candidate" || requestedRole === "recruiter" || requestedRole === "partner";

  if (!code) {
    const errorMsg = "Kode verifikasi tidak ditemukan";
    const fallbackUrl = new URL(`/login?error=${encodeURIComponent(errorMsg)}`, requestUrl.origin).toString();
    if (isPopup) return popupErrorResponse(errorMsg, fallbackUrl);
    return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin));
  }
  if (requestedRole && !validRole) {
    const errorMsg = "Role akun tidak valid";
    const fallbackUrl = new URL(`/login?error=${encodeURIComponent(errorMsg)}`, requestUrl.origin).toString();
    if (isPopup) return popupErrorResponse(errorMsg, fallbackUrl);
    return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      // Check if session was already exchanged by a concurrent/duplicate request
      const { data: sessionData } = await supabase.auth.getUser();
      if (!sessionData?.user) {
        throw exchangeError;
      }
    }

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
      role: requestedRole === "candidate" || requestedRole === "recruiter" || requestedRole === "partner" ? requestedRole : undefined,
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
    const shouldShowPasswordSetup = (result.isNew || mode === "register") && !result.hasPassword;
    const finalDestination = shouldShowPasswordSetup
      ? `/auth/setup-password?role=${result.role}&next=${encodeURIComponent(destination)}`
      : destination;

    if (isPopup) {
      return popupSuccessResponse({
        isNew: result.isNew,
        hasPassword: Boolean(result.hasPassword),
        role: result.role,
        destination: finalDestination,
      });
    }

    return NextResponse.redirect(new URL(finalDestination, requestUrl.origin));
  } catch (error) {
    console.error("Verifikasi email gagal:", error);

    // Fail-safe recovery: if somehow a ROLE_MISMATCH is still thrown, recover by syncing with existing user role
    if (error instanceof Error && error.message.startsWith("ROLE_MISMATCH:")) {
      try {
        const supabase = await createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const recoveredResult = await syncAuthenticatedUser(userData.user, {
            allowRoleFallback: true,
          });
          const recoveredDest = resolveRoleDestination(
            recoveredResult.role,
            next,
            recoveredResult.isNew,
            recoveredResult.hasSubmittedOnboarding,
            recoveredResult.provisioningStatus
          );
          if (isPopup) {
            return popupSuccessResponse({
              isNew: recoveredResult.isNew,
              hasPassword: Boolean(recoveredResult.hasPassword),
              role: recoveredResult.role,
              destination: recoveredDest,
            });
          }
          return NextResponse.redirect(new URL(recoveredDest, requestUrl.origin));
        }
      } catch (recoverErr) {
        console.error("Gagal pemulihan peran:", recoverErr);
      }
    }

    const fallbackUrl = new URL("/login?error=Verifikasi+email+gagal", requestUrl.origin).toString();
    if (isPopup) {
      return popupErrorResponse("Verifikasi email gagal", fallbackUrl);
    }
    return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin));
  }
}
