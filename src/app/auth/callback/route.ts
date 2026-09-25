import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";

function safeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

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
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(payload, window.location.origin);
          setTimeout(function() { window.close(); }, 150);
          return;
        } catch (e) {
          console.error("postMessage error:", e);
        }
      }
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
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: "GOOGLE_AUTH_ERROR", error: errorMsg }, window.location.origin);
          setTimeout(function() { window.close(); }, 150);
          return;
        } catch (e) {}
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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) throw userError ?? new Error("Sesi verifikasi tidak ditemukan.");

    const metadataRole = data.user.user_metadata?.role;
    const result = await syncAuthenticatedUser(data.user, {
      name: typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : undefined,
      companyName: typeof data.user.user_metadata?.companyName === "string" ? data.user.user_metadata.companyName : undefined,
      role: requestedRole === "candidate" || requestedRole === "recruiter" || requestedRole === "partner" ? requestedRole : undefined,
    });

    const fallback =
      result.role === "admin"
        ? "/admin"
        : result.role === "candidate"
        ? (result.isNew || result.hasSubmittedOnboarding === false ? "/candidate/onboarding" : "/candidate")
        : result.role === "partner"
        ? (result.isNew ? "/partner/onboarding" : result.provisioningStatus === "active" ? "/partner" : "/partner/pending")
        : (result.isNew || result.hasSubmittedOnboarding === false ? "/recruiter/onboarding" : result.provisioningStatus === "active" ? "/dashboard" : "/recruiter/pending");
    let destination = safeNext(next, fallback);
    if (result.role === "candidate") {
      if (result.hasSubmittedOnboarding === true && destination.startsWith("/candidate/onboarding")) {
        destination = "/candidate";
      } else if (result.hasSubmittedOnboarding === false && !destination.startsWith("/candidate/onboarding")) {
        destination = "/candidate/onboarding";
      }
    }
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

    // Handle ROLE_MISMATCH specifically so the user sees which role tab to switch to
    if (error instanceof Error && error.message.startsWith("ROLE_MISMATCH:")) {
      // Sign out the session created by exchangeCodeForSession so the
      // client-side onAuthStateChange listener doesn't auto-redirect the user
      const supabase = await createClient();
      await supabase.auth.signOut().catch(() => {});

      const [, actualRole] = error.message.split(":");
      const roleLabel =
        actualRole === "candidate" ? "Talent / Candidate"
        : actualRole === "recruiter" ? "Recruiter / Hiring"
        : actualRole === "partner" ? "Partnership"
        : actualRole;
      const msg = `Akun Google ini terdaftar sebagai ${roleLabel}. Silakan pilih peran ${roleLabel} untuk masuk.`;
      const fallbackUrl = new URL(`/login?error=${encodeURIComponent(msg)}`, requestUrl.origin).toString();

      if (isPopup) {
        return popupErrorResponse(msg, fallbackUrl);
      }
      return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin));
    }

    const fallbackUrl = new URL("/login?error=Verifikasi+email+gagal", requestUrl.origin).toString();
    if (isPopup) {
      return popupErrorResponse("Verifikasi email gagal", fallbackUrl);
    }
    return NextResponse.redirect(new URL(fallbackUrl, requestUrl.origin));
  }
}
