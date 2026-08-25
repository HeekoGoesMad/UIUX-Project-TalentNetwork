"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Circle, Mail, Save, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { useApp } from "@/providers/app-provider";

type QuietHours = { start?: string; end?: string; timezone?: string };
type NotificationPreferences = { inAppEnabled: boolean; emailEnabled: boolean; quietHours: QuietHours };
const preferencesKey = "proofylink-demo-notification-preferences-v1";
const defaultPreferences: NotificationPreferences = { inAppEnabled: true, emailEnabled: true, quietHours: {} };

export default function NotificationsPage() {
  const { user, hydrated, dbMode, bootstrapped, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const router = useRouter();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/notifications")}`);
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!hydrated || !user) return;
    let active = true;
    if (!dbMode) {
      void Promise.resolve().then(() => {
        if (!active) return;
        try {
          const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? "null") as Partial<NotificationPreferences> | null;
          setPreferences({ ...defaultPreferences, ...saved, quietHours: { ...defaultPreferences.quietHours, ...saved?.quietHours } });
        } catch { setPreferences(defaultPreferences); }
        setPreferencesLoading(false);
      });
      return () => { active = false; };
    }
    void fetch("/api/notification-preferences", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { preferences?: NotificationPreferences; error?: string };
      if (!response.ok || !payload.preferences) throw new Error(payload.error ?? "Preferensi belum dapat dimuat.");
      if (active) setPreferences(payload.preferences);
    }).catch((reason: unknown) => { if (active) setPreferencesMessage(reason instanceof Error ? reason.message : "Preferensi belum dapat dimuat."); }).finally(() => { if (active) setPreferencesLoading(false); });
    return () => { active = false; };
  }, [dbMode, hydrated, user]);

  if (!hydrated || !user) return <StateMessage text="Menyiapkan notifikasi..." />;
  if (dbMode && !bootstrapped) return <StateMessage text="Memuat notifikasi..." />;

  async function markRead(id: string) {
    await markNotificationRead(id);
  }

  async function markAllRead() {
    await markAllNotificationsRead();
  }

  async function savePreferences() {
    setPreferencesSaving(true);
    setPreferencesMessage(null);
    try {
      if (!dbMode) {
        localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      } else {
        const response = await fetch("/api/notification-preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preferences) });
        const payload = await response.json() as { preferences?: NotificationPreferences; error?: string };
        if (!response.ok || !payload.preferences) throw new Error(payload.error ?? "Preferensi belum dapat disimpan.");
        setPreferences(payload.preferences);
      }
      setPreferencesMessage("Preferensi disimpan.");
    } catch (reason) { setPreferencesMessage(reason instanceof Error ? reason.message : "Preferensi belum dapat disimpan."); }
    finally { setPreferencesSaving(false); }
  }

  return (
    <main className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#19a974]">Pusat informasi</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0a1628]">Notifikasi</h1>
            <p className="mt-2 text-muted-foreground">Pantau pembaruan consent, pesan, dan aktivitas penting di workspace Anda.</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!unreadCount}>
            <CheckCheck className="size-4" /> Tandai semua dibaca
          </Button>
        </div>

        <Card aria-labelledby="notification-preferences-title">
          <CardHeader className="border-b bg-secondary/60"><CardTitle id="notification-preferences-title" className="text-lg">Preferensi notifikasi</CardTitle><p className="text-sm text-muted-foreground">Pilih kanal yang boleh digunakan untuk pembaruan akun dan aktivitas penting.</p></CardHeader>
          <CardContent className="space-y-6 p-6">
            {preferencesLoading ? <p role="status" className="text-sm text-muted-foreground">Memuat preferensi...</p> : <>
              <div className="grid gap-4 sm:grid-cols-2">
                <PreferenceToggle icon={<Smartphone className="size-4" />} label="Notifikasi dalam aplikasi" checked={preferences.inAppEnabled} onChange={(checked) => setPreferences((current) => ({ ...current, inAppEnabled: checked }))} />
                <PreferenceToggle icon={<Mail className="size-4" />} label="Email" checked={preferences.emailEnabled} onChange={(checked) => setPreferences((current) => ({ ...current, emailEnabled: checked }))} />
              </div>
              <fieldset className="space-y-3"><legend className="text-sm font-semibold">Jam tenang (opsional)</legend><p className="text-xs text-muted-foreground">Pembaruan email tidak dikirim pada rentang ini. Waktu mengikuti zona perangkat Anda.</p><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium">Mulai<input type="time" value={preferences.quietHours.start ?? ""} onChange={(event) => setPreferences((current) => ({ ...current, quietHours: { ...current.quietHours, start: event.target.value || undefined } }))} className="mt-1 block h-10 w-full rounded-xl border bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label><label className="space-y-1 text-sm font-medium">Selesai<input type="time" value={preferences.quietHours.end ?? ""} onChange={(event) => setPreferences((current) => ({ ...current, quietHours: { ...current.quietHours, end: event.target.value || undefined } }))} className="mt-1 block h-10 w-full rounded-xl border bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label></div></fieldset>
              <div className="flex flex-wrap items-center gap-3"><Button onClick={() => void savePreferences()} disabled={preferencesSaving}><Save className="size-4" />{preferencesSaving ? "Menyimpan..." : "Simpan preferensi"}</Button>{preferencesMessage && <p className="text-sm text-muted-foreground" role="status">{preferencesMessage}</p>}</div>
            </>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-[#f0f6fd]/70">
            <CardTitle className="flex items-center gap-2 text-lg"><Bell className="size-5 text-[#19a974]" /> {unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? <EmptyState icon={Bell} title="Belum ada notifikasi." className="border-0 shadow-none" /> : notifications.map((notification) => {
              const unread = !notification.readAt;
              const href = "href" in notification ? (notification as { href?: string }).href : undefined;
              return <article key={notification.id} className={`flex gap-4 border-b p-5 last:border-0 ${unread ? "bg-[#f7fcfa]" : "bg-white"}`}>
                <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${unread ? "bg-[#d7f5e8] text-[#08744f]" : "bg-[#f0f6fd] text-slate-400"}`} aria-hidden="true"><Circle className={`size-2.5 fill-current ${unread ? "" : "opacity-40"}`} /></span>
                <div className="min-w-0 flex-1">
                   <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><h2 className={`font-semibold ${unread ? "text-[#0a1628]" : "text-slate-600"}`}>{href ? <Link href={href} onClick={() => { if (unread) void markRead(notification.id); }} className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{notification.title}</Link> : notification.title}</h2><time className="shrink-0 text-xs text-muted-foreground" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</time></div>
                  {notification.body && <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>}
                  {unread && <Button variant="ghost" size="sm" className="mt-2 h-auto px-0 text-[#08744f]" onClick={() => void markRead(notification.id)}>Tandai sudah dibaca</Button>}
                </div>
              </article>;
            })}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PreferenceToggle({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:bg-accent"><span className="flex items-center gap-3 text-sm font-semibold">{icon}{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label>;
}

function StateMessage({ text }: { text: string }) { return <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground" role="status">{text}</div>; }
