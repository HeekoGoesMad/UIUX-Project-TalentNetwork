import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type DocumentStorageResult = {
  provider: "development-mock" | "supabase-storage";
  storagePath: string;
  status: "stored" | "demo-only";
};

export class DocumentStorageConfigurationError extends Error {}

/** Storage boundary. The development adapter intentionally does not persist bytes. */
export async function storeCvDocument(input: { key: string; bytes: Uint8Array; contentType: string }): Promise<DocumentStorageResult> {
  const bucket = process.env.SUPABASE_CV_BUCKET?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // If Supabase is not configured, fallback gracefully in development mock mode
  if (!bucket || !url || (!anonKey && !serviceKey)) {
    if (process.env.NODE_ENV === "development") {
      void input.bytes;
      void input.contentType;
      return { provider: "development-mock", storagePath: `development-mock/${input.key}`, status: "demo-only" };
    }
    throw new DocumentStorageConfigurationError("Supabase Storage CV belum dikonfigurasi. Isi SUPABASE_CV_BUCKET dan Supabase URL/key.");
  }

  let supabase;
  if (serviceKey) {
    supabase = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } else {
    supabase = await createClient();
  }

  const { error } = await supabase.storage.from(bucket).upload(input.key, input.bytes, {
    contentType: input.contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
  return { provider: "supabase-storage", storagePath: `${bucket}/${input.key}`, status: "stored" };
}

/** Short-lived download URL TTL in seconds. */
export const CV_DOWNLOAD_URL_TTL_SECONDS = 60;

/**
 * Creates a short-lived signed download URL for a stored CV document.
 * Returns null when downloads are unavailable (dev-mock path, service-role
 * key not configured, or signing failure) — callers must keep serving
 * metadata without a download URL in that case.
 */
export async function createCvDownloadUrl(storagePath: string): Promise<string | null> {
  if (storagePath.startsWith("development-mock/")) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    console.warn("[cv-storage] SUPABASE_SERVICE_ROLE_KEY is not configured; serving document metadata without a download URL.");
    return null;
  }
  const slash = storagePath.indexOf("/");
  if (slash <= 0) return null;
  const bucket = storagePath.slice(0, slash);
  const key = storagePath.slice(slash + 1);
  if (!bucket || !key) return null;
  const supabase = createSupabaseClient(url, serviceRoleKey);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, CV_DOWNLOAD_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.warn(`[cv-storage] signed URL creation failed: ${error?.message ?? "unknown error"}`);
    return null;
  }
  return data.signedUrl;
}
