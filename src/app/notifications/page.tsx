"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  FileCheck2,
  Mail,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";
import type { ConsentState } from "@/types";

type NotificationCategory = "all" | "requests" | "recruitment" | "system";

const TAB_PARAMS: Record<NotificationCategory, string> = {
  all: "all",
  requests: "contact-requests",
  recruitment: "recruitment",
  system: "system",
};

function parseTab(value: string | null): NotificationCategory {
  if (value === "contact-requests") return "requests";
  if (value === "recruitment") return "recruitment";
  if (value === "system") return "system";
  return "all";
}

export default function NotificationsPage() {
  const {
    user,
    hydrated,
    dbMode,
    bootstrapped,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    consentRequests,
    screeningConsents,
    contactRequests,
    respondToConsent,
  } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = parseTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<NotificationCategory>(initialTab);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [staleIds, setStaleIds] = useState<Set<string>>(new Set());

  const changeTab = (tab: NotificationCategory) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `?tab=${TAB_PARAMS[tab]}`);
  };

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(parseTab(new URLSearchParams(window.location.search).get("tab")));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/notifications")}`);
  }, [hydrated, user, router]);

  // Normalized contact requests for candidate
  const formattedRequests = useMemo(() => {
    if (user?.role !== "candidate") return [];
    if (dbMode) {
      return consentRequests
        .map((req) => ({
          itemId: typeof req.itemId === "string" ? req.itemId : String(req.candidateProfileId),
          candidateId: typeof req.candidateProfileId === "string" ? req.candidateProfileId : "",
          state: (req.consentState as ConsentState) || "pending-candidate-consent",
          recruiterName: typeof req.recruiterName === "string" ? req.recruiterName : "Tim Rekruter",
          company: typeof req.organizationName === "string" ? req.organizationName : "Organisasi Mitra",
          email: typeof req.recruiterEmail === "string" ? req.recruiterEmail : null,
          requestedAt: typeof req.createdAt === "string" ? req.createdAt : new Date().toISOString(),
        }))
        .filter((r) => r.candidateId);
    }
    return Object.entries(screeningConsents)
      .filter(([, state]) => state !== "not-requested")
      .map(([candidateId, state]) => ({
        itemId: candidateId,
        candidateId,
        state,
        recruiterName: contactRequests?.[candidateId]?.recruiterName || "Tim Rekruter",
        company: contactRequests?.[candidateId]?.company || "Perusahaan Mitra",
        email: contactRequests?.[candidateId]?.email || null,
        requestedAt: contactRequests?.[candidateId]?.requestedAt || new Date().toISOString(),
      }));
  }, [user, dbMode, consentRequests, screeningConsents, contactRequests]);

  const pendingRequestsCount = formattedRequests.filter((r) => r.state === "pending-candidate-consent").length;
  const unreadNotificationsCount = notifications.filter((n) => !n.readAt).length;

  if (!hydrated || !user) return <StateMessage text="Menyiapkan notifikasi..." />;
  if (dbMode && !bootstrapped) return <StateMessage text="Memuat notifikasi..." />;

  const handleConsentAction = async (candidateId: string, itemId: string, state: "consented" | "declined") => {
    setActingRequestId(itemId);
    try {
      const ok = await respondToConsent(candidateId, state, itemId);
      if (ok) {
        toast.success(state === "consented" ? "Izin kontak telah diberikan" : "Permintaan kontak telah ditolak");
      } else {
        // 409 already-responded (or other failure): inline state, no undo. Provider already toasted.
        setStaleIds((prev) => new Set(prev).add(itemId));
      }
    } catch {
      toast.error("Gagal memperbarui izin kontak");
    } finally {
      setActingRequestId(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    const ok = await markNotificationRead(id);
    if (!ok) toast.error("Gagal menandai notifikasi sebagai dibaca");
  };

  const handleMarkAllRead = async () => {
    const ok = await markAllNotificationsRead();
    if (!ok) toast.error("Gagal menandai semua notifikasi sebagai dibaca");
  };

  // Filtered notifications — tabs filter, never blank the feed
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all" || activeTab === "requests") return true;
    if (activeTab === "recruitment") {
      return n.type === "application_status_changed" || n.type === "screening_ready" || n.type === "message_received";
    }
    if (activeTab === "system") {
      return n.type === "system" || n.type === "verification_result";
    }
    return true;
  });

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Pusat Aktivitas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Notifikasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola izin kontak, jadwal wawancara, dan pesan rekrutmen di satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()} className="text-xs">
              <CheckCheck className="mr-1.5 size-3.5" /> Tandai semua dibaca
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground">
            <Link href="/candidate/settings?tab=notif">
              <Settings2 className="mr-1.5 size-3.5" /> Kelola di Pengaturan
            </Link>
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <TabButton
          label="Semua"
          active={activeTab === "all"}
          onClick={() => changeTab("all")}
          count={unreadNotificationsCount + pendingRequestsCount}
        />
        {user?.role === "candidate" && (
          <TabButton
            label="Permintaan Kontak"
            active={activeTab === "requests"}
            onClick={() => changeTab("requests")}
            count={pendingRequestsCount}
            highlightCount={pendingRequestsCount > 0}
          />
        )}
        <TabButton
          label="Rekrutmen & Wawancara"
          active={activeTab === "recruitment"}
          onClick={() => changeTab("recruitment")}
        />
        <TabButton
          label="Sistem"
          active={activeTab === "system"}
          onClick={() => changeTab("system")}
        />
      </div>

      {/* ── 1-CLICK CONTACT REQUESTS FEED (CANDIDATE PRIVACY) ── */}
      {(activeTab === "all" || activeTab === "requests") && user?.role === "candidate" && formattedRequests.length > 0 && (
        <section className="mt-6 space-y-3" aria-label="Permintaan Kontak">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-600" /> Permintaan Akses Kontak
            </h2>
            {pendingRequestsCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {pendingRequestsCount} perlu persetujuan 1-klik
              </span>
            )}
          </div>

          {formattedRequests.map((req) => {
            const isPending = req.state === "pending-candidate-consent";
            const isConsented = req.state === "consented" || req.state === "screening-completed" || req.state === "screening-in-progress";

            return (
              <Card
                key={req.itemId}
                className={`transition-all duration-200 ${
                  isPending
                    ? "border-emerald-300/80 bg-emerald-50/40 shadow-xs dark:border-emerald-900/60 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                          isPending ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <UserRound className="size-4.5" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{req.recruiterName}</p>
                          <span className="text-xs text-muted-foreground">dari</span>
                          <span className="font-semibold text-xs text-foreground">{req.company}</span>
                          {isPending ? (
                            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 text-[10px] px-2 py-0.2">
                              Menunggu Respon
                            </Badge>
                          ) : isConsented ? (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2">
                              Disetujui ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.2 text-muted-foreground">
                              Ditolak
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Rekruter meminta izin untuk membuka data kontak dan memulai screening wawancara.
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          {req.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="size-3 text-muted-foreground" /> {req.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock3 className="size-3 text-muted-foreground" />
                            {new Date(req.requestedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 1-Click Action Buttons */}
                    {isPending ? (
                      staleIds.has(req.itemId) ? (
                        <p className="shrink-0 pt-2 text-xs text-muted-foreground sm:pt-0">
                          Sudah ditanggapi — segarkan halaman.
                        </p>
                      ) : (
                      <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                        <Button
                          size="sm"
                          disabled={actingRequestId === req.itemId}
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 shadow-xs"
                          onClick={() => void handleConsentAction(req.candidateId, req.itemId, "consented")}
                        >
                          <Check className="mr-1.5 size-3.5" /> Izinkan Kontak
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actingRequestId === req.itemId}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 px-3"
                          onClick={() => void handleConsentAction(req.candidateId, req.itemId, "declined")}
                        >
                          Tolak
                        </Button>
                      </div>
                      )
                    ) : isConsented ? (
                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-primary">
                        <Link href="/messages">
                          Buka Pesan <ChevronRight className="ml-1 size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* ── GENERAL NOTIFICATIONS FEED (always visible; tabs filter, never blank) ── */}
      <section className="mt-6 space-y-2.5" aria-label="Daftar Notifikasi">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 font-semibold text-sm text-foreground">Tidak ada notifikasi di kategori ini</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Semua pembaruan rekrutmen dan sistem akan muncul di sini.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const unread = !notif.readAt;
              const notifData = (notif.data && typeof notif.data === "object" ? notif.data : {}) as { href?: string; url?: string };
              const isInterview = notif.type === "screening_ready" || notif.title.toLowerCase().includes("wawancara") || notif.title.toLowerCase().includes("interview");
              const isOffer = notif.title.toLowerCase().includes("penawaran") || notif.title.toLowerCase().includes("offer");
              const href = "href" in notif ? (notif as { href?: string }).href : notifData.href || notifData.url || (isInterview ? "/messages" : undefined);
              const displayBody = notif.body
                ? notif.body.replace(/(?:[\.\s]+)?(?:Link|Tautan)(?:\s*(?:meeting|meet|interview))?:\s*https?:\/\/[^\s]+/gi, ". Tautan meeting telah dikirimkan ke pesan chat Anda.")
                : "";

              return (
                <Card
                  key={notif.id}
                  className={`transition-all duration-150 hover:shadow-xs ${
                    unread
                      ? "border-l-4 border-l-[#7C3AED] bg-purple-50/30 dark:bg-purple-950/15"
                      : "bg-white dark:bg-slate-900 border-border"
                  }`}
                >
                  <CardContent className="flex items-start gap-3.5 p-4 sm:p-5">
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        isInterview
                          ? "bg-purple-100 text-[#7C3AED]"
                          : isOffer
                          ? "bg-emerald-100 text-emerald-700"
                          : unread
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isInterview ? (
                        <Calendar className="size-4" />
                      ) : isOffer ? (
                        <FileCheck2 className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                        <h3 className={`text-sm ${unread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                          {href ? (
                            <Link
                              href={href}
                              onClick={() => {
                                if (unread) void handleMarkRead(notif.id);
                              }}
                              className="hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              {notif.title} <ChevronRight className="size-3 text-muted-foreground" />
                            </Link>
                          ) : (
                            notif.title
                          )}
                        </h3>
                        <time className="shrink-0 text-[11px] text-muted-foreground font-mono">
                          {new Date(notif.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>

                      {displayBody && (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{displayBody}</p>
                      )}

                      {unread && (
                        <button
                          onClick={() => void handleMarkRead(notif.id)}
                          className="mt-2 text-[11px] font-semibold text-primary hover:underline"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>
    </main>
  );
}

function TabButton({
  label,
  active,
  onClick,
  count = 0,
  highlightCount = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  highlightCount?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "bg-[#7C3AED] text-white shadow-xs"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold ${
            active
              ? "bg-white text-primary"
              : highlightCount
              ? "bg-emerald-600 text-white"
              : "bg-muted-foreground/20 text-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StateMessage({ text }: { text: string }) {
  return (
    <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground" role="status">
      {text}
    </div>
  );
}
