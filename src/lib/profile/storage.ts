import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { extractStorageKey, sanitizeMediaName } from "./validation";

export {
  MAX_AVATAR_BYTES,
  MAX_BANNER_BYTES,
  ALLOWED_IMAGE_MIME,
  detectImageMime,
  validateProfileImage,
  sanitizeMediaName,
  extractStorageKey,
  type AllowedImageMime,
} from "./validation";

export class ProfileMediaConfigurationError extends Error {}

export type ProfileMediaStorageResult = {
  provider: "development-mock" | "supabase-storage";
  publicUrl: string;
  storagePath: string;
  status: "stored" | "demo-only";
};

async function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || (!anonKey && !serviceKey)) {
    return null;
  }

  if (serviceKey) {
    return createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return await createClient();
}

export async function deleteProfileMedia(storageKeyOrUrl: string): Promise<boolean> {
  const bucket = process.env.SUPABASE_PROFILE_MEDIA_BUCKET?.trim() || "profile-media";
  const key = extractStorageKey(storageKeyOrUrl, bucket);
  if (!key) return false;

  const client = await getStorageClient();
  if (!client) {
    // In dev-mock mode without credentials, treat deletion as successful
    return true;
  }

  try {
    const { error } = await client.storage.from(bucket).remove([key]);
    if (error) {
      console.warn(`[profile-storage] Gagal menghapus media "${key}": ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[profile-storage] Error saat menghapus media:`, err);
    return false;
  }
}

export async function storeProfileMedia(input: {
  userId: string;
  fileName: string;
  bytes: Uint8Array;
  type: "avatar" | "banner";
  contentType: string;
  previousUrl?: string | null;
}): Promise<ProfileMediaStorageResult> {
  const bucket = process.env.SUPABASE_PROFILE_MEDIA_BUCKET?.trim() || "profile-media";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  const safeName = sanitizeMediaName(input.fileName);
  const ext = input.contentType.split("/")[1] ?? "jpg";
  const key = `${input.type}s/${input.userId}/${crypto.randomUUID()}-${safeName}.${ext}`;

  if (process.env.NODE_ENV === "development" && (!url || (!anonKey && !serviceKey))) {
    return {
      provider: "development-mock",
      publicUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
      storagePath: `development-mock/${key}`,
      status: "demo-only",
    };
  }

  if (!url || (!anonKey && !serviceKey)) {
    throw new ProfileMediaConfigurationError(
      "Supabase Storage belum dikonfigurasi. Hubungi administrator."
    );
  }

  const client = await getStorageClient();
  if (!client) {
    throw new ProfileMediaConfigurationError("Gagal menginisialisasi client Supabase Storage.");
  }

  const { error } = await client.storage.from(bucket).upload(key, input.bytes, {
    contentType: input.contentType,
    cacheControl: "31536000",
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(key);

  // If there was a previous media URL from our bucket, clean it up immediately to avoid bloat
  if (input.previousUrl) {
    void deleteProfileMedia(input.previousUrl).catch((err) => {
      console.warn("[profile-storage] Cleanup of previous media failed:", err);
    });
  }

  return {
    provider: "supabase-storage",
    publicUrl: data.publicUrl,
    storagePath: `${bucket}/${key}`,
    status: "stored",
  };
}

export async function recoverAvatarFromStorage(userId: string): Promise<string | null> {
  const bucket = process.env.SUPABASE_PROFILE_MEDIA_BUCKET?.trim() || "profile-media";
  const client = await getStorageClient();
  if (!client) return null;

  try {
    const { data: files, error } = await client.storage.from(bucket).list(`avatars/${userId}`, {
      sortBy: { column: "created_at", order: "desc" },
      limit: 10,
    });
    if (error || !files || files.length === 0) return null;

    const validFile = files.find((f) => f.name && !f.name.startsWith("."));
    if (!validFile) return null;

    const { data } = client.storage.from(bucket).getPublicUrl(`avatars/${userId}/${validFile.name}`);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.warn("[profile-storage] Gagal memulihkan avatar dari storage:", err);
    return null;
  }
}
