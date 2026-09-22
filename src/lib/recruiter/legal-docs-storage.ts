import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type LegalDocStorageResult = {
  provider: "development-mock" | "supabase-storage";
  storagePath: string;
  status: "stored" | "demo-only";
};

export class LegalDocStorageConfigurationError extends Error {}

/** Short-lived download URL TTL in seconds. */
export const LEGAL_DOC_DOWNLOAD_URL_TTL_SECONDS = 60;

/** Storage boundary for company legal documents (NIB, NPWP, etc.). */
export async function storeLegalDocument(input: {
  key: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<LegalDocStorageResult> {
  const configuredBucket = process.env.SUPABASE_LEGAL_DOCS_BUCKET?.trim();
  const bucket = configuredBucket || "legal-documents";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // If Supabase is not configured or bucket is missing in local development, fallback gracefully to mock
  if (
    !configuredBucket ||
    !url ||
    (!anonKey && !serviceKey) ||
    (process.env.NODE_ENV === "development" && !serviceKey)
  ) {
    if (process.env.NODE_ENV === "development") {
      void input.bytes;
      void input.contentType;
      return {
        provider: "development-mock",
        storagePath: `development-mock/${input.key}`,
        status: "demo-only",
      };
    }
    throw new LegalDocStorageConfigurationError(
      "Supabase Storage Legal Docs belum dikonfigurasi. Isi SUPABASE_LEGAL_DOCS_BUCKET dan Supabase URL/key."
    );
  }

  let supabase;
  if (serviceKey) {
    supabase = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } else {
    supabase = await createClient();
  }

  try {
    const { error } = await supabase.storage.from(bucket).upload(input.key, input.bytes, {
      contentType: input.contentType,
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[legal-docs-storage] Supabase Storage upload failed (${error.message}). Falling back to development-mock.`
        );
        return {
          provider: "development-mock",
          storagePath: `development-mock/${input.key}`,
          status: "demo-only",
        };
      }
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }
    return {
      provider: "supabase-storage",
      storagePath: `${bucket}/${input.key}`,
      status: "stored",
    };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[legal-docs-storage] Supabase Storage error in development; falling back to development-mock:`,
        err
      );
      return {
        provider: "development-mock",
        storagePath: `development-mock/${input.key}`,
        status: "demo-only",
      };
    }
    throw err;
  }
}

/**
 * Creates a short-lived signed download URL for a stored legal document.
 * Returns null when downloads are unavailable (dev-mock path, service-role
 * key not configured, or signing failure).
 */
export async function createLegalDocDownloadUrl(storagePath: string): Promise<string | null> {
  if (storagePath.startsWith("development-mock/")) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    console.warn(
      "[legal-docs-storage] SUPABASE_SERVICE_ROLE_KEY is not configured; cannot create download URL."
    );
    return null;
  }
  const slash = storagePath.indexOf("/");
  if (slash <= 0) return null;
  const bucket = storagePath.slice(0, slash);
  const key = storagePath.slice(slash + 1);
  if (!bucket || !key) return null;
  const supabase = createSupabaseClient(url, serviceRoleKey);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, LEGAL_DOC_DOWNLOAD_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.warn(
      `[legal-docs-storage] signed URL creation failed: ${error?.message ?? "unknown error"}`
    );
    return null;
  }
  return data.signedUrl;
}
