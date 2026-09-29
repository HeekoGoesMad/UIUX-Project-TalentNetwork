import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Strips country code (+62 or 62) and leading zeroes from an Indonesian phone number.
 * Returns only the local digits (e.g., "81234567890").
 */
export function extractIndonesianLocalPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+62")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("62")) {
    cleaned = cleaned.slice(2);
  }
  return cleaned.replace(/\D/g, "").replace(/^0+/, "");
}

/**
 * Formats local digits to standard E.164 (+62...) format.
 */
export function formatToE164Indonesian(localDigits: string | null | undefined): string {
  if (!localDigits) return "";
  const digits = extractIndonesianLocalPhone(localDigits);
  return digits ? `+62${digits}` : "";
}

/**
 * Strips leading currency prefix (Rp, Rp., IDR) and intermediate redundant Rp in ranges from a salary string.
 * Returns only the value content (e.g. "18.000.000 – 25.000.000 / bln").
 */
export function extractSalaryValue(salary: string | null | undefined): string {
  if (!salary) return "";
  return salary
    .replace(/^(?:rp\.?|idr)\s*/i, "")
    .replace(/(\s*[-–—]\s*)(?:rp\.?|idr)\s*/gi, "$1");
}

/**
 * Formats salary value with standard "Rp " prefix.
 */
export function formatSalaryValue(val: string | null | undefined): string {
  if (!val) return "";
  const cleaned = extractSalaryValue(val);
  return cleaned.trim() ? `Rp ${cleaned.replace(/^\s+/, "")}` : "";
}

/**
 * Validates whether a given string is a plausible website URL.
 * Protects against ReDoS (polynomial regular expression backtracking)
 * by utilizing the WHATWG URL constructor rather than complex nested regexes.
 */
export function isValidWebsiteUrl(val: string | null | undefined): boolean {
  const trimmed = String(val || "").trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return false;
  try {
    const urlStr = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(urlStr);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname.length >= 3 &&
      parsed.hostname.includes(".") &&
      !parsed.hostname.startsWith(".") &&
      !parsed.hostname.endsWith(".")
    );
  } catch {
    return false;
  }
}

