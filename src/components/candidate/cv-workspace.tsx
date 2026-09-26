/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "@/components/ui/image-crop-dialog";
import { IndonesianPhoneInput } from "@/components/ui/phone-input";
import { SalaryInput } from "@/components/ui/salary-input";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { type CvProfile, type EducationItem, type ExperienceItem } from "@/types";
import { POPULAR_LOCATION_SUGGESTIONS, isValidLocationFormat, normalizeLocation } from "@/lib/locations";
import {
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  ExternalLink,
  Eye,
  FileUp,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUnsavedNavigationGuard } from "@/hooks/use-unsaved-navigation-guard";
import { CvDownload } from "./cv-download";
import { CvUnsavedBar } from "./cv-unsaved-bar";
import { PersonalityModal } from "./personality-modal";
import { ProfessionalSummaryModal } from "./professional-summary-modal";

export function parseSectionFromUrl(sectionParam?: string | null, hash?: string | null): SectionId | null {
  const target = (sectionParam || hash || "").toLowerCase().replace(/^#/, "").trim();
  if (!target) return null;
  if (
    target === "skills" ||
    target === "kompetensi" ||
    target === "competencies" ||
    target === "sec-skills" ||
    target === "portfolio" ||
    target === "portofolio" ||
    target === "sec-portfolio"
  ) {
    return "skills";
  }
  if (
    target === "basic" ||
    target === "basic-info" ||
    target === "sec-basic" ||
    target === "target-role" ||
    target === "identitas"
  ) {
    return "basic";
  }
  if (target === "summary" || target === "about" || target === "sec-summary" || target === "ringkasan") {
    return "summary";
  }
  if (target === "experience" || target === "sec-experience" || target === "pengalaman") {
    return "experience";
  }
  if (target === "education" || target === "sec-education" || target === "pendidikan") {
    return "education";
  }
  return null;
}

function blank(email = "", fullName = ""): CvProfile {
  return {
    id: "new-cv",
    fullName,
    headline: "",
    about: "",
    location: "",
    email,
    phone: "",
    salary: "",
    skills: [],
    hardCompetencies: [],
    tools: [],
    softSkills: [],
    industries: [],
    experience: [],
    education: [],
    certifications: [],
    portfolio: [],
    targetRole: "",
    workArrangement: "hybrid",
    openToWork: true,
    careerStatus: "open-to-work",
    updatedAt: new Date().toISOString(),
  };
}

// ─── Reusable Field Primitive ────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
  span2,
  required,
  error,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  span2?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", span2 && "md:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
        {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-border/80 bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaCls =
  "min-h-24 w-full rounded-lg border border-border/80 bg-background p-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const maxDocBytes = 10 * 1024 * 1024;

// ─── Tag Input Primitive ─────────────────────────────────────────────────────
function CompetencyTagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addCurrent = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    const updated = Array.from(new Set([...tags, ...parts]));
    onChange(updated);
    setInputVal("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("button")) {
          inputRef.current?.focus();
        }
      }}
      className="min-h-10 rounded-lg border border-border/80 bg-background p-1.5 transition-[color,box-shadow] focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-primary/20 cursor-text"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
              className="text-muted-foreground/80 hover:text-foreground focus:outline-none"
              aria-label={`Hapus ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="h-7 min-w-[130px] flex-1 border-0 bg-transparent px-1.5 text-xs outline-none placeholder:text-muted-foreground/70"
          value={inputVal}
          onChange={(e) => {
            const val = e.target.value;
            if (val.includes(",")) {
              const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
              if (parts.length > 0) {
                onChange(Array.from(new Set([...tags, ...parts])));
              }
              setInputVal("");
            } else {
              setInputVal(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCurrent();
            } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onBlur={addCurrent}
          placeholder={tags.length === 0 ? placeholder : "+ ketik lalu enter..."}
        />
      </div>
    </div>
  );
}

// ─── Serialization Helper ─────────────────────────────────────────────────────
function serializeCvData(p: CvProfile | null | undefined): string {
  if (!p) return "";
  return JSON.stringify({
    fullName: (p.fullName ?? "").trim(),
    headline: (p.headline ?? "").trim(),
    about: (p.about ?? "").trim(),
    location: (p.location ?? "").trim(),
    email: (p.email ?? "").trim(),
    phone: (p.phone ?? "").trim(),
    skills: p.skills ?? [],
    hardCompetencies: p.hardCompetencies ?? [],
    tools: p.tools ?? [],
    softSkills: p.softSkills ?? [],
    industries: p.industries ?? [],
    experience: p.experience ?? [],
    education: p.education ?? [],
    certifications: p.certifications ?? [],
    portfolio: p.portfolio ?? [],
    targetRole: (p.targetRole ?? "").trim(),
    workArrangement: p.workArrangement ?? "hybrid",
    openToWork: Boolean(p.openToWork),
    careerStatus: p.careerStatus ?? "open-to-work",
    talentCategory: p.talentCategory ?? "general",
    avatarUrl: p.avatarUrl ?? "",
    bannerUrl: p.bannerUrl ?? "",
    salary: p.salary ?? "",
    personality: p.personality ?? null,
  });
}

// ─── Section Configuration ───────────────────────────────────────────────────
type SectionId = "basic" | "summary" | "experience" | "education" | "skills";

interface SectionMeta {
  id: SectionId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const SECTIONS: SectionMeta[] = [
  {
    id: "basic",
    label: "Identitas & Kontak",
    shortLabel: "Identitas",
    icon: User,
    description: "Informasi dasar, kontak, lokasi, dan preferensi kerja.",
  },
  {
    id: "summary",
    label: "Ringkasan & Persona",
    shortLabel: "Ringkasan",
    icon: Sparkles,
    description: "Headline profesional, summary diri, dan tipe kepribadian.",
  },
  {
    id: "experience",
    label: "Pengalaman Kerja",
    shortLabel: "Pengalaman",
    icon: BriefcaseBusiness,
    description: "Riwayat pekerjaan, tanggung jawab, dan pencapaian terukur.",
  },
  {
    id: "education",
    label: "Pendidikan & Studi",
    shortLabel: "Pendidikan",
    icon: GraduationCap,
    description: "Riwayat institusi pendidikan, gelar, IPK, dan verifikasi kampus.",
  },
  {
    id: "skills",
    label: "Kompetensi & Portofolio",
    shortLabel: "Kompetensi",
    icon: Wrench,
    description: "Keahlian teknis, tools, soft skills, dan portofolio karya.",
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export function CvWorkspace() {
  const { cvProfile, user, dbMode, saveCvProfile } = useApp();
  const [profile, setProfile] = useState<CvProfile>(
    cvProfile ?? blank(dbMode ? user?.email : "", dbMode ? user?.name : "")
  );
  const [prevCvProfile, setPrevCvProfile] = useState(cvProfile);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    serializeCvData(cvProfile ?? blank(dbMode ? user?.email : "", dbMode ? user?.name : ""))
  );

  if (cvProfile && cvProfile !== prevCvProfile) {
    setPrevCvProfile(cvProfile);
    const incomingSnap = serializeCvData(cvProfile);
    setSavedSnapshot(incomingSnap);
    if (serializeCvData(profile) === savedSnapshot) {
      setProfile(cvProfile);
    }
  }

  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const matched = parseSectionFromUrl(sp.get("section"), window.location.hash);
      if (matched) return matched;
    }
    return "basic";
  });

  useEffect(() => {
    const handleUrlNavigation = () => {
      const sectionFromParam = searchParams?.get("section");
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const matched = parseSectionFromUrl(sectionFromParam, hash);
      if (matched) {
        setActiveSection(matched);
        const isPortfolioTarget =
          sectionFromParam === "portfolio" ||
          sectionFromParam === "portofolio" ||
          hash === "#portfolio" ||
          hash === "#sec-portfolio" ||
          hash === "#portofolio";
        setTimeout(() => {
          const el = isPortfolioTarget
            ? document.getElementById("sec-portfolio") || document.getElementById(`sec-${matched}`)
            : document.getElementById(`sec-${matched}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 120);
      }
    };

    handleUrlNavigation();

    window.addEventListener("hashchange", handleUrlNavigation);
    return () => window.removeEventListener("hashchange", handleUrlNavigation);
  }, [searchParams]);
  const [viewAll, setViewAll] = useState(false);
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [personalityModalOpen, setPersonalityModalOpen] = useState(false);
  const [cropModal, setCropModal] = useState<{
    open: boolean;
    imageSrc: string | null;
    type: "avatar" | "banner";
    fileName: string;
  }>({
    open: false,
    imageSrc: null,
    type: "avatar",
    fileName: "",
  });

  const isDirty = useMemo(() => {
    return serializeCvData(profile) !== savedSnapshot;
  }, [profile, savedSnapshot]);

  const [shaking, setShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setShakeCount((prev) => prev + 1);
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
    }
    shakeTimerRef.current = setTimeout(() => {
      setShaking(false);
    }, 850);
  }, []);

  const sectionTabsCleanupRef = useRef<(() => void) | null>(null);
  const setSectionTabsRef = useCallback((node: HTMLDivElement | null) => {
    if (sectionTabsCleanupRef.current) {
      sectionTabsCleanupRef.current();
      sectionTabsCleanupRef.current = null;
    }
    if (node) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0 || e.deltaX !== 0) {
          // Prevent outer webpage scroll, even when tabs reach the boundary
          e.preventDefault();
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          node.scrollLeft += delta;
        }
      };
      node.addEventListener("wheel", handleWheel, { passive: false });
      sectionTabsCleanupRef.current = () => {
        node.removeEventListener("wheel", handleWheel);
      };
    }
  }, []);

  // Bulletproof navigation guard for links, history back/forward, mouse keys, and reload
  useUnsavedNavigationGuard({
    isDirty,
    onBlocked: triggerShake,
  });

  const handleReset = () => {
    setShaking(false);
    if (cvProfile) {
      setProfile(cvProfile);
      setSavedSnapshot(serializeCvData(cvProfile));
    } else {
      const empty = blank(dbMode ? user?.email : "", dbMode ? user?.name : "");
      setProfile(empty);
      setSavedSnapshot(serializeCvData(empty));
    }
    toast.info("Perubahan profil berhasil dibatalkan.");
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxBytes = type === "banner" ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Ukuran ${type === "banner" ? "banner maksimal 8MB" : "foto profil maksimal 5MB"}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        open: true,
        imageSrc: reader.result as string,
        type,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const isAvatar = cropModal.type === "avatar";
    const toastId = toast.loading(`Mengunggah foto ${isAvatar ? "profil" : "sampul"}...`);
    try {
      const formData = new FormData();
      formData.append("file", croppedBlob, cropModal.fileName || `${cropModal.type}.webp`);
      formData.append("type", cropModal.type);

      const res = await fetch("/api/profile/media", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `Gagal mengunggah foto ${isAvatar ? "profil" : "sampul"}.`);
      }

      const updated = {
        ...profile,
        ...(isAvatar ? { avatarUrl: data.url } : { bannerUrl: data.url }),
      };
      update(isAvatar ? "avatarUrl" : "bannerUrl", data.url);
      await saveCvProfile(updated);
      setSavedSnapshot(serializeCvData(updated));
      toast.success(`Foto ${isAvatar ? "profil" : "sampul"} berhasil diperbarui!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal mengunggah ${isAvatar ? "foto profil" : "sampul"}`, { id: toastId });
    }
  };

  const handleRemoveMedia = async (type: "avatar" | "banner") => {
    const isAvatar = type === "avatar";
    const toastId = toast.loading(`Menghapus foto ${isAvatar ? "profil" : "sampul"}...`);
    try {
      const res = await fetch(`/api/profile/media?type=${type}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `Gagal menghapus foto ${isAvatar ? "profil" : "sampul"}.`);
      }

      const updated = {
        ...profile,
        ...(isAvatar ? { avatarUrl: "" } : { bannerUrl: "" }),
      };
      update(isAvatar ? "avatarUrl" : "bannerUrl", "");
      await saveCvProfile(updated);
      setSavedSnapshot(serializeCvData(updated));
      toast.success(`Foto ${isAvatar ? "profil" : "sampul"} berhasil dihapus!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal menghapus foto ${isAvatar ? "profil" : "sampul"}`, { id: toastId });
    }
  };

  // Generic scalar updater
  const update = <K extends keyof CvProfile>(key: K, value: CvProfile[K]) =>
    setProfile((c) => ({ ...c, [key]: value }));

  // Experience helpers
  const addExp = () =>
    setProfile((c) => ({
      ...c,
      experience: [
        ...c.experience,
        {
          company: "",
          role: "",
          employmentType: "Full Time",
          startDate: "",
          endDate: "",
          currentPosition: false,
          dates: "",
          description: "",
          achievements: [],
        },
      ],
    }));

  const removeExp = (i: number) =>
    setProfile((c) => ({ ...c, experience: c.experience.filter((_, idx) => idx !== i) }));

  const moveExp = (fromIndex: number, direction: -1 | 1) => {
    setProfile((c) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= c.experience.length) return c;
      const next = [...c.experience];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...c, experience: next };
    });
  };

  const updateExp = (i: number, key: keyof ExperienceItem, val: unknown) =>
    setProfile((c) => {
      const exp = [...c.experience];
      const item = { ...exp[i], [key]: val };
      if (key === "startDate" || key === "endDate" || key === "currentPosition") {
        const start = key === "startDate" ? (val as string) : item.startDate || "";
        const isCurrent = key === "currentPosition" ? (val as boolean) : item.currentPosition;
        const end = isCurrent ? "Sekarang" : key === "endDate" ? (val as string) : item.endDate || "";
        if (start || end) {
          item.dates = start && end ? `${start} — ${end}` : start || end;
        }
      }
      exp[i] = item;
      return { ...c, experience: exp };
    });

  const updateExpAchievement = (i: number, j: number, val: string) =>
    setProfile((c) => {
      const exp = [...c.experience];
      const target = exp[i];
      if (!target) return c;
      const achievements = Array.isArray(target.achievements) ? [...target.achievements] : [];
      achievements[j] = val;
      exp[i] = { ...target, achievements };
      return { ...c, experience: exp };
    });

  const addExpAchievement = (i: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) =>
        idx === i ? { ...exp, achievements: [...(Array.isArray(exp.achievements) ? exp.achievements : []), ""] } : exp
      ),
    }));

  const removeExpAchievement = (i: number, j: number) =>
    setProfile((c) => ({
      ...c,
      experience: c.experience.map((exp, idx) =>
        idx === i
          ? {
              ...exp,
              achievements: (Array.isArray(exp.achievements) ? exp.achievements : []).filter((_, aIdx) => aIdx !== j),
            }
          : exp
      ),
    }));

  // Education helpers
  const addEdu = () =>
    setProfile((c) => ({
      ...c,
      education: [
        ...c.education,
        {
          level: "S1",
          school: "",
          program: "",
          gpa: "",
          startDate: "",
          endDate: "",
          currentlyStudying: false,
          dates: "",
        },
      ],
    }));

  const removeEdu = (i: number) =>
    setProfile((c) => ({ ...c, education: c.education.filter((_, idx) => idx !== i) }));

  const moveEdu = (fromIndex: number, direction: -1 | 1) => {
    setProfile((c) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= c.education.length) return c;
      const next = [...c.education];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...c, education: next };
    });
  };

  const updateEdu = (i: number, key: keyof EducationItem, val: unknown) =>
    setProfile((c) => {
      const edu = [...c.education];
      const item = { ...edu[i], [key]: val };
      if (key === "startDate" || key === "endDate" || key === "currentlyStudying") {
        const start = key === "startDate" ? (val as string) : item.startDate || "";
        const isCurrent = key === "currentlyStudying" ? (val as boolean) : item.currentlyStudying;
        const end = isCurrent ? "Sekarang" : key === "endDate" ? (val as string) : item.endDate || "";
        if (start || end) {
          item.dates = start && end ? `${start} — ${end}` : start || end;
        }
      }
      edu[i] = item;
      return { ...c, education: edu };
    });

  // Portfolio helpers
  const addPortfolio = () =>
    setProfile((c) => ({ ...c, portfolio: [...c.portfolio, ""] }));
  const removePortfolio = (i: number) =>
    setProfile((c) => ({ ...c, portfolio: c.portfolio.filter((_, idx) => idx !== i) }));
  const updatePortfolio = (i: number, val: string) =>
    setProfile((c) => {
      const p = [...c.portfolio];
      p[i] = val;
      return { ...c, portfolio: p };
    });

  async function importPdf(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!isPdf && !isImage) {
      setMessage("File harus berformat PDF atau Gambar (PNG, JPG, WEBP).");
      toast.error("File tidak didukung", { description: "Impor CV menerima berkas PDF atau gambar (PNG, JPG, WEBP)." });
      return;
    }
    if (file.size > maxDocBytes) {
      setMessage("Ukuran file melebihi batas 10 MB.");
      toast.error("Ukuran file terlalu besar", { description: "Ukuran berkas maksimal 10 MB. Kompres atau pilih file lain." });
      return;
    }
    setImporting(true);
    setMessage(isImage ? "Menganalisis gambar CV dengan Vision AI..." : "Mengekstrak informasi dari dokumen CV...");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/cv/import", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Impor gagal. Coba lagi atau isi manual.");
        toast.error("Impor gagal", { description: data.error ?? "Server tidak dapat memproses dokumen ini." });
        return;
      }
      setProfile((c) => ({
        ...c,
        ...data,
        id: data.cvId,
        skills: data.skills ?? c.skills,
        hardCompetencies: data.hardCompetencies ?? data.skills ?? c.hardCompetencies ?? c.skills,
        tools: data.tools ?? c.tools,
        softSkills: data.softSkills ?? c.softSkills ?? [],
        experience: data.experience ?? c.experience,
        education: data.education ?? c.education,
        portfolio: data.portfolio ?? c.portfolio,
        sourceFileName: file.name,
      }));
      if (isPdf) {
        const docForm = new FormData();
        docForm.set("file", file);
        void fetch("/api/cv/documents", { method: "POST", body: docForm }).catch((err) => {
          console.warn("Auto-saving CV document failed:", err);
        });
      }
      setMessage("Draf berhasil diperbarui dari dokumen CV. Berkas tersimpan aman dan siap ditinjau rekruter.");
      toast.success("CV berhasil diunggah & diekstrak", { description: "Profil Anda telah terisi otomatis, berkas tersimpan aman, dan dapat dilihat oleh rekruter." });
    } catch {
      setMessage("Impor gagal. Coba lagi atau isi manual.");
      toast.error("Impor gagal", { description: "Periksa koneksi Anda lalu coba lagi." });
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    if (saving) return;

    if (profile.location?.trim()) {
      const locCheck = isValidLocationFormat(profile.location);
      if (!locCheck.isValid) {
        toast.error("Format domisili belum sesuai", {
          description: locCheck.error ?? "Gunakan format: Kabupaten/Kota, Provinsi (contoh: Sleman, D.I. Yogyakarta)",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const normalizedProfile = {
        ...profile,
        location: normalizeLocation(profile.location) || profile.location,
      };
      await saveCvProfile(normalizedProfile);
      setProfile(normalizedProfile);
      setSavedSnapshot(serializeCvData(normalizedProfile));
      setShaking(false);
      setMessage("Profil berhasil disimpan dan disinkronkan.");
      toast.success("Profil berhasil disimpan!");
    } catch {
      setMessage("Profil gagal disimpan. Coba lagi.");
      toast.error("Profil gagal disimpan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  // Section completion calculations for status badges
  const isBasicComplete = Boolean(profile.fullName?.trim() && profile.email?.trim());
  const isSummaryComplete = Boolean(profile.headline?.trim() || profile.about?.trim());
  const experienceCount = profile.experience.length;
  const educationCount = profile.education.length;
  const skillsCount =
    (profile.hardCompetencies?.length || profile.skills?.length || 0) +
    (profile.tools?.length || 0) +
    (profile.softSkills?.length || 0);

  const activeIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const currentMeta = SECTIONS[activeIndex] ?? SECTIONS[0];

  const handleNextSection = () => {
    if (activeIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[activeIndex + 1].id);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handlePrevSection = () => {
    if (activeIndex > 0) {
      setActiveSection(SECTIONS[activeIndex - 1].id);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-24">
      {/* Mobile Mode Switcher (< lg) */}
      <div className="flex rounded-xl border border-border/70 bg-card p-1 shadow-xs lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
            mobileTab === "editor"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Edit3 className="size-3.5" />
          Edit Profil
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
            mobileTab === "preview"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Eye className="size-3.5" />
          Pratinjau CV
        </button>
      </div>

      {/* 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* Left Column: Focused Section Workspace */}
        <div
          className={cn(
            "lg:col-span-7 xl:col-span-7 space-y-4",
            mobileTab === "preview" && "hidden lg:block"
          )}
        >
          {/* Top Quiet Utility Bar: Import AI + Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileUp className="size-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xs font-semibold text-foreground">
                    Unggah &amp; Ekstraksi CV Otomatis
                  </p>
                  {profile.sourceFileName && (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] font-medium text-emerald-700">
                      Tersimpan: {profile.sourceFileName}
                    </Badge>
                  )}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  Unggah CV Anda untuk mengisi profil otomatis, menyimpan berkas, dan dapat dilihat oleh rekruter
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <label
                aria-disabled={importing}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border/80 bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring",
                  importing && "pointer-events-none opacity-60"
                )}
              >
                <input
                  className="sr-only"
                  type="file"
                  accept="application/pdf,.pdf,image/*"
                  disabled={importing}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void importPdf(f);
                  }}
                />
                {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5 text-muted-foreground" />}
                <span>{importing ? "Memproses..." : "Unggah CV"}</span>
              </label>

              {/* View All Toggle */}
              <button
                type="button"
                onClick={() => setViewAll((prev) => !prev)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors border",
                  viewAll
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/80 bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={viewAll ? "Kembali ke mode fokus satu bagian" : "Tampilkan semua bagian sekaligus"}
              >
                <Layers className="size-3.5" />
                <span className="hidden sm:inline">{viewAll ? "Mode Fokus" : "Semua Bagian"}</span>
              </button>
            </div>
          </div>

          {/* Segmented Section Navigation Tabs */}
          {!viewAll && (
            <div
              ref={setSectionTabsRef}
              className="flex gap-1.5 overflow-x-auto rounded-xl border border-border/70 bg-card p-1.5 shadow-xs scrollbar-none overscroll-contain"
            >
              {SECTIONS.map((sec) => {
                const isCurrent = activeSection === sec.id;
                const Icon = sec.icon;

                // Determine badge indicator
                let badgeContent: React.ReactNode = null;
                if (sec.id === "basic") {
                  badgeContent = isBasicComplete ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : null;
                } else if (sec.id === "summary") {
                  badgeContent = isSummaryComplete ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : null;
                } else if (sec.id === "experience") {
                  badgeContent = (
                    <span className="font-mono text-[10px] text-muted-foreground">{experienceCount}</span>
                  );
                } else if (sec.id === "education") {
                  badgeContent = (
                    <span className="font-mono text-[10px] text-muted-foreground">{educationCount}</span>
                  );
                } else if (sec.id === "skills") {
                  badgeContent = (
                    <span className="font-mono text-[10px] text-muted-foreground">{skillsCount}</span>
                  );
                }

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("size-3.5 shrink-0", isCurrent ? "text-primary-foreground" : "text-muted-foreground")} />
                    <span>{sec.shortLabel}</span>
                    {badgeContent && (
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full text-[10px]",
                          isCurrent
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {badgeContent}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Focused Editor Canvas */}
          <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-6">
            {/* Section Header */}
            {!viewAll && (
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {currentMeta.label}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {currentMeta.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saving ? (
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <Loader2 className="size-3 animate-spin" />
                      Menyimpan...
                    </Badge>
                  ) : isDirty ? (
                    <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-[11px] text-amber-800">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Belum disimpan
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      Tersimpan
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* ── SECTION 1: Identitas & Kontak ── */}
            {(viewAll || activeSection === "basic") && (
              <div id="sec-basic" className="space-y-5 scroll-mt-24">
                {viewAll && (
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <User className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Identitas &amp; Kontak</h3>
                  </div>
                )}

                {/* Photos row */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Avatar */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-2.5">
                    <span className="block text-xs font-semibold text-foreground">Foto Profil</span>
                    <div className="flex items-center gap-3.5">
                      <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="Foto profil" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        ) : (
                          <User className="size-7 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                          <Camera className="size-3.5 text-muted-foreground" />
                          <span>Unggah foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => onSelectFile(e, "avatar")}
                          />
                        </label>
                        {profile.avatarUrl ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia("avatar")}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Hapus foto profil"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Hapus</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Banner */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-2.5">
                    <span className="block text-xs font-semibold text-foreground">Foto Sampul (Banner)</span>
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-14 w-28 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {profile.bannerUrl ? (
                          <img src={profile.bannerUrl} alt="Foto sampul" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/60 text-[10px] text-muted-foreground">Polos</div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                          <Camera className="size-3.5 text-muted-foreground" />
                          <span>Unggah sampul</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => onSelectFile(e, "banner")}
                          />
                        </label>
                        {profile.bannerUrl ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia("banner")}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Hapus foto sampul"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Hapus</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identity Input Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nama Lengkap" required>
                    <input
                      className={inputCls}
                      value={profile.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Nama lengkap sesuai KTP / profesional"
                    />
                  </Field>

                  <Field label="Email" required>
                    <input
                      className={inputCls}
                      type="email"
                      value={profile.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="nama@domain.com"
                    />
                  </Field>

                  <Field label="Nomor Telepon / WhatsApp">
                    <IndonesianPhoneInput
                      value={profile.phone ?? ""}
                      onChange={(val) => update("phone", val)}
                      placeholder="812-3456-7890"
                    />
                  </Field>

                  <Field
                    label="Lokasi Domisili"
                    hint="Format: Kabupaten/Kota, Provinsi (contoh: Sleman, D.I. Yogyakarta)"
                    error={
                      profile.location?.trim() && !isValidLocationFormat(profile.location).isValid
                        ? isValidLocationFormat(profile.location).error
                        : undefined
                    }
                  >
                    <input
                      className={inputCls}
                      value={profile.location}
                      onChange={(e) => update("location", e.target.value)}
                      placeholder="Contoh: Jakarta Selatan, DKI Jakarta atau Sleman, D.I. Yogyakarta"
                      list="cv-locations-list"
                    />
                    <datalist id="cv-locations-list">
                      {POPULAR_LOCATION_SUGGESTIONS.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Target Role / Posisi Impian" hint="Posisi yang Anda incar">
                    <input
                      className={inputCls}
                      value={profile.targetRole ?? ""}
                      onChange={(e) => update("targetRole", e.target.value)}
                      placeholder="Contoh: Senior Frontend Engineer, Product Lead"
                    />
                  </Field>

                  <Field label="Preferensi Kerja">
                    <select
                      className={inputCls}
                      value={profile.workArrangement || "hybrid"}
                      onChange={(e) => update("workArrangement", e.target.value as "remote" | "hybrid" | "onsite")}
                    >
                      <option value="hybrid">Hybrid (Kantor &amp; Remote)</option>
                      <option value="remote">Remote (Full WFH)</option>
                      <option value="onsite">Onsite (Bekerja di Kantor)</option>
                    </select>
                  </Field>

                  <Field label="Ekspektasi Gaji Bulanan" hint="Tampil hanya saat rekruter membuka profil" span2>
                    <SalaryInput
                      value={profile.salary ?? ""}
                      onChange={(val) => update("salary", val)}
                      placeholder="Contoh: 18.000.000 – 25.000.000 / bln"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── SECTION 2: Ringkasan & Persona ── */}
            {(viewAll || activeSection === "summary") && (
              <div id="sec-summary" className="space-y-5 scroll-mt-24">
                {viewAll && (
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2 pt-2">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Ringkasan &amp; Persona</h3>
                  </div>
                )}

                <Field
                  label="Headline Profesional"
                  hint="Tampil tepat di bawah nama pada header CV"
                >
                  <input
                    className={inputCls}
                    value={profile.headline}
                    onChange={(e) => update("headline", e.target.value)}
                    placeholder="Contoh: Senior UI/UX Designer | Design Systems &amp; User Research"
                  />
                </Field>

                {/* Professional Summary Box */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Tentang Saya (Professional Summary)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSummaryModalOpen(true)}
                      className="h-7 gap-1.5 rounded-md text-xs text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <Sparkles className="size-3.5" />
                      Bantuan AI Summary
                    </Button>
                  </div>
                  <textarea
                    className={textareaCls}
                    value={profile.about}
                    onChange={(e) => update("about", e.target.value)}
                    placeholder="Ringkas latar belakang, keahlian utama, dan proposisi nilai yang Anda tawarkan kepada perusahaan..."
                    rows={4}
                  />
                </div>

                {/* Personality MBTI Card */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">Tipe Kepribadian (MBTI)</span>
                        {profile.personality?.type ? (
                          <Badge variant="secondary" className="text-[11px] font-medium text-primary bg-primary/10 border-primary/20">
                            {profile.personality.type} · {profile.personality.label}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/80">Belum dipilih</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.personality?.tagline || "Menambah wawasan gaya kerja dan komunikasi Anda bagi tim."}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPersonalityModalOpen(true)}
                      className="h-8 shrink-0 rounded-md text-xs font-medium"
                    >
                      {profile.personality?.type ? "Ubah Kepribadian" : "Pilih MBTI"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 3: Pengalaman Kerja ── */}
            {(viewAll || activeSection === "experience") && (
              <div id="sec-experience" className="space-y-4 scroll-mt-24">
                {viewAll && (
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 pt-2">
                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Pengalaman Kerja</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {experienceCount} posisi
                    </Badge>
                  </div>
                )}

                {profile.experience.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-8 text-center space-y-3">
                    <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground/50" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Belum ada pengalaman kerja</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Tambahkan riwayat pekerjaan magang, freelance, atau full-time Anda.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addExp} className="gap-1.5 text-xs">
                      <Plus className="size-3.5" /> Tambah Pengalaman
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.experience.map((exp, i) => {
                      const employmentTypes = ["Full Time", "Internship", "Contract", "Freelance"];

                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-border/70 bg-muted/10 p-4 sm:p-5 space-y-4 transition-colors hover:border-border"
                        >
                          {/* Entry Title & Controls */}
                          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-mono font-semibold text-muted-foreground">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="truncate text-sm font-semibold text-foreground">
                                  {exp.role || exp.company ? `${exp.role || "Posisi"} di ${exp.company || "Perusahaan"}` : `Pengalaman ${i + 1}`}
                                </h4>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {exp.dates || "Periode belum diisi"} {exp.currentPosition ? "· Sedang Berjalan" : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={i === 0}
                                onClick={() => moveExp(i, -1)}
                                aria-label="Pindahkan ke atas"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                              >
                                <ChevronUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={i === profile.experience.length - 1}
                                onClick={() => moveExp(i, 1)}
                                aria-label="Pindahkan ke bawah"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                              >
                                <ChevronDown className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExp(i)}
                                aria-label="Hapus pengalaman ini"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 1: Company & Role */}
                          <div className="grid gap-3.5 md:grid-cols-2">
                            <Field label="Nama Perusahaan" required>
                              <input
                                className={inputCls}
                                value={exp.company}
                                onChange={(e) => updateExp(i, "company", e.target.value)}
                                placeholder="Contoh: PT Telkom Indonesia"
                              />
                            </Field>
                            <Field label="Posisi / Jabatan" required>
                              <input
                                className={inputCls}
                                value={exp.role}
                                onChange={(e) => updateExp(i, "role", e.target.value)}
                                placeholder="Contoh: Product Design Specialist"
                              />
                            </Field>
                          </div>

                          {/* Row 2: Type, Start, End */}
                          <div className="grid gap-3.5 md:grid-cols-3">
                            <Field label="Tipe Pekerjaan">
                              <select
                                className={inputCls}
                                value={exp.employmentType || "Full Time"}
                                onChange={(e) => updateExp(i, "employmentType", e.target.value)}
                              >
                                {employmentTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="Tanggal Mulai">
                              <input
                                className={inputCls}
                                value={exp.startDate || ""}
                                onChange={(e) => updateExp(i, "startDate", e.target.value)}
                                placeholder="Contoh: Jan 2022"
                              />
                            </Field>
                            <Field label="Tanggal Selesai">
                              <input
                                className={cn(inputCls, exp.currentPosition && "bg-muted/60 text-muted-foreground cursor-not-allowed")}
                                disabled={Boolean(exp.currentPosition)}
                                value={exp.currentPosition ? "Sekarang" : exp.endDate || ""}
                                onChange={(e) => updateExp(i, "endDate", e.target.value)}
                                placeholder={exp.currentPosition ? "Sekarang" : "Contoh: Des 2024"}
                              />
                            </Field>
                          </div>

                          {/* Row 3: Current Position Checkbox */}
                          <div className="flex items-center gap-2">
                            <input
                              id={`exp-current-${i}`}
                              type="checkbox"
                              checked={Boolean(exp.currentPosition)}
                              onChange={(e) => updateExp(i, "currentPosition", e.target.checked)}
                              className="size-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor={`exp-current-${i}`} className="cursor-pointer select-none text-xs text-muted-foreground">
                              Saya masih aktif bekerja di posisi ini
                            </label>
                          </div>

                          {/* Row 4: Description */}
                          <Field
                            label="Deskripsi Tanggung Jawab & Peran"
                            hint="Jelaskan peran utama dan lingkup kerja"
                          >
                            <textarea
                              className={textareaCls}
                              value={exp.description || ""}
                              onChange={(e) => updateExp(i, "description", e.target.value)}
                              placeholder="Rangkum tugas utama, kolaborasi tim, dan produk/layanan yang Anda kerjakan..."
                              rows={3}
                            />
                          </Field>

                          {/* Row 5: Achievements Bullets */}
                          <div className="space-y-2.5 rounded-lg border border-border/60 bg-background p-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">
                                Pencapaian Terukur (Key Results / Impact)
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => addExpAchievement(i)}
                                className="h-7 gap-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                              >
                                <Plus className="size-3" /> Tambah Poin
                              </Button>
                            </div>

                            {((Array.isArray(exp.achievements)
                              ? exp.achievements
                              : typeof exp.achievements === "string" && exp.achievements
                              ? [exp.achievements]
                              : []) as string[]).map((achievement, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-primary/70 shrink-0" />
                                <input
                                  className={cn(inputCls, "h-8 text-xs")}
                                  value={achievement}
                                  onChange={(e) => updateExpAchievement(i, j, e.target.value)}
                                  placeholder={j === 0 ? "Contoh: Meningkatkan retensi pengguna sebesar 24% dalam 3 kuartal..." : "Tulis pencapaian terukur lainnya..."}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExpAchievement(i, j)}
                                  className="size-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label={`Hapus pencapaian ${j + 1}`}
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExp}
                      className="w-full gap-1.5 rounded-lg border-dashed text-xs font-medium py-4"
                    >
                      <Plus className="size-3.5" /> Tambah Pengalaman Lainnya
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION 4: Pendidikan & Studi ── */}
            {(viewAll || activeSection === "education") && (
              <div id="sec-education" className="space-y-4 scroll-mt-24">
                {viewAll && (
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 pt-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Pendidikan &amp; Studi</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {educationCount} institusi
                    </Badge>
                  </div>
                )}

                {profile.education.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-8 text-center space-y-3">
                    <GraduationCap className="mx-auto size-8 text-muted-foreground/50" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Belum ada riwayat pendidikan</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Tambahkan institusi sekolah, universitas, atau diploma Anda.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addEdu} className="gap-1.5 text-xs">
                      <Plus className="size-3.5" /> Tambah Pendidikan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.education.map((edu, i) => {
                      const educationLevels = ["SMA/SMK", "Diploma", "S1", "S2", "S3"];

                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-border/70 bg-muted/10 p-4 sm:p-5 space-y-4 transition-colors hover:border-border"
                        >
                          {/* Title & Controls */}
                          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-mono font-semibold text-muted-foreground">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="truncate text-sm font-semibold text-foreground">
                                  {edu.school ? edu.school : `Pendidikan ${i + 1}`}
                                </h4>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {edu.program ? `${edu.program} · ` : ""}{edu.level || "S1"}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={i === 0}
                                onClick={() => moveEdu(i, -1)}
                                aria-label="Pindahkan ke atas"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                              >
                                <ChevronUp className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={i === profile.education.length - 1}
                                onClick={() => moveEdu(i, 1)}
                                aria-label="Pindahkan ke bawah"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-20"
                              >
                                <ChevronDown className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEdu(i)}
                                aria-label="Hapus pendidikan ini"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Row 1: School & Major */}
                          <div className="grid gap-3.5 md:grid-cols-2">
                            <Field label="Sekolah / Universitas" required>
                              <input
                                className={inputCls}
                                value={edu.school}
                                onChange={(e) => updateEdu(i, "school", e.target.value)}
                                placeholder="Contoh: Universitas Gadjah Mada"
                              />
                            </Field>
                            <Field label="Jurusan / Program Studi" required>
                              <input
                                className={inputCls}
                                value={edu.program}
                                onChange={(e) => updateEdu(i, "program", e.target.value)}
                                placeholder="Contoh: Ilmu Komputer / Informatika"
                              />
                            </Field>
                          </div>

                          {/* Row 2: Level, GPA, Dates */}
                          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
                            <Field label="Jenjang">
                              <select
                                className={inputCls}
                                value={edu.level || "S1"}
                                onChange={(e) => updateEdu(i, "level", e.target.value)}
                              >
                                {educationLevels.map((lvl) => (
                                  <option key={lvl} value={lvl}>
                                    {lvl}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="IPK / Nilai Akhir">
                              <input
                                className={inputCls}
                                value={edu.gpa || ""}
                                onChange={(e) => updateEdu(i, "gpa", e.target.value)}
                                placeholder="Contoh: 3.82 / 4.00"
                              />
                            </Field>
                            <Field label="Tahun Mulai">
                              <input
                                className={inputCls}
                                value={edu.startDate || ""}
                                onChange={(e) => updateEdu(i, "startDate", e.target.value)}
                                placeholder="Contoh: Agu 2019"
                              />
                            </Field>
                            <Field label="Tahun Selesai">
                              <input
                                className={cn(inputCls, edu.currentlyStudying && "bg-muted/60 text-muted-foreground cursor-not-allowed")}
                                disabled={Boolean(edu.currentlyStudying)}
                                value={edu.currentlyStudying ? "Sekarang" : edu.endDate || ""}
                                onChange={(e) => updateEdu(i, "endDate", e.target.value)}
                                placeholder={edu.currentlyStudying ? "Sekarang" : "Contoh: Jul 2023"}
                              />
                            </Field>
                          </div>

                          {/* Row 3: Currently Studying Checkbox */}
                          <div className="flex items-center gap-2">
                            <input
                              id={`edu-current-${i}`}
                              type="checkbox"
                              checked={Boolean(edu.currentlyStudying)}
                              onChange={(e) => updateEdu(i, "currentlyStudying", e.target.checked)}
                              className="size-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor={`edu-current-${i}`} className="cursor-pointer select-none text-xs text-muted-foreground">
                              Saya masih aktif menempuh studi di sini
                            </label>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEdu}
                      className="w-full gap-1.5 rounded-lg border-dashed text-xs font-medium py-4"
                    >
                      <Plus className="size-3.5" /> Tambah Institusi Pendidikan Lainnya
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── SECTION 5: Kompetensi & Portofolio ── */}
            {(viewAll || activeSection === "skills") && (
              <div id="sec-skills" className="space-y-5 scroll-mt-24">
                {viewAll && (
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="size-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Kompetensi &amp; Portofolio</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {skillsCount} keahlian
                    </Badge>
                  </div>
                )}

                <Field
                  label="Kompetensi Teknis (Hard Skills)"
                  hint="Ketik lalu tekan koma / Enter untuk menambahkan tag"
                >
                  <CompetencyTagInput
                    tags={profile.hardCompetencies?.length ? profile.hardCompetencies : profile.skills}
                    onChange={(tags) =>
                      setProfile((c) => ({
                        ...c,
                        skills: tags,
                        hardCompetencies: tags,
                      }))
                    }
                    placeholder="Contoh: React, TypeScript, UI/UX Design, Data Analysis..."
                  />
                </Field>

                <Field
                  label="Peralatan &amp; Software (Tools)"
                  hint="Aplikasi atau teknologi yang Anda kuasai sehari-hari"
                >
                  <CompetencyTagInput
                    tags={profile.tools}
                    onChange={(tags) =>
                      setProfile((c) => ({
                        ...c,
                        tools: tags,
                      }))
                    }
                    placeholder="Contoh: Figma, GitHub, Jira, PostgreSQL, Docker..."
                  />
                </Field>

                <Field
                  label="Soft Skills &amp; Kemampuan Interpersonal"
                  hint="Gaya kerja, kolaborasi tim, kepemimpinan"
                >
                  <CompetencyTagInput
                    tags={profile.softSkills ?? []}
                    onChange={(tags) =>
                      setProfile((c) => ({
                        ...c,
                        softSkills: tags,
                      }))
                    }
                    placeholder="Contoh: Communication, Critical Thinking, Team Leadership..."
                  />
                </Field>

                {/* Portfolio Links */}
                <div id="sec-portfolio" className="space-y-3 border-t border-border/60 pt-4 scroll-mt-24">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground">Tautan Portofolio &amp; Karya</span>
                      <p className="text-[11px] text-muted-foreground">Tautan ke GitHub, Behance, Dribbble, atau website pribadi</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addPortfolio}
                      className="h-7 gap-1 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <Plus className="size-3" /> Tambah Tautan
                    </Button>
                  </div>

                  {profile.portfolio.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Belum ada tautan portofolio ditambahkan.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {profile.portfolio.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <ExternalLink className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                          <input
                            className={cn(inputCls, "flex-1 text-xs")}
                            value={item}
                            onChange={(e) => updatePortfolio(i, e.target.value)}
                            placeholder="https://github.com/username atau https://myportfolio.dev"
                          />
                          <button
                            type="button"
                            onClick={() => removePortfolio(i)}
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Hapus tautan portofolio"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            {!viewAll && (
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevSection}
                  disabled={activeIndex === 0}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </Button>

                <div className="flex items-center gap-2">
                  {activeIndex < SECTIONS.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNextSection}
                      className="gap-1.5 text-xs font-medium"
                    >
                      <span>Lanjut ke {SECTIONS[activeIndex + 1].shortLabel}</span>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-1.5 text-xs font-medium"
                    >
                      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      <span>Simpan Seluruh Profil</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {message && (
              <p className="rounded-lg bg-muted/60 px-3.5 py-2.5 text-xs text-muted-foreground" role="status">
                {message}
              </p>
            )}
          </div>

          <p className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" />
            <span>Anda memiliki kontrol penuh atas data yang dipublikasikan. Profil dan berkas Anda dapat dilihat oleh rekruter.</span>
          </p>
        </div>

        {/* Right Column: Sticky Live Preview Dock */}
        <div
          className={cn(
            "lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24 lg:h-[calc(100vh-12em)] pb-2",
            mobileTab === "editor" && "hidden lg:block"
          )}
        >
          <CvDownload profile={profile} />
        </div>
      </div>

      {/* Floating Unsaved Changes Bar */}
      <CvUnsavedBar
        show={isDirty || saving}
        saving={saving}
        shaking={shaking}
        shakeKey={shakeCount}
        onSave={handleSave}
        onReset={handleReset}
      />

      <ProfessionalSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        currentSummary={profile.about}
        cvProfile={profile}
        onApply={async (newSummary) => {
          update("about", newSummary);
          if (profile.id && profile.id !== "new-cv") {
            const updated = {
              ...profile,
              about: newSummary,
            };
            await saveCvProfile(updated);
            setSavedSnapshot(serializeCvData(updated));
          }
        }}
      />

      <PersonalityModal
        open={personalityModalOpen}
        onOpenChange={setPersonalityModalOpen}
        personality={profile.personality}
        onSave={(newPersonality) => {
          update("personality", newPersonality);
          toast.success(newPersonality ? "Tipe kepribadian diperbarui! Klik Simpan Profil untuk menyimpan permanen." : "Tipe kepribadian dihapus.");
        }}
      />

      <ImageCropDialog
        open={cropModal.open}
        onOpenChange={(open) => setCropModal((prev) => ({ ...prev, open }))}
        imageSrc={cropModal.imageSrc}
        aspectRatio={cropModal.type === "avatar" ? 1 : 3}
        cropShape={cropModal.type === "avatar" ? "round" : "rect"}
        title={cropModal.type === "avatar" ? "Sesuaikan Foto Profil" : "Sesuaikan Foto Sampul"}
        description={
          cropModal.type === "avatar"
            ? "Geser dan perbesar untuk mengatur foto profil Anda."
            : "Geser dan perbesar untuk mengatur foto sampul (banner) Anda."
        }
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
