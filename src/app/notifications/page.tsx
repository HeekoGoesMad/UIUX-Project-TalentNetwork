"use client";

import { useEffect } from "react";
import { Bell, CheckCheck, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { useApp } from "@/providers/app-provider";

export default function NotificationsPage() {
  const { user, hydrated, dbMode, bootstrapped, notifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const router = useRouter();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/notifications")}`);
  }, [hydrated, user, router]);

  if (!hydrated || !user) return <StateMessage text="Menyiapkan notifikasi..." />;
  if (dbMode && !bootstrapped) return <StateMessage text="Memuat notifikasi..." />;

  async function markRead(id: string) {
    await markNotificationRead(id);
  }

  async function markAllRead() {
    await markAllNotificationsRead();
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

        <Card>
          <CardHeader className="border-b bg-[#f0f6fd]/70">
            <CardTitle className="flex items-center gap-2 text-lg"><Bell className="size-5 text-[#19a974]" /> {unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? <EmptyState icon={Bell} title="Belum ada notifikasi." className="border-0 shadow-none" /> : notifications.map((notification) => {
              const unread = !notification.readAt;
              return <article key={notification.id} className={`flex gap-4 border-b p-5 last:border-0 ${unread ? "bg-[#f7fcfa]" : "bg-white"}`}>
                <span className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${unread ? "bg-[#d7f5e8] text-[#08744f]" : "bg-[#f0f6fd] text-slate-400"}`} aria-hidden="true"><Circle className={`size-2.5 fill-current ${unread ? "" : "opacity-40"}`} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><h2 className={`font-semibold ${unread ? "text-[#0a1628]" : "text-slate-600"}`}>{notification.title}</h2><time className="shrink-0 text-xs text-muted-foreground" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</time></div>
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

function StateMessage({ text }: { text: string }) { return <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground" role="status">{text}</div>; }
