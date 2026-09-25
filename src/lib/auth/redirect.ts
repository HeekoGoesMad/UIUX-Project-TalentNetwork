export const ALLOWED_REDIRECT_PREFIXES = [
  "/candidate",
  "/recruiter",
  "/partner",
  "/admin",
  "/dashboard",
  "/search",
  "/shortlist",
  "/talent",
  "/jobs",
  "/messages",
  "/profile",
  "/pricing",
  "/auth/setup-password",
] as const;

export function safeRedirectPath(url: unknown, fallback = "/dashboard"): string {
  if (typeof url !== "string") return fallback;
  const trimmed = url.trim();
  // Ensure starts with a single '/' and not protocol-relative '//'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  // Reject backslashes, schemes, and control characters to prevent open redirects and XSS
  if (trimmed.includes("\\") || trimmed.includes(":") || /[\u0000-\u001F\u007F-\u009F]/.test(trimmed)) {
    return fallback;
  }
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) =>
      trimmed === prefix ||
      trimmed.startsWith(`${prefix}/`) ||
      trimmed.startsWith(`${prefix}?`)
  );
  return isAllowed ? trimmed : fallback;
}

export function sanitizeNextParam(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes(":") ||
    /[\u0000-\u001F\u007F-\u009F]/.test(trimmed)
  ) {
    return null;
  }
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) =>
      trimmed === prefix ||
      trimmed.startsWith(`${prefix}/`) ||
      trimmed.startsWith(`${prefix}?`)
  );
  return isAllowed ? trimmed : null;
}
