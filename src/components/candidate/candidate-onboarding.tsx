"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  { title: "Review & publish", note: "Siap ditemukan", icon: ShieldCheck },
] as const;

const emptyHistory: HistoryItem = { company: "", role: "", dates: "", achievements: [""] };
const emptyEducation: EducationItem = { school: "", program: "", dates: "" };
const careerLabels: Record<CareerStatus, string> = {
  "open-to-work": "Siap bekerja",
  "open-for-opportunities": "Terbuka untuk peluang",
  "freelance-available": "Tersedia untuk freelance",
  "internship-available": "Tersedia untuk magang",
  "not-available": "Belum tersedia",
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

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[#0f2040]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputClass = "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus-visible:border-[#19a974] focus-visible:ring-[3px] focus-visible:ring-[#19a974]/20";
const textareaClass = "min-h-28 w-full resize-none rounded-lg border bg-white px-3 py-3 text-sm outline-none transition-[color,box-shadow] placeholder:text-slate-400 focus-visible:border-[#19a974] focus-visible:ring-[3px] focus-visible:ring-[#19a974]/20";

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

  useEffect(() => {
    if (!user || !bootstrapped || !cvProfile) return;
    const timer = window.setTimeout(() => setForm(initialForm(cvProfile, careerStatus, user.email)), 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, careerStatus, cvProfile, user]);

  useEffect(() => {
    if (!user || !bootstrapped || cvProfile) return;
    const timer = window.setTimeout(() => setForm((current) => ({
      ...current,
      fullName: current.fullName || user.name,
      email: current.email || user.email,
    })), 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapped, cvProfile, user]);

  const setValue = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateHistory = (index: number, key: keyof HistoryItem, value: string) => setValue("experience", form.experience.map((item, itemIndex) => itemIndex === index ? key === "achievements" ? { ...item, achievements: [value] } : { ...item, [key]: value } : item));
  const updateEducation = (index: number, key: keyof EducationItem, value: string) => setValue("education", form.education.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const addTag = (kind: "skills" | "tools") => {
    const value = tagInput[kind].trim();
    if (!value || form[kind].includes(value)) return;
    setValue(kind, [...form[kind], value]);
    setTagInput((current) => ({ ...current, [kind]: "" }));
  };
  const removeTag = (kind: "skills" | "tools", tag: string) => setValue(kind, form[kind].filter((item) => item !== tag));
  const finish = async () => {
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
    await saveCvProfile(profile);
    toast.success("Profile berhasil dipublish", { description: "Recruiter sekarang dapat menemukan profilmu sesuai pengaturan." });
    router.push("/candidate");
  };
  const next = () => step === steps.length - 1 ? void finish() : setStep((current) => current + 1);
  const submit = (event: FormEvent) => { event.preventDefault(); next(); };

  return (
    <ProtectedRoute role="candidate">
      <div className="fixed inset-0 z-10 overflow-hidden bg-[#f3f7fb] pt-20">
        <div className="mx-auto flex h-full max-w-7xl overflow-hidden border-x border-[#dbe5ed] bg-white shadow-xl shadow-[#102c52]/10">
          <aside className="hidden w-[285px] shrink-0 flex-col bg-[#0b2342] p-7 text-white md:flex">
            <div className="flex items-center gap-2 font-bold"><span className="flex size-8 items-center justify-center rounded-lg bg-[#19a974] text-[#0b2342]"><ShieldCheck className="size-5" /></span>ProofyLink</div>
             <div className="mt-16"><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7aaee0]">Onboarding kandidat</p><h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">Bangun profil yang terasa seperti kamu.</h1><p className="mt-4 text-sm leading-6 text-[#b7c8dc]">Jawab beberapa pertanyaan singkat. Kamu tetap memegang kendali sebelum profil dipublikasikan.</p></div>
            <div className="mt-auto space-y-2">
              {steps.map((item, index) => { const Icon = item.icon; return <div key={item.title} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${index === step ? "bg-white text-[#0f2040]" : index < step ? "text-[#8de0be]" : "text-[#8fa7c0]"}`}><span className={`flex size-7 items-center justify-center rounded-full text-xs ${index === step ? "bg-[#d7f5e8] text-[#08744f]" : "bg-white/10"}`}>{index < step ? <Check className="size-4" /> : <Icon className="size-4" />}</span><span><strong className="block font-semibold">{item.title}</strong><small className={`text-xs ${index === step ? "text-slate-500" : "text-[#8fa7c0]"}`}>{item.note}</small></span></div>; })}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="border-b bg-white px-5 py-4 sm:px-10"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[11px] uppercase tracking-widest text-[#08744f]">Langkah {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p><h2 className="mt-1 text-xl font-bold text-[#0f2040] md:text-2xl">{steps[step].title}</h2></div><div className="text-right"><p className="text-xs font-semibold text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}% selesai</p><div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-[#e9f1f7] sm:w-40"><div className="h-full rounded-full bg-[#19a974] transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div></div><div className="mt-4 flex gap-1 md:hidden">{steps.map((item, index) => <span key={item.title} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-[#19a974]" : "bg-[#e9f1f7]"}`} />)}</div></div>
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 sm:px-10"><div className="mx-auto max-w-2xl animate-fade-up">{step === 0 && <StatusStep value={form.careerStatus} onChange={(value) => setValue("careerStatus", value)} />}{step === 1 && <BasicStep form={form} setValue={setValue} />}{step === 2 && <LocationStep form={form} setValue={setValue} />}{step === 3 && <HistoryStep items={form.experience} update={updateHistory} add={() => setValue("experience", [...form.experience, { ...emptyHistory }])} remove={(index) => setValue("experience", form.experience.filter((_, itemIndex) => itemIndex !== index))} />}{step === 4 && <EducationStep items={form.education} update={updateEducation} add={() => setValue("education", [...form.education, { ...emptyEducation }])} remove={(index) => setValue("education", form.education.filter((_, itemIndex) => itemIndex !== index))} />}{step === 5 && <TagsStep form={form} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag} />}{step === 6 && <ArrangementStep value={form.workArrangement} onChange={(value) => setValue("workArrangement", value)} />}{step === 7 && <ReviewStep form={form} />}</div></div>
               <div className="flex items-center justify-between border-t bg-white px-5 py-4 sm:px-10"><Button type="button" variant="ghost" onClick={() => step ? setStep((current) => current - 1) : router.push("/candidate")}><ArrowLeft className="size-4" />{step ? "Kembali" : "Nanti saja"}</Button><Button type="button" size="lg" onClick={next}>{step === steps.length - 1 ? "Publikasikan profil" : "Lanjut"}<ArrowRight className="size-4" /></Button></div>
            </form>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StatusStep({ value, onChange }: { value: CareerStatus; onChange: (value: CareerStatus) => void }) { return <Intro title="Kamu sedang berada di fase mana?" text="Pilih status yang paling mendekati. Status ini bisa kamu ubah kapan saja."><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(CAREER_STATUS_CONFIG) as CareerStatus[]).map((status) => { const config = CAREER_STATUS_CONFIG[status]; return <button type="button" key={status} onClick={() => onChange(status)} aria-pressed={value === status} className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19a974] ${value === status ? "border-[#19a974] bg-[#f0fdf9] ring-2 ring-[#19a974]/20" : "bg-white"}`}><span className="text-xl">{config.emoji}</span><strong className="mt-3 block text-sm">{careerLabels[status]}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{status === "not-available" ? "Belum ingin menerima peluang" : "Terbuka untuk percakapan yang relevan"}</span></button>; })}</div></Intro>; }

function Intro({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <div><h3 className="text-2xl font-bold tracking-tight text-[#0f2040]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text}</p><div className="mt-7">{children}</div></div>; }
  function BasicStep({ form, setValue }: { form: FormState; setValue: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) { return <Intro title="Mari kenalan lebih dekat." text="Tulis ringkasan singkat agar recruiter langsung memahami arah kariermu."><div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Nama lengkap"><input required className={inputClass} value={form.fullName} onChange={(event) => setValue("fullName", event.target.value)} placeholder="Nama lengkap" /></Field><Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={(event) => setValue("email", event.target.value)} placeholder="nama@email.com" /></Field></div><Field label="Headline profesional" hint="Contoh: Product Designer yang suka memecahkan masalah kompleks"><input required className={inputClass} value={form.headline} onChange={(event) => setValue("headline", event.target.value)} placeholder="Apa yang kamu kerjakan dengan baik?" /></Field><Field label="Tentang kamu"><textarea required className={textareaClass} value={form.about} onChange={(event) => setValue("about", event.target.value)} placeholder="Ceritakan pengalaman, cara berpikir, atau hal yang sedang kamu cari..." /></Field><Field label="Nomor telepon"><input className={inputClass} value={form.phone} onChange={(event) => setValue("phone", event.target.value)} placeholder="+62 812..." /></Field></div></Intro>; }
function LocationStep({ form, setValue }: { form: FormState; setValue: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) { return <Intro title="Di mana kamu ingin bekerja?" text="Lokasi membantu recruiter menemukan kecocokan yang realistis."><div className="space-y-5"><Field label="Domisili saat ini"><input required className={inputClass} value={form.location} onChange={(event) => setValue("location", event.target.value)} placeholder="Jakarta Selatan" /></Field><Field label="Peran yang dituju" hint="Satu peran utama membantu profilmu tampil lebih fokus."><input required className={inputClass} value={form.targetRole} onChange={(event) => setValue("targetRole", event.target.value)} placeholder="Product Designer" /></Field><Card className="border-[#bcebd8] bg-[#f0fdf9] p-5"><div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-[#08744f]" /><div><p className="text-sm font-semibold text-[#0f2040]">Privasi tetap di tanganmu</p><p className="mt-1 text-xs leading-5 text-[#416579]">Lokasi yang kamu masukkan tampil sebagai area umum, bukan alamat lengkap.</p></div></div></Card></div></Intro>; }

function HistoryStep({ items, update, add, remove }: { items: HistoryItem[]; update: (index: number, key: keyof HistoryItem, value: string) => void; add: () => void; remove: (index: number) => void }) { return <Intro title="Pengalaman yang membentukmu." text="Tambahkan pekerjaan yang paling relevan. Tidak harus sempurna, kamu bisa mengeditnya nanti."><div className="space-y-4">{items.map((item, index) => <Card key={index} className="p-5"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-widest text-[#08744f]">Pengalaman {index + 1}</span>{items.length > 1 && <button type="button" onClick={() => remove(index)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Hapus</button>}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Perusahaan"><input className={inputClass} value={item.company} onChange={(event) => update(index, "company", event.target.value)} placeholder="Nama perusahaan" /></Field><Field label="Jabatan"><input className={inputClass} value={item.role} onChange={(event) => update(index, "role", event.target.value)} placeholder="Product Designer" /></Field></div><Field label="Periode"><input className={`${inputClass} mt-4`} value={item.dates} onChange={(event) => update(index, "dates", event.target.value)} placeholder="2022 - sekarang" /></Field><Field label="Pencapaian utama" hint="Satu hasil yang paling ingin kamu tunjukkan"><textarea className={`${textareaClass} mt-4 min-h-20`} value={item.achievements[0] ?? ""} onChange={(event) => update(index, "achievements", event.target.value)} placeholder="Contoh: Meningkatkan aktivasi pengguna sebesar 20%" /></Field></Card>)}<Button type="button" variant="outline" onClick={add}><Plus className="size-4" />Tambah pengalaman</Button></div></Intro>; }
function EducationStep({ items, update, add, remove }: { items: EducationItem[]; update: (index: number, key: keyof EducationItem, value: string) => void; add: () => void; remove: (index: number) => void }) { return <Intro title="Latar belajarmu." text="Pendidikan formal, bootcamp, atau program belajar yang ingin kamu tampilkan."><div className="space-y-4">{items.map((item, index) => <Card key={index} className="p-5"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-widest text-[#08744f]">Pendidikan {index + 1}</span>{items.length > 1 && <button type="button" onClick={() => remove(index)} className="text-xs font-semibold text-muted-foreground hover:text-destructive">Hapus</button>}</div><div className="space-y-4"><Field label="Institusi"><input className={inputClass} value={item.school} onChange={(event) => update(index, "school", event.target.value)} placeholder="Universitas atau program" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Program studi"><input className={inputClass} value={item.program} onChange={(event) => update(index, "program", event.target.value)} placeholder="Desain Komunikasi Visual" /></Field><Field label="Periode"><input className={inputClass} value={item.dates} onChange={(event) => update(index, "dates", event.target.value)} placeholder="2018 - 2022" /></Field></div></div></Card>)}<Button type="button" variant="outline" onClick={add}><Plus className="size-4" />Tambah pendidikan</Button></div></Intro>; }

function TagsStep({ form, tagInput, setTagInput, addTag, removeTag }: { form: FormState; tagInput: { skills: string; tools: string }; setTagInput: React.Dispatch<React.SetStateAction<{ skills: string; tools: string }>>; addTag: (kind: "skills" | "tools") => void; removeTag: (kind: "skills" | "tools", tag: string) => void }) { const group = (kind: "skills" | "tools", label: string, placeholder: string) => <Field label={label} hint="Tekan Enter untuk menambahkan"><div className="rounded-lg border bg-white p-2 focus-within:border-[#19a974] focus-within:ring-[3px] focus-within:ring-[#19a974]/20"><div className="flex flex-wrap gap-2">{form[kind].map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#e3f5ed] px-2.5 py-1 text-xs font-semibold text-[#08744f]">{tag}<button type="button" aria-label={`Hapus ${tag}`} onClick={() => removeTag(kind, tag)}><X className="size-3" /></button></span>)}<input className="h-7 min-w-[140px] flex-1 border-0 px-1 text-sm outline-none" value={tagInput[kind]} onChange={(event) => setTagInput((current) => ({ ...current, [kind]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(kind); } }} placeholder={placeholder} /></div></div></Field>; return <Intro title="Apa yang kamu kuasai?" text="Pilih kata-kata yang membantu recruiter memahami kekuatanmu."><div className="space-y-6">{group("skills", "Skills", "Contoh: User Research")}{group("tools", "Tools", "Contoh: Figma")}</div></Intro>; }
function ArrangementStep({ value, onChange }: { value: CvProfile["workArrangement"]; onChange: (value: CvProfile["workArrangement"]) => void }) { const options: { value: CvProfile["workArrangement"]; title: string; text: string }[] = [{ value: "remote", title: "Remote", text: "Bekerja sepenuhnya dari lokasi pilihanmu" }, { value: "hybrid", title: "Hybrid", text: "Menggabungkan kerja remote dan dari kantor" }, { value: "onsite", title: "On-site", text: "Bekerja dari lokasi kantor" }]; return <Intro title="Cara kerja seperti apa yang cocok?" text="Preferensi ini membantu percakapan awal terasa lebih relevan."><div className="space-y-3">{options.map((option) => <button type="button" key={option.value} onClick={() => onChange(option.value)} aria-pressed={value === option.value} className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#19a974] ${value === option.value ? "border-[#19a974] bg-[#f0fdf9]" : "bg-white"}`}><span className={`mt-0.5 flex size-5 items-center justify-center rounded-full border ${value === option.value ? "border-[#19a974] bg-[#19a974] text-white" : "border-slate-300"}`}>{value === option.value && <Check className="size-3.5" />}</span><span><strong className="block text-sm">{option.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{option.text}</span></span></button>)}</div></Intro>; }
function ReviewStep({ form }: { form: FormState }) { return <Intro title="Satu langkah lagi." text="Review detailmu sebelum profil ini ditemukan recruiter."><Card className="overflow-hidden border-[#dbe5ed]"><div className="bg-[#0b2342] p-6 text-white"><p className="text-xs text-[#8de0be]">{careerLabels[form.careerStatus]}</p><h3 className="mt-2 text-2xl font-bold">{form.fullName || "Nama kamu"}</h3><p className="mt-1 text-sm text-[#b7c8dc]">{form.headline || "Headline profesional"}</p><p className="mt-4 flex items-center gap-2 text-xs text-[#b7c8dc]"><MapPin className="size-3.5" />{form.location || "Lokasi belum diisi"} <span className="text-[#55718f]">•</span> {form.workArrangement}</p></div><div className="grid gap-5 p-6 sm:grid-cols-2"><Summary label="Target role" value={form.targetRole} /><Summary label="Pengalaman" value={`${form.experience.filter((item) => item.company || item.role).length} entri`} /><Summary label="Pendidikan" value={`${form.education.filter((item) => item.school || item.program).length} entri`} /><Summary label="Skills & tools" value={`${form.skills.length + form.tools.length} item`} /></div></Card><div className="mt-5 flex gap-3 rounded-lg bg-[#fff8e8] p-4 text-sm text-[#805d12]"><ShieldCheck className="size-5 shrink-0" /><p>Dengan publish, profilmu akan tampil sesuai status karier dan preferensi kerja yang kamu pilih.</p></div></Intro>; }
function Summary({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-[#0f2040]">{value || "Belum diisi"}</p></div>; }
