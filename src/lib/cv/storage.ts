import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DocumentStorageResult = {
  provider: "development-mock" | "supabase-storage";
  storagePath: string;
  status: "stored" | "demo-only";
};

export class DocumentStorageConfigurationError extends Error {}

/** Storage boundary. The development adapter intentionally does not persist bytes. */
export async function storeCvDocument(input: { key: string; bytes: Uint8Array; contentType: string }): Promise<DocumentStorageResult> {
  if (process.env.NODE_ENV === "development") {
    void input.bytes;
    void input.contentType;
    return { provider: "development-mock", storagePath: `development-mock/${input.key}`, status: "demo-only" };
  }

  const bucket = process.env.SUPABASE_CV_BUCKET?.trim();
  if (!bucket || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new DocumentStorageConfigurationError("Supabase Storage CV belum dikonfigurasi. Isi SUPABASE_CV_BUCKET dan Supabase URL/key.");
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
