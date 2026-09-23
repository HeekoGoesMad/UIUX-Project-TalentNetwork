import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export async function POST(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request harus berupa multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Gagal memproses data unggahan." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Berkas logo perusahaan tidak ditemukan." },
        { status: 400 }
      );
    }

    if (file.size > MAX_LOGO_BYTES) {
      return NextResponse.json(
        { error: "Ukuran berkas logo maksimal 5MB." },
        { status: 400 }
      );
    }

    const mime = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: "Format gambar tidak didukung. Gunakan PNG, JPEG, WebP, atau SVG." },
        { status: 400 }
      );
    }

    const orgId = scope.membership.organizationId;
    const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/svg+xml" ? "svg" : "jpg";
    const fileName = `logo-${Date.now()}.${extension}`;
    const storageKey = `logos/${orgId}/${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const bucket = process.env.SUPABASE_COMPANY_LOGOS_BUCKET?.trim() || "company-logos";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    let storageClient;
    if (supabaseUrl && serviceKey) {
      storageClient = createSupabaseClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      storageClient = await createClient().catch(() => null);
    }

    if (!storageClient || !supabaseUrl) {
      // Development mock fallback
      const mockUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80`;
      return NextResponse.json({
        url: mockUrl,
        storagePath: `${bucket}/${storageKey}`,
        isMock: true,
      });
    }

    const { error: uploadError } = await storageClient.storage
      .from(bucket)
      .upload(storageKey, bytes, {
        contentType: mime,
        upsert: true,
      });

    if (uploadError) {
      console.error("[company-logo] Gagal mengunggah logo ke Supabase storage:", uploadError);
      return NextResponse.json(
        { error: `Gagal mengunggah logo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = storageClient.storage
      .from(bucket)
      .getPublicUrl(storageKey);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      storagePath: `${bucket}/${storageKey}`,
      isMock: false,
    });
  } catch (err) {
    console.error("[company-logo] Error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses unggahan logo." },
      { status: 500 }
    );
  }
}
