"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileCheck,
  FileText,
  FileUp,
  Globe,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  UploadCloud,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IndonesianPhoneInput } from "@/components/ui/phone-input";
import { extractIndonesianLocalPhone } from "@/lib/utils";
import { POPULAR_LOCATION_SUGGESTIONS } from "@/lib/locations";
import { useApp } from "@/providers/app-provider";
import type { RecruiterOnboardingData } from "@/types";

const recruiterSteps = [
  { title: "Akun PIC Rekruter", note: "Identitas perwakilan resmi", icon: User },
  { title: "Profil Perusahaan", note: "Entitas & operasional bisnis", icon: Building2 },
  { title: "Dokumen Legalitas", note: "NIB OSS & NPWP (PDF)", icon: FileCheck },
  { title: "Review & Pengajuan", note: "Antrean compliance review", icon: ShieldCheck },
] as const;

const INDUSTRY_OPTIONS = [
  "Teknologi & Perangkat Lunak (SaaS / IT)",
  "Fintech & Layanan Keuangan",
  "Hospitality, Pariwisata & Hotel",
  "E-Commerce & Retail Modern",
  "FMCG & Manufaktur",
  "Kesehatan, Farmasi & Medtech",
  "Logistik, Transportasi & Supply Chain",
  "Konsultan & Layanan Bisnis Profesional",
  "Media, Entertainment & Kreatif",
  "Pendidikan & Edutech",
  "Lainnya",
];

const COMPANY_SIZE_OPTIONS = [
  { id: "1-10", label: "1 — 10 Karyawan", desc: "Startup / Usaha Rintisan" },
  { id: "11-50", label: "11 — 50 Karyawan", desc: "Pertumbuhan Awal (Early Growth)" },
  { id: "51-200", label: "51 — 200 Karyawan", desc: "Menengah (Mid-Sized Company)" },
  { id: "201-500", label: "201 — 500 Karyawan", desc: "Perusahaan Besar (Large Company)" },
  { id: "500+", label: "500+ Karyawan", desc: "Korporasi / Enterprise Nasional" },
];

const draftKey = "proofylink-recruiter-onboarding-draft";

const inputClass =
  "h-11 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaClass =
  "min-h-28 w-full resize-none rounded-md border bg-transparent px-3 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function Field({
  label,
  required,
  optional,
  id,
  extraBadge,
  children,
  hint,
  error,
}: {
  label: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  id?: string;
  extraBadge?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5" id={id ? `field-${id}` : undefined}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id ? `input-${id}` : undefined}
          className="text-sm font-semibold text-foreground flex items-center gap-1.5 select-none"
        >
          <span>{label}</span>
          {required && (
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
              Wajib
            </span>
          )}
          {optional && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 border border-border/70 rounded-md px-1.5 py-0.5 leading-none">
              Opsional
            </span>
          )}
        </label>
        {extraBadge && <div>{extraBadge}</div>}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive flex items-center gap-1.5 animate-fade-up">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

function Intro({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{value || "Belum diisi"}</div>
    </div>
  );
}

const defaultForm: RecruiterOnboardingData = {
  picName: "",
  picTitle: "",
  picPhone: "",
  picEmail: "",
  companyName: "",
  companyPhone: "",
  industry: "",
  companySize: "",
  description: "",
  websiteUrl: "",
  linkedinUrl: "",
  officeAddress: "",
  city: "",
  nibNumber: "",
  nibFileName: "",
  npwpNumber: "",
  npwpFileName: "",
  verificationStatus: "draft",
};

function getSavedDraft(): { form: RecruiterOnboardingData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.form) {
      return {
        form: { ...defaultForm, ...parsed.form },
        step: typeof parsed.step === "number" ? Math.min(Math.max(parsed.step, 0), recruiterSteps.length - 1) : 0,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function RecruiterOnboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, setProvisioningStatus, reloadBootstrap } = useApp();

  const [step, setStep] = useState<number>(() => {
    const rawParam = typeof window !== "undefined" ? searchParams?.get("step") : null;
    const paramStep = rawParam !== null && rawParam !== undefined ? parseInt(rawParam, 10) : NaN;
    if (!isNaN(paramStep) && paramStep >= 0 && paramStep < recruiterSteps.length) {
      return paramStep;
    }
    const draft = getSavedDraft();
    return draft?.step ?? 0;
  });

  const [form, setForm] = useState<RecruiterOnboardingData>(() => {
    const draft = getSavedDraft();
    const registeredCompany =
      draft?.form?.companyName ||
      user?.companyName ||
      (user?.role === "recruiter" && user?.name && user.name !== "Recruiter" ? user.name : "") ||
      "";

    const draftPic = draft?.form?.picName || "";
    const cleanPic =
      draftPic.trim().toLowerCase() === registeredCompany.trim().toLowerCase() ||
      draftPic.trim().toLowerCase() === (user?.name || "").trim().toLowerCase()
        ? ""
        : draftPic;

    return {
      ...(draft?.form ?? defaultForm),
      companyName: registeredCompany,
      picName: cleanPic,
      picEmail: draft?.form?.picEmail || user?.email || "",
    };
  });

  const [agreementChecked, setAgreementChecked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<"nib" | "npwp" | null>(null);
  const [revisionReason, setRevisionReason] = useState<string | null>(() => user?.provisioningReason || null);
  const [isRevisionMode, setIsRevisionMode] = useState(() => user?.provisioningStatus === "revision_required");
  const [, setLoadingInitial] = useState(true);

  const formRef = useRef(form);
  const stepRef = useRef(step);
  const hasEditsRef = useRef(false);
  const publishedRef = useRef(false);

  // Fetch pre-existing database record on mount to pre-fill on revision or page reload
  useEffect(() => {
    let active = true;
    const fetchExistingData = async () => {
      try {
        const res = await fetch("/api/recruiter/onboarding", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data) return;

        if (data.isRevision) {
          setIsRevisionMode(true);
          setRevisionReason(data.revisionReason || user?.provisioningReason || null);
        } else if (data.revisionReason) {
          setRevisionReason(data.revisionReason);
        }

        const dbForm = data.form as RecruiterOnboardingData | undefined;
        if (dbForm) {
          setForm((prev) => {
            const draft = getSavedDraft()?.form;
            const registeredCompany =
              draft?.companyName ||
              dbForm.companyName ||
              prev.companyName ||
              user?.companyName ||
              (user?.role === "recruiter" && user?.name && user.name !== "Recruiter" ? user.name : "") ||
              "";

            // PIC name should NEVER be autofilled from registered company name or user.name for recruiter
            let resolvedPic = draft?.picName || dbForm.picName || "";
            if (
              resolvedPic.trim().toLowerCase() === registeredCompany.trim().toLowerCase() ||
              resolvedPic.trim().toLowerCase() === (user?.name || "").trim().toLowerCase()
            ) {
              resolvedPic = "";
            }

            const merged: RecruiterOnboardingData = {
              picName: resolvedPic,
              picTitle: draft?.picTitle || dbForm.picTitle || prev.picTitle || "",
              picPhone: draft?.picPhone || dbForm.picPhone || prev.picPhone || "",
              picEmail: draft?.picEmail || dbForm.picEmail || prev.picEmail || user?.email || "",
              companyName: registeredCompany,
              companyPhone: draft?.companyPhone || dbForm.companyPhone || prev.companyPhone || "",
              industry: draft?.industry || dbForm.industry || prev.industry || "",
              companySize: draft?.companySize || dbForm.companySize || prev.companySize || "",
              description: draft?.description || dbForm.description || prev.description || "",
              websiteUrl: draft?.websiteUrl || dbForm.websiteUrl || prev.websiteUrl || "",
              linkedinUrl: draft?.linkedinUrl || dbForm.linkedinUrl || prev.linkedinUrl || "",
              officeAddress: draft?.officeAddress || dbForm.officeAddress || prev.officeAddress || "",
              city: draft?.city || dbForm.city || prev.city || "",
              nibNumber: draft?.nibNumber || dbForm.nibNumber || prev.nibNumber || "",
              nibFileName: draft?.nibFileName || dbForm.nibFileName || prev.nibFileName || (dbForm.nibDocumentUrl ? "NIB_Perusahaan.pdf" : ""),
              nibDocumentUrl: draft?.nibDocumentUrl || dbForm.nibDocumentUrl || prev.nibDocumentUrl || "",
              npwpNumber: draft?.npwpNumber || dbForm.npwpNumber || prev.npwpNumber || "",
              npwpFileName: draft?.npwpFileName || dbForm.npwpFileName || prev.npwpFileName || (dbForm.npwpDocumentUrl ? "NPWP_Perusahaan.pdf" : ""),
              npwpDocumentUrl: draft?.npwpDocumentUrl || dbForm.npwpDocumentUrl || prev.npwpDocumentUrl || "",
              verificationStatus: data.isRevision ? "needs_revision" : prev.verificationStatus,
            };
            formRef.current = merged;
            return merged;
          });

          const rawParam = searchParams?.get("step");
          if ((rawParam === null || rawParam === undefined) && data.isRevision) {
            setStep(2);
            stepRef.current = 2;
          }
        }
      } catch (err) {
        console.error("Gagal memuat data onboarding:", err);
      } finally {
        if (active) setLoadingInitial(false);
      }
    };

    void fetchExistingData();
    return () => {
      active = false;
    };
  }, [user?.name, user?.email, user?.role, user?.companyName, user?.provisioningReason, searchParams]);

  useEffect(() => {
    formRef.current = form;
    stepRef.current = step;
  }, [form, step]);

  const goToStep = (targetStep: number) => {
    if (targetStep < 0 || targetStep >= recruiterSteps.length) return;
    setStep(targetStep);
    stepRef.current = targetStep;
    setStepError(null);
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ form: formRef.current, step: targetStep }));
    } catch {
      // ignore
    }
  };

  // Immediate draft flush on tab switch, window blur, pagehide, and beforeunload
  useEffect(() => {
    const saveImmediately = () => {
      if (publishedRef.current) return;
      const currentForm = formRef.current;
      const currentStep = stepRef.current;
      if (hasEditsRef.current || currentForm.companyName.trim() || currentForm.picName.trim()) {
        try {
          window.localStorage.setItem(draftKey, JSON.stringify({ form: currentForm, step: currentStep }));
        } catch {
          // ignore
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveImmediately();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveImmediately);
    window.addEventListener("beforeunload", saveImmediately);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveImmediately);
      window.removeEventListener("beforeunload", saveImmediately);
    };
  }, []);

  // Debounced draft autosave
  useEffect(() => {
    if (publishedRef.current || (!hasEditsRef.current && !form.companyName.trim() && !form.picName.trim())) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      } catch {
        // ignore
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form, step]);

  const update = <K extends keyof RecruiterOnboardingData>(key: K, val: RecruiterOnboardingData[K]) => {
    hasEditsRef.current = true;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      formRef.current = next;
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setStepError(null);
  };

  const handleFileUpload = async (field: "nibFileName" | "npwpFileName", file: File | null) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Format berkas tidak valid. Hanya berkas PDF (.pdf) yang diperbolehkan.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran berkas PDF maksimal 10MB");
      return;
    }

    const docType = field === "nibFileName" ? "nib" : "npwp";
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);

      const res = await fetch("/api/recruiter/legal-docs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah berkas PDF");
      }

      hasEditsRef.current = true;
      setForm((prev) => {
        const next = {
          ...prev,
          [field]: file.name,
          [field === "nibFileName" ? "nibDocumentUrl" : "npwpDocumentUrl"]: data.storagePath,
        };
        formRef.current = next;
        return next;
      });

      setErrors((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      });
      setStepError(null);
      toast.success(`Berkas PDF ${file.name} berhasil diunggah!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah berkas PDF.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.picName.trim()) errs.picName = "Nama lengkap PIC wajib diisi.";
      if (!form.picTitle.trim()) errs.picTitle = "Jabatan / posisi PIC di perusahaan wajib diisi.";
    } else if (s === 1) {
      if (!form.companyName.trim()) errs.companyName = "Nama resmi entitas bisnis (PT/CV) wajib diisi.";
      if (!form.industry) errs.industry = "Kategori industri wajib dipilih.";
      if (!form.companySize) errs.companySize = "Skala perusahaan wajib dipilih.";
      if (!form.picEmail.trim() || !form.picEmail.includes("@")) {
        errs.picEmail = "Email resmi perusahaan wajib diisi dengan format valid.";
      }
      const digits = extractIndonesianLocalPhone(form.picPhone);
      if (!digits) {
        errs.picPhone = "Nomor WhatsApp / telepon wajib diisi.";
      } else if (digits.length < 8) {
        errs.picPhone = "Nomor telepon minimal 8 digit angka.";
      }
      const companyDigits = extractIndonesianLocalPhone(form.companyPhone || "");
      if (!companyDigits) {
        errs.companyPhone = "Nomor telepon kantor / perusahaan wajib diisi.";
      } else if (companyDigits.length < 6) {
        errs.companyPhone = "Nomor telepon kantor minimal 6 digit angka.";
      } else if (companyDigits.length > 15) {
        errs.companyPhone = "Nomor telepon kantor maksimal 15 digit angka.";
      }
      if (!form.description.trim()) errs.description = "Deskripsi operasional bisnis wajib diisi.";
      if (!form.city.trim()) errs.city = "Domisili kota operasional kantor wajib diisi.";
      if (!form.officeAddress.trim()) errs.officeAddress = "Alamat kantor operasional wajib diisi.";
    } else if (s === 2) {
      if (!form.nibDocumentUrl) {
        errs.nib = "Dokumen resmi NIB OSS dalam format PDF (.pdf) wajib diunggah.";
      }
      if (!form.npwpDocumentUrl) {
        errs.npwp = "Dokumen resmi NPWP Badan Usaha dalam format PDF (.pdf) wajib diunggah.";
      }
    }

    setErrors(errs);
    const keys = Object.keys(errs);
    if (keys.length > 0) {
      setStepError("Mohon lengkapi seluruh isian wajib yang ditandai sebelum melanjutkan.");
      const firstKey = keys[0];
      setTimeout(() => {
        const el = document.getElementById(`input-${firstKey}`) || document.querySelector(`[name="${firstKey}"]`);
        (el as HTMLElement)?.focus();
      }, 50);
      return false;
    }
    setStepError(null);
    return true;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!validateStep(step)) return;

    if (step < recruiterSteps.length - 1) {
      goToStep(step + 1);
    } else {
      void handleSubmitFinal();
    }
  };

  const handleSubmitFinal = async () => {
    if (!agreementChecked) {
      setStepError("Anda harus menyetujui pernyataan keabsahan dokumen sebelum mengirim berkas.");
      toast.error("Anda harus menyetujui pernyataan keabsahan dokumen.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Mengirim data & dokumen legalitas...");

    try {
      const res = await fetch("/api/recruiter/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan berkas pendaftaran.");

      publishedRef.current = true;
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }

      setProvisioningStatus("pending");
      await reloadBootstrap();

      toast.success("Dokumen legalitas berhasil dikirim ke antrean review compliance!", {
        id: toastId,
        description: "Tim compliance kami akan memverifikasi keabsahan data dalam 1x24 jam kerja.",
      });

      router.push("/recruiter/pending");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim berkas.", {
        id: toastId,
      });
      setIsSubmitting(false);
    }
  };

  const handleExit = async () => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      toast.info("Draf onboarding tersimpan di browser.");
    } catch {
      // ignore
    }
    await logout();
    router.push("/login");
  };

  return (
    <ProtectedRoute role="recruiter">
      <div className="fixed inset-0 z-10 flex flex-col overflow-hidden bg-background md:p-3 lg:p-6">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col md:flex-row overflow-hidden border-border bg-card md:rounded-2xl md:border md:shadow-2xl">
          {/* Mobile Brand Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-dark-navy px-4 py-3 text-white md:hidden">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="size-4" />
              </span>
              <span>ProofyLink</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-purple-200">
              Rekruter
            </span>
          </div>

          {/* Desktop Left Sidebar */}
          <aside className="hidden w-[285px] shrink-0 flex-col bg-dark-navy p-7 text-white md:flex">
            <div className="flex items-center gap-2 font-bold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="size-5" />
              </span>
              ProofyLink
            </div>
            <div className="mt-16">
              <h1 className="text-3xl font-bold leading-tight tracking-tight">Verifikasi organisasi &amp; akses talent terpercaya.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Lengkapi identitas PIC, legalitas perusahaan, dan dokumen resmi untuk standar kepatuhan rekrutmen.
              </p>
            </div>
            <div className="mt-auto space-y-2">
              {recruiterSteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => goToStep(index)}
                    disabled={isSubmitting}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      index === step
                        ? "bg-white text-foreground shadow-xs font-medium"
                        : index < step
                        ? "text-emerald-300 hover:bg-white/10"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors ${
                        index === step
                          ? "bg-primary text-white font-bold"
                          : index < step
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-slate-400"
                      }`}
                    >
                      {index < step ? <Check className="size-3.5 stroke-[2.5]" /> : <Icon className="size-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xs font-semibold truncate">{item.title}</strong>
                      <small className={`text-[11px] truncate block ${index === step ? "text-muted-foreground" : "text-slate-400"}`}>
                        {item.note}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Panel */}
          <main className="flex min-w-0 flex-1 flex-col">
            {/* Header with Title and Progress */}
            <div className="border-b bg-card px-4 py-3.5 sm:px-8 sm:py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground md:text-2xl">{recruiterSteps[step].title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Langkah {step + 1} dari {recruiterSteps.length} · {recruiterSteps[step].note}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {Math.round(((step + 1) / recruiterSteps.length) * 100)}% selesai
                  </p>
                  <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${((step + 1) / recruiterSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-1 md:hidden">
                {recruiterSteps.map((item, index) => (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => goToStep(index)}
                    disabled={isSubmitting}
                    aria-label={`Lompat ke langkah ${index + 1}: ${item.title}`}
                    className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                      index === step
                        ? "bg-primary"
                        : index < step
                        ? "bg-emerald-500"
                        : "bg-muted hover:bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
                <div className="mx-auto max-w-2xl animate-fade-up">
                  {revisionReason && (
                    <div
                      role="alert"
                      className="mb-6 flex items-start gap-3.5 rounded-2xl border border-orange-300 bg-orange-50/90 p-4.5 text-xs text-orange-950 animate-fade-up shadow-xs"
                    >
                      <div className="size-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <FileText className="size-4" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-orange-950">Catatan Revisi Dokumen dari Tim Compliance</p>
                          <span className="text-[10px] font-bold text-orange-700 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded-full">
                            Perlu Perbaikan
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium bg-white/70 border border-orange-200/80 rounded-xl p-3">
                          {revisionReason}
                        </p>
                        <p className="text-[11px] text-orange-900 leading-normal">
                          Seluruh profil perusahaan &amp; dokumen legalitas yang telah Anda isi sebelumnya tetap tersimpan dengan aman. Anda cukup memperbarui dokumen yang diminta, lalu ajukan kembali verifikasi pada Langkah 4.
                        </p>
                      </div>
                    </div>
                  )}

                  {stepError && (
                    <div
                      role="alert"
                      className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive animate-fade-up shadow-xs"
                    >
                      <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-destructive" />
                      <div>
                        <p className="font-bold text-sm text-destructive">Periksa Isian Wajib</p>
                        <p className="mt-0.5 text-muted-foreground leading-relaxed">
                          {stepError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 0: AKUN PIC REKRUTER ── */}
                  {step === 0 && (
                    <Intro
                      title="Identitas PIC Rekruter"
                      text="Data perwakilan resmi yang akan mengelola pencarian kandidat dan rekrutmen atas nama perusahaan."
                    >
                      <div className="space-y-5">
                        <Field
                          label="Nama Lengkap PIC"
                          required
                          id="picName"
                          error={errors.picName}
                          hint="Nama lengkap perwakilan resmi perusahaan yang mendaftar."
                        >
                          <input
                            id="input-picName"
                            name="picName"
                            aria-invalid={Boolean(errors.picName)}
                            autoComplete="name"
                            className={inputClass}
                            value={form.picName}
                            onChange={(e) => update("picName", e.target.value)}
                            placeholder="Contoh: Budi Santoso / Anita Wijaya"
                          />
                        </Field>

                        <Field
                          label="Jabatan / Posisi di Perusahaan"
                          required
                          id="picTitle"
                          error={errors.picTitle}
                          hint="Contoh: Head of Talent Acquisition, HR Manager, atau Founder."
                        >
                          <input
                            id="input-picTitle"
                            name="picTitle"
                            aria-invalid={Boolean(errors.picTitle)}
                            className={inputClass}
                            value={form.picTitle}
                            onChange={(e) => update("picTitle", e.target.value)}
                            placeholder="Contoh: Head of Talent Acquisition / HR Manager"
                          />
                        </Field>
                      </div>
                    </Intro>
                  )}

                  {/* ── STEP 1: PROFIL PERUSAHAAN ── */}
                  {step === 1 && (
                    <Intro
                      title="Profil Entitas Perusahaan"
                      text="Informasi badan usaha sesuai NIB, kontak operasional, dan profil bisnis aktif."
                    >
                      <div className="space-y-5">
                        <Field
                          label="Nama Resmi Entitas Bisnis (Sesuai NIB / PT/CV)"
                          required
                          id="companyName"
                          error={errors.companyName}
                          hint="Gunakan nama legal entitas usaha yang terdaftar di Kemenkumham / OSS."
                        >
                          <input
                            id="input-companyName"
                            name="companyName"
                            aria-invalid={Boolean(errors.companyName)}
                            className={inputClass}
                            value={form.companyName}
                            onChange={(e) => update("companyName", e.target.value)}
                            placeholder="Contoh: PT Inovasi Digital Nusantara"
                          />
                        </Field>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            label="Kategori Industri"
                            required
                            id="industry"
                            error={errors.industry}
                          >
                            <select
                              id="input-industry"
                              name="industry"
                              aria-invalid={Boolean(errors.industry)}
                              className={inputClass}
                              value={form.industry}
                              onChange={(e) => update("industry", e.target.value)}
                            >
                              <option value="">-- Pilih Kategori Industri --</option>
                              {INDUSTRY_OPTIONS.map((ind) => (
                                <option key={ind} value={ind}>
                                  {ind}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field
                            label="Ukuran / Skala Perusahaan"
                            required
                            id="companySize"
                            error={errors.companySize}
                          >
                            <select
                              id="input-companySize"
                              name="companySize"
                              aria-invalid={Boolean(errors.companySize)}
                              className={inputClass}
                              value={form.companySize}
                              onChange={(e) => update("companySize", e.target.value)}
                            >
                              <option value="">-- Pilih Skala Perusahaan --</option>
                              {COMPANY_SIZE_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label} ({opt.desc})
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            label="Email Resmi Perusahaan"
                            required
                            id="picEmail"
                            hint="Disarankan menggunakan domain email resmi perusahaan."
                            error={errors.picEmail}
                          >
                            <div className="relative">
                              <Mail className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                              <input
                                id="input-picEmail"
                                name="picEmail"
                                type="email"
                                aria-invalid={Boolean(errors.picEmail)}
                                autoComplete="email"
                                spellCheck={false}
                                className={`${inputClass} pl-9`}
                                value={form.picEmail}
                                onChange={(e) => update("picEmail", e.target.value)}
                                placeholder="nama@perusahaan.com"
                              />
                            </div>
                          </Field>

                          <Field
                            label="Nomor Telepon Kantor / Perusahaan"
                            required
                            id="companyPhone"
                            error={errors.companyPhone}
                            hint="Nomor telepon operasional kantor resmi perusahaan."
                            extraBadge={
                              form.picPhone && form.picPhone !== form.companyPhone ? (
                                <button
                                  type="button"
                                  onClick={() => update("companyPhone", form.picPhone)}
                                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                                >
                                  Gunakan nomor PIC
                                </button>
                              ) : undefined
                            }
                          >
                            <IndonesianPhoneInput
                              id="input-companyPhone"
                              error={Boolean(errors.companyPhone)}
                              value={form.companyPhone || ""}
                              onChange={(val) => update("companyPhone", val)}
                              placeholder="361-555-0148 atau 812-3456-7890"
                            />
                          </Field>
                        </div>

                        <Field
                          label="Nomor WhatsApp / Telepon PIC"
                          required
                          id="picPhone"
                          error={errors.picPhone}
                          hint="Nomor aktif kontak perwakilan untuk komunikasi verifikasi."
                        >
                          <IndonesianPhoneInput
                            id="input-picPhone"
                            error={Boolean(errors.picPhone)}
                            value={form.picPhone}
                            onChange={(val) => update("picPhone", val)}
                          />
                        </Field>

                        <Field
                          label="Deskripsi Singkat Operasional Bisnis"
                          required
                          id="description"
                          error={errors.description}
                          hint="Jelaskan produk, solusi, atau fokus layanan utama perusahaan secara ringkas."
                        >
                          <textarea
                            id="input-description"
                            name="description"
                            aria-invalid={Boolean(errors.description)}
                            className={textareaClass}
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            placeholder="Jelaskan produk, fokus industri, atau solusi layanan utama perusahaan..."
                            rows={3}
                          />
                        </Field>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            label="Website Resmi Perusahaan"
                            optional
                            id="websiteUrl"
                            hint="Tautan situs web resmi perusahaan."
                          >
                            <div className="relative">
                              <Globe className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                              <input
                                id="input-websiteUrl"
                                name="websiteUrl"
                                className={`${inputClass} pl-9`}
                                value={form.websiteUrl}
                                onChange={(e) => update("websiteUrl", e.target.value)}
                                placeholder="https://perusahaan.com"
                              />
                            </div>
                          </Field>

                          <Field
                            label="LinkedIn / Profil Media Sosial"
                            optional
                            id="linkedinUrl"
                            hint="Tautan profil LinkedIn korporat."
                          >
                            <input
                              id="input-linkedinUrl"
                              name="linkedinUrl"
                              className={inputClass}
                              value={form.linkedinUrl}
                              onChange={(e) => update("linkedinUrl", e.target.value)}
                              placeholder="https://linkedin.com/company/nama"
                            />
                          </Field>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field
                            label="Kota & Provinsi Kantor"
                            required
                            id="city"
                            error={errors.city}
                            hint="Contoh: Jakarta Selatan, DKI Jakarta atau Sleman, D.I. Yogyakarta"
                          >
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                              <input
                                id="input-city"
                                name="city"
                                aria-invalid={Boolean(errors.city)}
                                className={`${inputClass} pl-9`}
                                value={form.city}
                                onChange={(e) => update("city", e.target.value)}
                                placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                                list="recruiter-locations-list"
                              />
                              <datalist id="recruiter-locations-list">
                                {POPULAR_LOCATION_SUGGESTIONS.map((loc) => (
                                  <option key={loc} value={loc} />
                                ))}
                              </datalist>
                            </div>
                          </Field>

                          <Field
                            label="Alamat Kantor Operasional"
                            required
                            id="officeAddress"
                            error={errors.officeAddress}
                            hint="Nama gedung, lantai, jalan, nomor."
                          >
                            <input
                              id="input-officeAddress"
                              name="officeAddress"
                              aria-invalid={Boolean(errors.officeAddress)}
                              className={inputClass}
                              value={form.officeAddress}
                              onChange={(e) => update("officeAddress", e.target.value)}
                              placeholder="Gedung, lantai, jalan, nomor kantor"
                            />
                          </Field>
                        </div>
                      </div>
                    </Intro>
                  )}

                  {/* ── STEP 2: DOKUMEN LEGALITAS ── */}
                  {step === 2 && (
                    <Intro
                      title="Unggah Dokumen Legalitas Resmi (PDF)"
                      text="Unggah berkas resmi NIB OSS dan NPWP Badan Usaha dalam format PDF. Berkas ini wajib dilampirkan agar tim compliance dapat memverifikasi keabsahan entitas bisnis sebelum akun diaktifkan."
                    >
                      <div className="space-y-6">
                        {/* NIB Card */}
                        <Card className={`rounded-2xl border bg-card p-5 shadow-xs space-y-3 transition-colors ${errors.nib ? "border-destructive/60 bg-destructive/5" : "border-border"}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                              <FileText className="size-4 text-primary" /> 1. Nomor Induk Berusaha (NIB OSS)
                            </span>
                            {form.nibDocumentUrl ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <Check className="size-3 text-emerald-600" /> PDF Terunggah
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                                Wajib PDF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Dokumen NIB resmi yang diterbitkan melalui sistem Online Single Submission (OSS).
                          </p>

                          {form.nibDocumentUrl ? (
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="size-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                  <FileCheck className="size-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-emerald-950 truncate">
                                    {form.nibFileName || "Berkas_NIB.pdf"}
                                  </p>
                                  <p className="text-[11px] text-emerald-700">Berkas PDF siap diverifikasi compliance</p>
                                </div>
                              </div>
                              <label className="cursor-pointer text-xs font-semibold text-primary hover:underline shrink-0 ml-3">
                                Ganti Berkas
                                <input
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  className="sr-only"
                                  disabled={uploadingDoc === "nib"}
                                  onChange={(e) => handleFileUpload("nibFileName", e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
                          ) : (
                            <label
                              className={`cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                                errors.nib
                                  ? "border-destructive/40 bg-white hover:bg-destructive/5"
                                  : "border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/50"
                              } ${uploadingDoc === "nib" ? "pointer-events-none opacity-60" : ""}`}
                            >
                              {uploadingDoc === "nib" ? (
                                <Loader2 className="size-7 text-primary animate-spin" />
                              ) : (
                                <FileUp className="size-7 text-primary/70" />
                              )}
                              <span className="text-xs font-semibold text-foreground">
                                {uploadingDoc === "nib"
                                  ? "Mengunggah berkas NIB PDF..."
                                  : "Pilih atau Tarik Berkas NIB (.pdf)"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Format resmi: Hanya PDF (Maks. 10MB)
                              </span>
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                className="sr-only"
                                disabled={uploadingDoc === "nib"}
                                onChange={(e) => handleFileUpload("nibFileName", e.target.files?.[0] || null)}
                              />
                            </label>
                          )}

                          {errors.nib && (
                            <p role="alert" className="text-xs text-destructive font-medium flex items-center gap-1.5 animate-fade-up">
                              <AlertCircle className="size-3.5" /> {errors.nib}
                            </p>
                          )}
                        </Card>

                        {/* NPWP Card */}
                        <Card className={`rounded-2xl border bg-card p-5 shadow-xs space-y-3 transition-colors ${errors.npwp ? "border-destructive/60 bg-destructive/5" : "border-border"}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                              <FileText className="size-4 text-primary" /> 2. NPWP Badan Usaha
                            </span>
                            {form.npwpDocumentUrl ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <Check className="size-3 text-emerald-600" /> PDF Terunggah
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-md px-1.5 py-0.5 leading-none tracking-wide uppercase">
                                Wajib PDF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Salinan resmi kartu NPWP Badan atau Surat Keterangan Terdaftar (SKT) dari Ditjen Pajak.
                          </p>

                          {form.npwpDocumentUrl ? (
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="size-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                  <FileCheck className="size-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-emerald-950 truncate">
                                    {form.npwpFileName || "Berkas_NPWP.pdf"}
                                  </p>
                                  <p className="text-[11px] text-emerald-700">Berkas PDF siap diverifikasi compliance</p>
                                </div>
                              </div>
                              <label className="cursor-pointer text-xs font-semibold text-primary hover:underline shrink-0 ml-3">
                                Ganti Berkas
                                <input
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  className="sr-only"
                                  disabled={uploadingDoc === "npwp"}
                                  onChange={(e) => handleFileUpload("npwpFileName", e.target.files?.[0] || null)}
                                />
                              </label>
                            </div>
                          ) : (
                            <label
                              className={`cursor-pointer flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                                errors.npwp
                                  ? "border-destructive/40 bg-white hover:bg-destructive/5"
                                  : "border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/50"
                              } ${uploadingDoc === "npwp" ? "pointer-events-none opacity-60" : ""}`}
                            >
                              {uploadingDoc === "npwp" ? (
                                <Loader2 className="size-7 text-primary animate-spin" />
                              ) : (
                                <FileUp className="size-7 text-primary/70" />
                              )}
                              <span className="text-xs font-semibold text-foreground">
                                {uploadingDoc === "npwp"
                                  ? "Mengunggah berkas NPWP PDF..."
                                  : "Pilih atau Tarik Berkas NPWP (.pdf)"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Format resmi: Hanya PDF (Maks. 10MB)
                              </span>
                              <input
                                type="file"
                                accept="application/pdf,.pdf"
                                className="sr-only"
                                disabled={uploadingDoc === "npwp"}
                                onChange={(e) => handleFileUpload("npwpFileName", e.target.files?.[0] || null)}
                              />
                            </label>
                          )}

                          {errors.npwp && (
                            <p role="alert" className="text-xs text-destructive font-medium flex items-center gap-1.5 animate-fade-up">
                              <AlertCircle className="size-3.5" /> {errors.npwp}
                            </p>
                          )}
                        </Card>

                        {/* Security Info Card */}
                        <div className="rounded-xl border border-primary/20 bg-secondary/50 p-4 text-xs text-foreground flex items-start gap-3">
                          <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                          <p className="leading-relaxed text-muted-foreground">
                            Seluruh berkas legalitas perusahaan disimpan terenkripsi dengan standar keamanan tinggi untuk verifikasi keabsahan hukum oleh tim compliance ProofyLink.
                          </p>
                        </div>
                      </div>
                    </Intro>
                  )}

                  {/* ── STEP 3: REVIEW & SUBMIT ── */}
                  {step === 3 && (
                    <Intro
                      title="Satu langkah lagi."
                      text="Tinjau detail organisasi dan berkas legalitas sebelum dikirimkan ke antrean compliance review."
                    >
                      <div className="space-y-5">
                        <Card className="overflow-hidden border-border shadow-sm rounded-2xl">
                          <div className="bg-dark-navy p-6 text-white">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-medium text-emerald-300">
                                Status: Siap Ditinjau
                              </span>
                              <span className="text-xs bg-white/10 text-purple-200 px-2.5 py-0.5 rounded-full font-medium">
                                {form.industry || "Industri"}
                              </span>
                              {form.companySize && (
                                <span className="text-xs bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                                  {form.companySize} Karyawan
                                </span>
                              )}
                            </div>
                            <h3 className="mt-3 text-2xl font-bold">{form.companyName || "Nama Perusahaan"}</h3>
                            <p className="mt-1 text-sm text-slate-300">{form.description || "Deskripsi operasional bisnis"}</p>
                            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                              <MapPin className="size-3.5 text-emerald-400" />
                              <span>{form.city || "Kota belum diisi"}</span>
                              <span className="text-slate-500">•</span>
                              <span>PIC: {form.picName} ({form.picTitle})</span>
                            </p>
                          </div>

                          <div className="grid gap-5 p-6 sm:grid-cols-2 border-b">
                            <Summary label="PIC & Jabatan" value={`${form.picName} (${form.picTitle})`} />
                            <Summary label="Kontak PIC" value={`${form.picEmail} • ${form.picPhone}`} />
                            <Summary label="Telepon Kantor Perusahaan" value={form.companyPhone || "-"} />
                            <Summary label="Kategori Industri" value={form.industry} />
                            <Summary label="Skala Perusahaan" value={`${form.companySize} Karyawan`} />
                            <Summary label="Website & Media Sosial" value={`${form.websiteUrl || "-"} • ${form.linkedinUrl || "-"}`} />
                            <Summary label="Domisili & Alamat Kantor" value={`${form.officeAddress}, ${form.city}`} />
                          </div>

                          <div className="p-6 bg-muted/20 space-y-3 text-xs">
                            <strong className="text-foreground block">Dokumen Legalitas Terlampir (PDF):</strong>
                            <div className="grid sm:grid-cols-2 gap-3 text-foreground">
                              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                                <Check className="size-4 text-emerald-600 shrink-0" />
                                <span className="truncate font-medium">
                                  NIB: {form.nibFileName ? `${form.nibFileName} (PDF Resmi)` : "Terlampir"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                                <Check className="size-4 text-emerald-600 shrink-0" />
                                <span className="truncate font-medium">
                                  NPWP: {form.npwpFileName ? `${form.npwpFileName} (PDF Resmi)` : "Terlampir"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>

                        <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-secondary/40 p-4 cursor-pointer text-xs leading-relaxed text-foreground select-none">
                          <input
                            type="checkbox"
                            checked={agreementChecked}
                            onChange={(e) => {
                              setAgreementChecked(e.target.checked);
                              setStepError(null);
                            }}
                            className="size-4 mt-0.5 rounded border-input text-primary focus:ring-primary"
                          />
                          <span>
                            Saya menyatakan bahwa seluruh data dan dokumen yang dilampirkan adalah benar, sah, dan saya memiliki wewenang resmi mewakili entitas bisnis bersangkutan untuk mendaftar di ProofyLink Talent Network.
                          </span>
                        </label>
                      </div>
                    </Intro>
                  )}
                </div>
              </div>

              {/* Bottom Navigation Bar */}
              <div className="flex items-center justify-between border-t bg-card px-4 py-3 sm:px-8 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-4">
                  {step > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => goToStep(step - 1)}
                      disabled={isSubmitting}
                      className="rounded-xl text-xs font-semibold px-3 sm:px-4 h-9 sm:h-10"
                    >
                      <ArrowLeft className="size-4 mr-1.5" />
                      Kembali
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary" />
                      <span>Langkah 1 dari {recruiterSteps.length} (Wajib)</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleExit}
                    disabled={isSubmitting}
                    className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md"
                  >
                    Keluar Akun
                  </button>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-xs text-xs sm:text-sm px-5 sm:px-7 h-10 sm:h-11 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                      Mengirim Pengajuan...
                    </>
                  ) : step === recruiterSteps.length - 1 ? (
                    <>
                      {isRevisionMode ? "Kirim Ulang Dokumen Revisi" : "Kirim Dokumen Compliance"}
                      <UploadCloud className="size-4 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="size-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
