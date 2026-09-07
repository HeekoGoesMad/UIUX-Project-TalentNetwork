import "server-only";

import { createClient } from "@/lib/supabase/server";
import { sanitizeMediaName } from "./validation";

export {
  MAX_AVATAR_BYTES,
  MAX_BANNER_BYTES,
  ALLOWED_IMAGE_MIME,
  detectImageMime,
  validateProfileImage,
  sanitizeMediaName,
  type AllowedImageMime,
} from "./validation";

export class ProfileMediaConfigurationError extends Error {}

export type ProfileMediaStorageResult = {
  provider: "development-mock" | "supabase-storage";
  publicUrl: string;
  storagePath: string;
  status: "stored" | "demo-only";
};

export async function storeProfileMedia(input: {
  userId: string;
  fileName: string;
  bytes: Uint8Array;
  type: "avatar" | "banner";
  contentType: string;
}): Promise<ProfileMediaStorageResult> {
  const bucket = process.env.SUPABASE_PROFILE_MEDIA_BUCKET?.trim() || "profile-media";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const safeName = sanitizeMediaName(input.fileName);
  const ext = input.contentType.split("/")[1] ?? "jpg";
  const key = `${input.type}s/${input.userId}/${crypto.randomUUID()}-${safeName}.${ext}`;

  if (process.env.NODE_ENV === "development" && (!url || !anonKey)) {
    return {
      provider: "development-mock",
      publicUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
      storagePath: `development-mock/${key}`,
      status: "demo-only",
    };
  }

  if (!url || !anonKey) {
    throw new ProfileMediaConfigurationError(
      "Supabase Storage belum dikonfigurasi. Hubungi administrator."
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from(bucket).upload(key, input.bytes, {
    contentType: input.contentType,
    cacheControl: "31536000",
    upsert: true,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);

  return {
    provider: "supabase-storage",
    publicUrl: data.publicUrl,
    storagePath: `${bucket}/${key}`,
    status: "stored",
  };
}
