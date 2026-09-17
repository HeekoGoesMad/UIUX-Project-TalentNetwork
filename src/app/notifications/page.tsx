"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useApp } from "@/providers/app-provider";
import { cn } from "@/lib/utils";
import type { ConsentState } from "@/types";

type QuietHours = { start?: string; end?: string; timezone?: string };
type NotificationPreferences = { inAppEnabled: boolean; emailEnabled: boolean; quietHours: QuietHours };
const preferencesKey = "proofylink-demo-notification-preferences-v1";
const defaultPreferences: NotificationPreferences = { inAppEnabled: true, emailEnabled: true, quietHours: {} };

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

  const PAGE_SIZE = 6;
  const initialTab = parseTab(searchParams.get("tab"));
  const [activeTab, setActiveTab] = useState<NotificationCategory>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [staleIds, setStaleIds] = useState<Set<string>>(new Set());

  // Preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const changeTab = (tab: NotificationCategory) => {
    setActiveTab(tab);
    setCurrentPage(1);
    window.history.replaceState(null, "", `?tab=${TAB_PARAMS[tab]}`);
  };

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(parseTab(new URLSearchParams(window.location.search).get("tab")));
      setCurrentPage(1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent("/notifications")}`);
  }, [hydrated, user, router]);

  // Load Preferences
  useEffect(() => {
    if (!hydrated || !user) return;
    let active = true;
    if (!dbMode) {
      void Promise.resolve().then(() => {
        if (!active) return;
        try {
          const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? "null") as Partial<NotificationPreferences> | null;
          setPreferences({ ...defaultPreferences, ...saved, quietHours: { ...defaultPreferences.quietHours, ...saved?.quietHours } });
        } catch {
          setPreferences(defaultPreferences);
        }
        setPreferencesLoading(false);
      });
      return () => {
        active = false;
      };
    }
    void fetch("/api/notification-preferences", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { preferences?: NotificationPreferences; error?: string };
        if (!response.ok || !payload.preferences) throw new Error(payload.error ?? "Preferensi belum dapat dimuat.");
        if (active) setPreferences(payload.preferences);
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (active) setPreferencesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dbMode, hydrated, user]);

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

  const savePreferences = async () => {
    setPreferencesSaving(true);
    try {
      if (!dbMode) {
        localStorage.setItem(preferencesKey, JSON.stringify(preferences));
      } else {
        const response = await fetch("/api/notification-preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        });
        const payload = (await response.json()) as { preferences?: NotificationPreferences; error?: string };
        if (!response.ok || !payload.preferences) throw new Error(payload.error ?? "Preferensi belum dapat disimpan.");
        setPreferences(payload.preferences);
      }
      toast.success("Preferensi notifikasi disimpan");
      setSettingsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan preferensi");
    } finally {
      setPreferencesSaving(false);
    }
  };

  // Filtered notifications — tabs filter
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "requests") {
      return n.type === "consent_request" || n.type === "contact_request" || n.title.toLowerCase().includes("kontak") || n.title.toLowerCase().includes("izin");
    }
    if (activeTab === "recruitment") {
      return n.type === "application_status_changed" || n.type === "screening_ready" || n.type === "message_received";
    }
    if (activeTab === "system") {
      return n.type === "system" || n.type === "verification_result";
    }
    return true;
  });

  const recruitmentCount = notifications.filter(
    (n) => !n.readAt && (n.type === "application_status_changed" || n.type === "screening_ready" || n.type === "message_received")
  ).length;
  const systemCount = notifications.filter(
    (n) => !n.readAt && (n.type === "system" || n.type === "verification_result")
  ).length;

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filteredNotifications.length);
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Notifikasi</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Kelola jadwal wawancara, pembaruan rekrutmen, dan pengumuman sistem di satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadNotificationsCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()} className="text-xs">
              <CheckCheck className="mr-1.5 size-3.5" /> Tandai semua dibaca
            </Button>
          )}

          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <SlidersHorizontal className="mr-1.5 size-3.5" />
                Preferensi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="size-4 text-primary" />
                  Preferensi &amp; Waktu Tenang
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Atur saluran pengiriman notifikasi serta jam bebas gangguan (Quiet Hours).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {preferencesLoading ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Memuat preferensi...</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <PreferenceToggle
                        icon={<Smartphone className="size-4 text-muted-foreground" />}
                        label="Notifikasi In-App"
                        checked={preferences.inAppEnabled}
                        onChange={(checked) => setPreferences((curr) => ({ ...curr, inAppEnabled: checked }))}
                      />
                      <PreferenceToggle
                        icon={<Mail className="size-4 text-muted-foreground" />}
                        label="Notifikasi Email Ringkasan"
                        checked={preferences.emailEnabled}
                        onChange={(checked) => setPreferences((curr) => ({ ...curr, emailEnabled: checked }))}
                      />
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2.5">
                      <p className="text-xs font-semibold text-foreground">Waktu Tenang (Quiet Hours)</p>
                      <p className="text-[11px] text-muted-foreground">
                        Notifikasi non-kritis akan dijeda selama periode jam ini.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] text-muted-foreground">
                          Mulai:
                          <input
                            type="time"
                            value={preferences.quietHours.start ?? ""}
                            onChange={(e) =>
                              setPreferences((curr) => ({
                                ...curr,
                                quietHours: { ...curr.quietHours, start: e.target.value || undefined },
                              }))
                            }
                            className="mt-1 block h-8 w-full rounded-md border bg-background px-2 text-xs"
                          />
                        </label>
                        <label className="text-[11px] text-muted-foreground">
                          Selesai:
                          <input
                            type="time"
                            value={preferences.quietHours.end ?? ""}
                            onChange={(e) =>
                              setPreferences((curr) => ({
                                ...curr,
                                quietHours: { ...curr.quietHours, end: e.target.value || undefined },
                              }))
                            }
                            className="mt-1 block h-8 w-full rounded-md border bg-background px-2 text-xs"
                          />
                        </label>
                      </div>
                    </div>

                    <Button
                      className="w-full text-xs"
                      disabled={preferencesSaving}
                      onClick={() => void savePreferences()}
                    >
                      <Save className="mr-1.5 size-3.5" />
                      {preferencesSaving ? "Menyimpan..." : "Simpan Preferensi"}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

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
          label="Rekrutmen &amp; Wawancara"
          active={activeTab === "recruitment"}
          onClick={() => changeTab("recruitment")}
          count={recruitmentCount}
        />
        <TabButton
          label="Sistem"
          active={activeTab === "system"}
          onClick={() => changeTab("system")}
          count={systemCount}
        />
      </div>

      {/* ── CANDIDATE CONTACT REQUESTS (Only on 'requests' tab or when active on 'all') ── */}
      {user?.role === "candidate" && (activeTab === "requests" || (activeTab === "all" && pendingRequestsCount > 0)) && (
        <section className="mt-6 space-y-3" aria-label="Permintaan Kontak Rekruter">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Permintaan Akses Kontak &amp; Skrining</h2>
              {pendingRequestsCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2">
                  {pendingRequestsCount} Perlu Ditanggapi
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary">
              <Link href="/candidate/contact-requests">
                Semua Izin <ChevronRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>

          {formattedRequests.map((req) => {
            const isPending = req.state === "pending-candidate-consent";
            const isConsented = req.state === "consented";
            return (
              <Card
                key={req.itemId}
                className={cn(
                  "border transition-all duration-150",
                  isPending
                    ? "border-amber-300/80 bg-amber-50/25 dark:border-amber-700/50 dark:bg-amber-950/20 shadow-2xs"
                    : "border-border/70 bg-card"
                )}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        isPending
                          ? "bg-amber-100 text-amber-800"
                          : isConsented
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <UserRound className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        <span className="font-bold">{req.recruiterName}</span> ({req.company}) meminta izin untuk melihat detail kontak dan verifikasi Anda.
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Status: <strong className="capitalize">{req.state.replace(/-/g, " ")}</strong> • Diajukan:{" "}
                        {new Date(req.requestedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
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
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* ── GENERAL NOTIFICATIONS FEED ── */}
      <section className="mt-6 space-y-2.5" aria-label="Daftar Notifikasi">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Tidak ada notifikasi"
            description={
              activeTab === "all"
                ? "Semua pembaruan rekrutmen dan sistem akan muncul di sini."
                : "Tidak ada notifikasi pada kategori ini saat ini."
            }
            className="border-dashed py-12"
          />
        ) : (
          paginatedNotifications.map((notif) => {
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
                className={cn(
                  "border transition-all duration-150 hover:shadow-xs",
                  unread
                    ? "border-primary/30 bg-primary/[0.02]"
                    : "border-border/70 bg-card"
                )}
              >
                <CardContent className="flex items-start gap-3.5 p-4 sm:p-5">
                  <div className="relative shrink-0">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        isInterview
                          ? "bg-primary/10 text-primary"
                          : isOffer
                          ? "bg-emerald-50 text-emerald-700"
                          : unread
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isInterview ? (
                        <Calendar className="size-4" />
                      ) : isOffer ? (
                        <FileCheck2 className="size-4" />
                      ) : (
                        <Bell className="size-4" />
                      )}
                    </span>
                    {unread && (
                      <span
                        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <h3 className={cn("text-sm", unread ? "font-bold text-foreground" : "font-medium text-foreground/85")}>
                        {href ? (
                          <Link
                            href={href}
                            onClick={() => {
                              if (unread) void markNotificationRead(notif.id);
                            }}
                            className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>{notif.title}</span>
                            <ChevronRight className="size-3 text-muted-foreground" />
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
                        className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Check className="size-3" />
                        <span>Tandai dibaca</span>
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* ── PAGINATION CONTROLS ── */}
        {filteredNotifications.length > PAGE_SIZE && (
          <nav
            className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/70 pt-4"
            aria-label="Navigasi halaman notifikasi"
          >
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-semibold text-foreground">{startIndex + 1}–{endIndex}</span> dari{" "}
              <span className="font-semibold text-foreground">{filteredNotifications.length}</span> notifikasi
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="h-8 gap-1 text-xs font-medium"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>

              <div className="flex items-center gap-1">
                {getPageItems(totalPages, safeCurrentPage).map((item, index) =>
                  item === "gap" ? (
                    <span key={`gap-${index}`} className="px-1.5 text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      size="sm"
                      variant={item === safeCurrentPage ? "default" : "outline"}
                      aria-current={item === safeCurrentPage ? "page" : undefined}
                      onClick={() => setCurrentPage(item)}
                      className="h-8 min-w-8 px-2 text-xs font-medium"
                    >
                      {item}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="h-8 gap-1 text-xs font-medium"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}

function getPageItems(totalPages: number, currentPage: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const wanted = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) result.push("gap");
    result.push(p);
    prev = p;
  }
  return result;
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
        active
          ? "bg-primary text-primary-foreground shadow-2xs"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold ${
            active
              ? "bg-primary-foreground text-primary"
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

function PreferenceToggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-accent">
      <span className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
        {icon}
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary cursor-pointer"
      />
    </label>
  );
}

function StateMessage({ text }: { text: string }) {
  return (
    <div className="container mx-auto px-4 py-24 text-center text-sm text-muted-foreground" role="status">
      {text}
    </div>
  );
}
