import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import {
  extractStorageKey,
  sanitizeMediaName,
  validateLogoImage,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/server";

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

    const rate = enforceRateLimit(`company-logo:${current.user.id}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan unggah logo. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
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

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateLogoImage({ bytes });
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const orgId = scope.membership.organizationId;
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

    const safeName = sanitizeMediaName(file.name);
    const extension =
      validation.mime === "image/png"
        ? "png"
        : validation.mime === "image/webp"
          ? "webp"
          : validation.mime === "image/svg+xml"
            ? "svg"
            : "jpg";
    const storageKey = `logos/${orgId}/${crypto.randomUUID()}-${safeName}.${extension}`;

    if (!storageClient || !supabaseUrl) {
      // Development mock fallback
      const mockUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80`;
      await current.db
        .update(schema.organizations)
        .set({ logoUrl: mockUrl, updatedAt: new Date() })
        .where(eq(schema.organizations.id, orgId));

      return NextResponse.json({
        url: mockUrl,
        storagePath: `${bucket}/${storageKey}`,
        isMock: true,
      });
    }

    // Retrieve previous logo URL to clean up old file from storage bucket on replace
    const [existingOrg] = await current.db
      .select({ logoUrl: schema.organizations.logoUrl })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))
      .limit(1);

    const previousKey = extractStorageKey(existingOrg?.logoUrl, bucket);
    if (previousKey) {
      void storageClient.storage
        .from(bucket)
        .remove([previousKey])
        .catch((err) => {
          console.warn("[company-logo] Gagal menghapus logo lama:", err);
        });
    }

    const { error: uploadError } = await storageClient.storage
      .from(bucket)
      .upload(storageKey, bytes, {
        contentType: validation.mime,
        cacheControl: "31536000",
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

    const publicUrl = publicUrlData.publicUrl;

    // Immediately persist logoUrl to organization in DB
    await current.db
      .update(schema.organizations)
      .set({ logoUrl: publicUrl, updatedAt: new Date() })
      .where(eq(schema.organizations.id, orgId));

    await writeAuditLog({
      db: current.db,
      actorUserId: current.user.id,
      action: "recruiter.organization.logo_updated",
      entityType: "organization",
      entityId: orgId,
      metadata: { url: publicUrl },
    });

    return NextResponse.json({
      url: publicUrl,
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

export async function DELETE() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const rate = enforceRateLimit(`company-logo-delete:${current.user.id}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const orgId = scope.membership.organizationId;
    const bucket = process.env.SUPABASE_COMPANY_LOGOS_BUCKET?.trim() || "company-logos";

    const [existingOrg] = await current.db
      .select({ logoUrl: schema.organizations.logoUrl })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))
      .limit(1);

    if (existingOrg?.logoUrl) {
      const storageKey = extractStorageKey(existingOrg.logoUrl, bucket);
      if (storageKey) {
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

        if (storageClient) {
          await storageClient.storage.from(bucket).remove([storageKey]).catch((err) => {
            console.warn("[company-logo] Gagal menghapus logo saat delete:", err);
          });
        }
      }
    }

    await current.db
      .update(schema.organizations)
      .set({ logoUrl: null, updatedAt: new Date() })
      .where(eq(schema.organizations.id, orgId));

    await writeAuditLog({
      db: current.db,
      actorUserId: current.user.id,
      action: "recruiter.organization.logo_deleted",
      entityType: "organization",
      entityId: orgId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[company-logo] Gagal menghapus logo perusahaan:", err);
    return NextResponse.json(
      { error: "Gagal menghapus logo perusahaan saat ini." },
      { status: 500 }
    );
  }
}
