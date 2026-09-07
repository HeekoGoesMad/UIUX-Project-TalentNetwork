import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const a11ySchema = z.object({
  textScale: z.enum(["normal", "large", "xlarge"]),
  highContrast: z.boolean(),
  reduceMotion: z.boolean(),
  enhancedFocus: z.boolean(),
  relaxedSpacing: z.boolean(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ preferences: null });
    }

    const a11yPrefs = user.user_metadata?.a11y_prefs ?? null;
    return NextResponse.json({ preferences: a11yPrefs });
  } catch (error) {
    console.error("Gagal memuat preferensi aksesibilitas:", error);
    return NextResponse.json({ preferences: null });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = a11ySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Format preferensi aksesibilitas tidak valid." }, { status: 400 });
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        a11y_prefs: parsed.data,
      },
    });

    if (updateError) {
      console.error("Gagal menyimpan preferensi ke user_metadata:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences: parsed.data });
  } catch (error) {
    console.error("Gagal memperbarui preferensi aksesibilitas:", error);
    return NextResponse.json({ error: "Gagal menyimpan preferensi." }, { status: 500 });
  }
}
