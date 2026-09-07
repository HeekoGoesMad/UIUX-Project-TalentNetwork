import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type MessageStorageResult = {
  provider: "development-mock" | "supabase-storage";
  storagePath: string;
  status: "stored" | "demo-only";
};

export class MessageStorageConfigurationError extends Error {}

/** Storage boundary. The development adapter intentionally does not persist bytes. */
export async function storeMessageAttachment(input: { key: string; bytes: Uint8Array; contentType: string }): Promise<MessageStorageResult> {
  if (process.env.NODE_ENV === "development") {
    void input.bytes;
    void input.contentType;
    return { provider: "development-mock", storagePath: `development-mock/${input.key}`, status: "demo-only" };
  }

  const bucket = process.env.SUPABASE_MESSAGE_BUCKET?.trim();
  if (!bucket || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new MessageStorageConfigurationError("Supabase Storage pesan belum dikonfigurasi. Isi SUPABASE_MESSAGE_BUCKET dan Supabase URL/key.");
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).upload(input.key, input.bytes, {
    contentType: input.contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);
  return { provider: "supabase-storage", storagePath: `${bucket}/${input.key}`, status: "stored" };
}

/** Short-lived download URL TTL in seconds. */
export const MESSAGE_DOWNLOAD_URL_TTL_SECONDS = 60;

/**
 * Creates a short-lived signed download URL for a stored message attachment.
 * Key format is built by the route (not here):
 * `conversations/{conversationId}/{messageUuid}/{safeName}`.
 * Returns null when downloads are unavailable (dev-mock path, service-role
 * key not configured, or signing failure) — callers must keep serving
 * metadata without a download URL in that case.
 */
export async function createMessageDownloadUrl(storagePath: string): Promise<string | null> {
  if (storagePath.startsWith("development-mock/")) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) {
    console.warn("[message-storage] SUPABASE_SERVICE_ROLE_KEY is not configured; serving attachment metadata without a download URL.");
    return null;
  }
  const slash = storagePath.indexOf("/");
  if (slash <= 0) return null;
  const bucket = storagePath.slice(0, slash);
  const key = storagePath.slice(slash + 1);
  if (!bucket || !key) return null;
  const supabase = createSupabaseClient(url, serviceRoleKey);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(key, MESSAGE_DOWNLOAD_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.warn(`[message-storage] signed URL creation failed: ${error?.message ?? "unknown error"}`);
    return null;
  }
  return data.signedUrl;
}
