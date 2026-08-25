"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Hammer,
  MapPin,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { CAREER_STATUS_CONFIG, type CareerStatus, type CvProfile } from "@/types";

type HistoryItem = CvProfile["experience"][number];
type EducationItem = CvProfile["education"][number];
type TextField = "fullName" | "email" | "headline" | "about" | "location" | "targetRole";
type FormState = {
  careerStatus: CareerStatus;
  fullName: string;
  headline: string;
  about: string;
  location: string;
  targetRole: string;
  email: string;
  phone: string;
  experience: HistoryItem[];
  education: EducationItem[];
  skills: string[];
  tools: string[];
  workArrangement: CvProfile["workArrangement"];
};

const steps = [
  { title: "Status karier", note: "Kesiapanmu saat ini", icon: Rocket },
  { title: "Tentang kamu", note: "Profil dasar", icon: UserRound },
  { title: "Lokasi", note: "Tempat kerja pilihan", icon: MapPin },
  { title: "Pengalaman", note: "Cerita pekerjaanmu", icon: BriefcaseBusiness },
  { title: "Pendidikan", note: "Latar belajar", icon: GraduationCap },
  { title: "Keahlian", note: "Skill dan tools", icon: Hammer },
  { title: "Cara kerja", note: "Pengaturan kerja", icon: Sparkles },
  { title: "Review & Publikasikan", note: "Siap ditemukan", icon: ShieldCheck },
] as const;

const emptyHistory: HistoryItem = { company: "", role: "", dates: "", achievements: [""] };
const emptyEducation: EducationItem = { school: "", program: "", dates: "" };
const careerLabels: Record<CareerStatus, string> = {
  "open-to-work": "Open to Work",
  "open-for-opportunities": "Open for Opportunities",
  "freelance-available": "Freelance",
  "internship-available": "Internship",
  "not-available": "Not Available",
};
const draftKey = "proofylink-onboarding-draft";
const requiredLabels: Record<TextField, string> = {
  fullName: "Nama lengkap",
  email: "Email",
  headline: "Headline profesional",
  about: "Tentang kamu",
  location: "Domisili saat ini",
  targetRole: "Peran yang dituju",
};
const requiredByStep: Record<number, TextField[]> = {
  1: ["fullName", "email", "headline", "about"],
  2: ["location", "targetRole"],
};

const initialForm = (profile: CvProfile | null, careerStatus: CareerStatus, email: string): FormState => ({
  careerStatus: profile?.careerStatus ?? careerStatus,
  fullName: profile?.fullName ?? "",
  headline: profile?.headline ?? "",
  about: profile?.about ?? "",
  location: profile?.location ?? "",
  targetRole: profile?.targetRole ?? "",
  email: profile?.email ?? email,
  phone: profile?.phone ?? "",
  experience: profile?.experience?.length ? profile.experience : [{ ...emptyHistory }],
  education: profile?.education?.length ? profile.education : [{ ...emptyEducation }],
  skills: profile?.skills ?? [],
  tools: profile?.tools ?? [],
  workArrangement: profile?.workArrangement ?? "hybrid",
});

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs font-medium text-destructive">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";
const textareaClass =
  "min-h-28 w-full resize-none rounded-md border bg-transparent px-3 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function isMeaningfulDraft(value: FormState) {
  return Boolean(
    value.fullName.trim() ||
      value.headline.trim() ||
      value.about.trim() ||
      value.location.trim() ||
      value.targetRole.trim() ||
      value.phone.trim() ||
      value.skills.length ||
      value.tools.length ||
      value.experience.some((item) => item.company.trim() || item.role.trim() || item.dates.trim() || item.achievements.some((entry) => entry.trim())) ||
      value.education.some((item) => item.school.trim() || item.program.trim() || item.dates.trim()),
  );
}

function isValidDraftPayload(value: unknown): value is { form: FormState; step: number } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { form?: Partial<FormState>; step?: unknown };
  return typeof candidate.form?.fullName === "string" && typeof candidate.form.email === "string" && typeof candidate.step === "number";
}

export function CandidateOnboarding() {
  const router = useRouter();
  const { user, cvProfile, careerStatus, bootstrapped, saveCvProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    const profile = cvProfile ?? null;
    const initial = initialForm(profile, careerStatus, user?.email ?? "");
    return { ...initial, fullName: initial.fullName || user?.name || "" };
  });
  const [tagInput, setTagInput] = useState({ skills: "", tools: "" });
  const [errors, setErrors] = useState<Partial<Record<TextField, string>>>({});
  const [edits, setEdits] = useState(0);
  const restoredRef = useRef(false);
  const draftAppliedRef = useRef(false);
  const publishedRef = useRef(false);

  useEffect(() => {
    if (!bootstrapped || !user || restoredRef.current) return;
    restoredRef.current = true;
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(draftKey);
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (!isValidDraftPayload(parsed) || !isMeaningfulDraft(parsed.form)) return;
        draftAppliedRef.current = true;
        setForm(parsed.form);
        setStep(Math.min(Math.max(Math.trunc(parsed.step), 0), steps.length - 1));
        setEdits((current) => current + 1);
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, user]);

  useEffect(() => {
    if (!user || !bootstrapped || !cvProfile || draftAppliedRef.current) return;
    const timer = window.setTimeout(() => {
      if (draftAppliedRef.current) return;
      setForm(initialForm(cvProfile, careerStatus, user.email));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, careerStatus, cvProfile, user]);

  useEffect(() => {
    if (!user || !bootstrapped || cvProfile || draftAppliedRef.current) return;
    const timer = window.setTimeout(() => {
      if (draftAppliedRef.current) return;
      setForm((current) => ({
        ...current,
        fullName: current.fullName || user.name,
        email: current.email || user.email,
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, cvProfile, user]);

  useEffect(() => {
    if (!restoredRef.current || publishedRef.current || !edits) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
      } catch {
        return;
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [form, step, edits]);

  useEffect(() => {
    if (!edits || publishedRef.current) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [edits]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setEdits((current) => current + 1);
    if (key in requiredLabels) setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const updateHistory = (index: number, key: "company" | "role" | "dates", value: string) =>
    setValue("experience", form.experience.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const updateAchievement = (index: number, achievementIndex: number, value: string) =>
    setValue("experience", form.experience.map((item, itemIndex) => itemIndex === index ? { ...item, achievements: item.achievements.map((entry, entryIndex) => entryIndex === achievementIndex ? value : entry) } : item));
  const addAchievement = (index: number) =>
    setValue("experience", form.experience.map((item, itemIndex) => itemIndex === index ? { ...item, achievements: [...item.achievements, ""] } : item));
  const removeAchievement = (index: number, achievementIndex: number) =>
    setValue("experience", form.experience.map((item, itemIndex) => itemIndex === index ? { ...item, achievements: item.achievements.filter((_, entryIndex) => entryIndex !== achievementIndex) } : item));
  const updateEducation = (index: number, key: keyof EducationItem, value: string) =>
    setValue("education", form.education.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const addTag = (kind: "skills" | "tools") => {
    const value = tagInput[kind].trim();
    if (!value || form[kind].includes(value)) return;
    setValue(kind, [...form[kind], value]);
    setTagInput((current) => ({ ...current, [kind]: "" }));
  };
  const removeTag = (kind: "skills" | "tools", tag: string) => setValue(kind, form[kind].filter((item) => item !== tag));

  const validateFields = (fields: TextField[]) => {
    const found: Partial<Record<TextField, string>> = {};
    for (const field of fields) {
      const text = form[field].trim();
      if (!text) found[field] = `${requiredLabels[field]} wajib diisi.`;
      else if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) found[field] = "Format email belum valid.";
    }
    setErrors(found);
    return found;
  };

  const finish = async () => {
    const found = validateFields(Object.keys(requiredLabels) as TextField[]);
    const missing = Object.keys(found) as TextField[];
    if (missing.length > 0) {
      toast.error("Profil belum lengkap", { description: "Lengkapi isian wajib yang bertanda merah sebelum mempublikasikan." });
      setStep(missing.some((field) => requiredByStep[1]?.includes(field)) ? 1 : 2);
      return;
    }
    const profile: CvProfile = {
      id: cvProfile?.id ?? `cv-${Date.now()}`,
      fullName: form.fullName.trim(),
      headline: form.headline,
      about: form.about,
      location: form.location,
      email: form.email,
      phone: form.phone,
      skills: form.skills,
      tools: form.tools,
      industries: cvProfile?.industries ?? [],
      experience: form.experience.filter((item) => item.company || item.role),
      education: form.education.filter((item) => item.school || item.program),
      certifications: cvProfile?.certifications ?? [],
      portfolio: cvProfile?.portfolio ?? [],
      targetRole: form.targetRole,
      workArrangement: form.workArrangement,
      openToWork: form.careerStatus !== "not-available",
      careerStatus: form.careerStatus,
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveCvProfile(profile);
    } catch {
      toast.error("Gagal mempublikasikan", { description: "Coba lagi beberapa saat. Drafmu tetap tersimpan di perangkat ini." });
      return;
    }
    publishedRef.current = true;
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      return;
    }
    toast.success("Profil berhasil dipublikasikan", { description: "Recruiter sekarang dapat menemukan profilmu sesuai pengaturan." });
    router.push("/candidate");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateFields(requiredByStep[step] ?? []);
    if ((Object.keys(found) as TextField[]).length > 0) {
      toast.error("Periksa kembali formulir", { description: "Ada isian wajib yang belum terisi dengan benar." });
      return;
    }
    if (step === steps.length - 1) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  };

  const exitWithoutPublishing = () => {
    if (edits > 0 && !publishedRef.current && isMeaningfulDraft(form)) {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ form, step }));
        toast.info("Draf tersimpan di perangkat ini", { description: "Buka kembali onboarding untuk melanjutkan dari langkah terakhirmu." });
      } catch {
        toast.warning("Draf tidak dapat disimpan", { description: "Penyimpanan lokal browser sedang tidak tersedia." });
      }
    }
    router.push("/candidate");
  };

  return (
    <ProtectedRoute role="candidate">
      <div className="fixed inset-0 z-10 overflow-hidden bg-background pt-20">
        <div className="mx-auto flex h-full max-w-7xl overflow-hidden border-x border-border bg-card shadow-xl">
          <aside className="hidden w-[285px] shrink-0 flex-col bg-[#0b2342] p-7 text-white md:flex">
            <div className="flex items-center gap-2 font-bold"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span>ProofyLink</div>
             <div className="mt-16"><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7aaee0]">Onboarding kandidat</p><h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">Bangun profil yang terasa seperti kamu.</h1><p className="mt-4 text-sm leading-6 text-[#b7c8dc]">Jawab beberapa pertanyaan singkat. Kamu tetap memegang kendali sebelum profil dipublikasikan.</p></div>
            <div className="mt-auto space-y-2">
              {steps.map((item, index) => { const Icon = item.icon; return <div key={item.title} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${index === step ? "bg-white text-foreground" : index < step ? "text-[#8de0be]" : "text-[#8fa7c0]"}`}><span className={`flex size-7 items-center justify-center rounded-full text-xs ${index === step ? "bg-secondary text-secondary-foreground" : "bg-white/10"}`}>{index < step ? <Check className="size-4" /> : <Icon className="size-4" />}</span><span><strong className="block font-semibold">{item.title}</strong><small className={`text-xs ${index === step ? "text-muted-foreground" : "text-[#8fa7c0]"}`}>{item.note}</small></span></div>; })}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="border-b bg-card px-5 py-4 sm:px-10"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[11px] uppercase tracking-widest text-primary">Langkah {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p><h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">{steps[step].title}</h2></div><div className="text-right"><p className="text-xs font-semibold text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}% selesai</p><div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div></div><div className="mt-4 flex gap-1 md:hidden">{steps.map((item, index) => <span key={item.title} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />)}</div></div>
            <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-10"><div className="mx-auto max-w-2xl animate-fade-up">{step === 0 && <StatusStep value={form.careerStatus} onChange={(value) => setValue("careerStatus", value)} />}{step === 1 && <BasicStep form={form} errors={errors} setValue={setValue} />}{step === 2 && <LocationStep form={form} errors={errors} setValue={setValue} />}{step === 3 && <HistoryStep items={form.experience} update={updateHistory} updateAchievement={updateAchievement} addAchievement={addAchievement} removeAchievement={removeAchievement} add={() => setValue("experience", [...form.experience, { ...emptyHistory }])} remove={(index) => setValue("experience", form.experience.filter((_, itemIndex) => itemIndex !== index))} />}{step === 4 && <EducationStep items={form.education} update={updateEducation} add={() => setValue("education", [...form.education, { ...emptyEducation }])} remove={(index) => setValue("education", form.education.filter((_, itemIndex) => itemIndex !== index))} />}{step === 5 && <TagsStep form={form} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag} />}{step === 6 && <ArrangementStep value={form.workArrangement} onChange={(value) => setValue("workArrangement", value)} />}{step === 7 && <ReviewStep form={form} />}</div></div>
               <div className="flex items-center justify-between border-t bg-card px-5 py-4 sm:px-10"><Button type="button" variant="ghost" onClick={() => step ? setStep((current) => current - 1) : exitWithoutPublishing()}><ArrowLeft className="size-4" />{step ? "Kembali" : "Nanti saja"}</Button><Button type="submit" size="lg">{step === steps.length - 1 ? "Publikasikan profil" : "Lanjut"}<ArrowRight className="size-4" /></Button></div>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatusStep({ value, onChange }: { value: CareerStatus; onChange: (value: CareerStatus) => void }) { return <Intro title="Kamu sedang berada di fase mana?" text="Pilih status yang paling mendekati. Status ini bisa kamu ubah kapan saja."><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(CAREER_STATUS_CONFIG) as CareerStatus[]).map((status) => { const config = CAREER_STATUS_CONFIG[status]; return <button type="button" key={status} onClick={() => onChange(status)} aria-pressed={value === status} className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === status ? "border-primary bg-secondary ring-2 ring-primary/20" : "bg-card"}`}><span className="text-xl">{config.emoji}</span><strong className="mt-3 block text-sm">{careerLabels[status]}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{status === "not-available" ? "Belum ingin menerima peluang" : "Terbuka untuk percakapan yang relevan"}</span></button>; })}</div></Intro>; }

function Intro({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <div><h3 className="text-2xl font-bold tracking-tight text-foreground">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p><div className="mt-7">{children}</div></div>; }
  function BasicStep({ form, errors, setValue }: { form: FormState; errors: Partial<Record<TextField, string>>; setValue: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) { return <Intro title="Mari kenalan lebih dekat." text="Tulis ringkasan singkat agar recruiter langsung memahami arah kariermu."><div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Nama lengkap" error={errors.fullName}><input required aria-invalid={Boolean(errors.fullName)} autoComplete="name" className={inputClass} value={form.fullName} onChange={(event) => setValue("fullName", event.target.value)} placeholder="Nama lengkap" /></Field><Field label="Email" error={errors.email}><input required aria-invalid={Boolean(errors.email)} type="email" autoComplete="email" spellCheck={false} className={inputClass} value={form.email} onChange={(event) => setValue("email", event.target.value)} placeholder="nama@email.com" /></Field></div><Field label="Headline profesional" hint="Contoh: Product Designer yang suka memecahkan masalah kompleks" error={errors.headline}><input required aria-invalid={Boolean(errors.headline)} className={inputClass} value={form.headline} onChange={(event) => setValue("headline", event.target.value)} placeholder="Apa yang kamu kerjakan dengan baik?" /></Field><Field label="Tentang kamu" error={errors.about}><textarea required aria-invalid={Boolean(errors.about)} className={textareaClass} value={form.about} onChange={(event) => setValue("about", event.target.value)} placeholder="Ceritakan pengalaman, cara berpikir, atau hal yang sedang kamu cari..." /></Field><Field label="Nomor telepon"><input autoComplete="tel" className={inputClass} value={form.phone} onChange={(event) => setValue("phone", event.target.value)} placeholder="+62 812..." /></Field></div></Intro>; }
function LocationStep({ form, errors, setValue }: { form: FormState; errors: Partial<Record<TextField, string>>; setValue: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) { return <Intro title="Di mana kamu ingin bekerja?" text="Lokasi membantu recruiter menemukan kecocokan yang realistis."><div className="space-y-5"><Field label="Domisili saat ini" error={errors.location}><input required aria-invalid={Boolean(errors.location)} className={inputClass} value={form.location} onChange={(event) => setValue("location", event.target.value)} placeholder="Jakarta Selatan" /></Field><Field label="Peran yang dituju" hint="Satu peran utama membantu profilmu tampil lebih fokus." error={errors.targetRole}><input required aria-invalid={Boolean(errors.targetRole)} className={inputClass} value={form.targetRole} onChange={(event) => setValue("targetRole", event.target.value)} placeholder="Product Designer" /></Field><Card className="border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-emerald-700" /><div><p className="text-sm font-semibold text-emerald-900">Privasi tetap di tanganmu</p><p className="mt-1 text-xs leading-5 text-emerald-800">Lokasi yang kamu masukkan tampil sebagai area umum, bukan alamat lengkap.</p></div></div></Card></div></Intro>; }

function HistoryStep({ items, update, updateAchievement, addAchievement, removeAchievement, add, remove }: { items: HistoryItem[]; update: (index: number, key: "company" | "role" | "dates", value: string) => void; updateAchievement: (index: number, achievementIndex: number, value: string) => void; addAchievement: (index: number) => void; removeAchievement: (index: number, achievementIndex: number) => void; add: () => void; remove: (index: number) => void }) { return <Intro title="Pengalaman yang membentukmu." text="Tambahkan pekerjaan yang paling relevan. Tidak harus sempurna, kamu bisa mengeditnya nanti."><div className="space-y-4">{items.map((item, index) => <Card key={index} className="p-5"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-widest text-primary">Pengalaman {index + 1}</span>{items.length > 1 && <button type="button" onClick={() => remove(index)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Hapus</button>}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Perusahaan"><input className={inputClass} value={item.company} onChange={(event) => update(index, "company", event.target.value)} placeholder="Nama perusahaan" /></Field><Field label="Jabatan"><input className={inputClass} value={item.role} onChange={(event) => update(index, "role", event.target.value)} placeholder="Product Designer" /></Field></div><Field label="Periode"><input className={`${inputClass} mt-4`} value={item.dates} onChange={(event) => update(index, "dates", event.target.value)} placeholder="2022 - sekarang" /></Field><div className="mt-4 space-y-2"><span className="block text-sm font-semibold text-foreground">Pencapaian</span><span className="block text-xs text-muted-foreground">Tulis hasil terukur, satu pencapaian per kolom.</span>{item.achievements.map((achievement, achievementIndex) => <div key={achievementIndex} className="flex items-start gap-2"><textarea aria-label={`Pencapaian ${achievementIndex + 1}`} className={`${textareaClass} min-h-20`} value={achievement} onChange={(event) => updateAchievement(index, achievementIndex, event.target.value)} placeholder={achievementIndex === 0 ? "Contoh: Meningkatkan aktivasi pengguna sebesar 20%" : "Tambahkan pencapaian lain"} />{item.achievements.length > 1 && <button type="button" aria-label={`Hapus pencapaian ${achievementIndex + 1}`} onClick={() => removeAchievement(index, achievementIndex)} className="mt-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>}</div>)}<Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => addAchievement(index)}><Plus className="size-4" />Tambah pencapaian</Button></div></Card>)}<Button type="button" variant="outline" onClick={add}><Plus className="size-4" />Tambah pengalaman</Button></div></Intro>; }
function EducationStep({ items, update, add, remove }: { items: EducationItem[]; update: (index: number, key: keyof EducationItem, value: string) => void; add: () => void; remove: (index: number) => void }) { return <Intro title="Latar belajarmu." text="Pendidikan formal, bootcamp, atau program belajar yang ingin kamu tampilkan."><div className="space-y-4">{items.map((item, index) => <Card key={index} className="p-5"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-widest text-primary">Pendidikan {index + 1}</span>{items.length > 1 && <button type="button" onClick={() => remove(index)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Hapus</button>}</div><div className="space-y-4"><Field label="Institusi"><input className={inputClass} value={item.school} onChange={(event) => update(index, "school", event.target.value)} placeholder="Universitas atau program" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Program studi"><input className={inputClass} value={item.program} onChange={(event) => update(index, "program", event.target.value)} placeholder="Desain Komunikasi Visual" /></Field><Field label="Periode"><input className={inputClass} value={item.dates} onChange={(event) => update(index, "dates", event.target.value)} placeholder="2018 - 2022" /></Field></div></div></Card>)}<Button type="button" variant="outline" onClick={add}><Plus className="size-4" />Tambah pendidikan</Button></div></Intro>; }

function TagsStep({ form, tagInput, setTagInput, addTag, removeTag }: { form: FormState; tagInput: { skills: string; tools: string }; setTagInput: React.Dispatch<React.SetStateAction<{ skills: string; tools: string }>>; addTag: (kind: "skills" | "tools") => void; removeTag: (kind: "skills" | "tools", tag: string) => void }) { const group = (kind: "skills" | "tools", label: string, placeholder: string) => <Field label={label} hint="Tekan Enter untuk menambahkan"><div className="rounded-md border bg-transparent p-2 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"><div className="flex flex-wrap gap-2">{form[kind].map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">{tag}<button type="button" aria-label={`Hapus ${tag}`} onClick={() => removeTag(kind, tag)}><X className="size-3" /></button></span>)}<input className="h-7 min-w-[140px] flex-1 border-0 bg-transparent px-1 text-sm outline-none" value={tagInput[kind]} onChange={(event) => setTagInput((current) => ({ ...current, [kind]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(kind); } }} placeholder={placeholder} /></div></div></Field>; return <Intro title="Apa yang kamu kuasai?" text="Pilih kata-kata yang membantu recruiter memahami kekuatanmu."><div className="space-y-6">{group("skills", "Skill", "Contoh: User Research")}{group("tools", "Tools", "Contoh: Figma")}</div></Intro>; }
function ArrangementStep({ value, onChange }: { value: CvProfile["workArrangement"]; onChange: (value: CvProfile["workArrangement"]) => void }) { const options: { value: CvProfile["workArrangement"]; title: string; text: string }[] = [{ value: "remote", title: "Remote", text: "Bekerja sepenuhnya dari lokasi pilihanmu" }, { value: "hybrid", title: "Hybrid", text: "Menggabungkan kerja remote dan dari kantor" }, { value: "onsite", title: "On-site", text: "Bekerja dari lokasi kantor" }]; return <Intro title="Cara kerja seperti apa yang cocok?" text="Preferensi ini membantu percakapan awal terasa lebih relevan."><div className="space-y-3">{options.map((option) => <button type="button" key={option.value} onClick={() => onChange(option.value)} aria-pressed={value === option.value} className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${value === option.value ? "border-primary bg-secondary" : "bg-card"}`}><span className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${value === option.value ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>{value === option.value && <Check className="size-3.5" />}</span><span><strong className="block text-sm">{option.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{option.text}</span></span></button>)}</div></Intro>; }
function ReviewStep({ form }: { form: FormState }) { return <Intro title="Satu langkah lagi." text="Tinjau detailmu sebelum profil ini ditemukan recruiter."><Card className="overflow-hidden border-border"><div className="bg-[#0b2342] p-6 text-white"><p className="text-xs text-[#8de0be]">{careerLabels[form.careerStatus]}</p><h3 className="mt-2 text-2xl font-bold">{form.fullName || "Nama kamu"}</h3><p className="mt-1 text-sm text-[#b7c8dc]">{form.headline || "Headline profesional"}</p><p className="mt-4 flex items-center gap-2 text-xs text-[#b7c8dc]"><MapPin className="size-3.5" />{form.location || "Lokasi belum diisi"} <span className="text-[#55718f]">•</span> {form.workArrangement}</p></div><div className="grid gap-5 p-6 sm:grid-cols-2"><Summary label="Target role" value={form.targetRole} /><Summary label="Pengalaman" value={`${form.experience.filter((item) => item.company || item.role).length} entri`} /><Summary label="Pendidikan" value={`${form.education.filter((item) => item.school || item.program).length} entri`} /><Summary label="Skill & tools" value={`${form.skills.length + form.tools.length} item`} /></div></Card><div className="mt-5 flex gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800"><ShieldCheck className="size-5 shrink-0" /><p>Dengan mempublikasikan, profilmu akan tampil sesuai status karier dan preferensi kerja yang kamu pilih.</p></div></Intro>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value || "Belum diisi"}</p></div>; }
