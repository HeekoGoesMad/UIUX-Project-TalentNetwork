/**
 * Candidate Notification Copy & Formatter Module
 * Follows /impeccable standards: distilled, human, dignified Indonesian copy.
 * Strictly avoids emojis and AI slop.
 */

export type ApplicationStage =
  | "applied"
  | "shortlisted"
  | "screening"
  | "assessment"
  | "review"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

/**
 * Remove any emoji characters and collapse double whitespace.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    // Strip emojis, pictographs, symbols, variation selectors
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/**
 * Format official application stage notification for candidates.
 */
export function formatApplicationStageNotification(params: {
  stage: string;
  jobTitle: string;
  organizationName?: string | null;
}): { title: string; body: string } {
  const job = sanitizeText(params.jobTitle) || "posisi yang dilamar";
  const org = params.organizationName ? sanitizeText(params.organizationName) : null;
  const companySuffix = org ? ` di ${org}` : "";

  const stageLower = params.stage.trim().toLowerCase();

  switch (stageLower) {
    case "shortlisted":
      return {
        title: `Kandidat Unggulan: ${job}`,
        body: `Lamaran Anda untuk posisi ${job}${companySuffix} telah terpilih masuk ke dalam daftar kandidat unggulan.`,
      };
    case "screening":
      return {
        title: `Tahap Skrining: ${job}`,
        body: `Tim rekruter${companySuffix} sedang meninjau kualifikasi dan berkas pengalaman Anda untuk posisi ${job}.`,
      };
    case "assessment":
      return {
        title: `Tahap Asesmen: ${job}`,
        body: `Lamaran Anda untuk posisi ${job}${companySuffix} telah memasuki tahap pengerjaan asesmen kompetensi.`,
      };
    case "review":
      return {
        title: `Tahap Peninjauan: ${job}`,
        body: `Berkas lamaran Anda untuk posisi ${job}${companySuffix} sedang ditinjau lebih lanjut oleh tim rekruter.`,
      };
    case "interview":
      return {
        title: `Tahap Wawancara: ${job}`,
        body: `Lamaran Anda untuk posisi ${job}${companySuffix} berlanjut ke tahap wawancara. Tim rekruter akan segera mengonfirmasi jadwal temu resmi.`,
      };
    case "offer":
      return {
        title: `Penawaran Kerja: ${job}`,
        body: `Surat penawaran kerja resmi untuk posisi ${job}${companySuffix} telah diterbitkan. Silakan periksa rincian dan tanggapi penawaran tersebut.`,
      };
    case "hired":
      return {
        title: `Penerimaan Kerja: ${job}`,
        body: `Proses seleksi untuk posisi ${job}${companySuffix} telah selesai dan status lamaran Anda telah diperbarui menjadi diterima.`,
      };
    case "rejected":
      return {
        title: `Pembaruan Lamaran: ${job}`,
        body: `Terima kasih atas partisipasi Anda dalam seleksi ${job}${companySuffix}. Saat ini tim rekruter memutuskan untuk melanjutkan proses bersama kandidat lain.`,
      };
    case "withdrawn":
      return {
        title: `Lamaran Ditarik: ${job}`,
        body: `Permintaan penarikan lamaran untuk posisi ${job} telah berhasil diproses.`,
      };
    default:
      return {
        title: `Pembaruan Lamaran: ${job}`,
        body: `Status lamaran Anda untuk posisi ${job}${companySuffix} telah diperbarui menjadi ${stageLower}.`,
      };
  }
}

/**
 * Distill and clarify any legacy notification text into professional, emoji-free copy.
 */
export function distillNotificationContent(input: {
  title: string;
  body?: string | null;
  type?: string;
  data?: unknown;
}): { title: string; body: string; changed: boolean } {
  const rawTitle = input.title || "";
  const rawBody = input.body || "";

  let nextTitle = rawTitle;
  let nextBody = rawBody;

  // 1. Check legacy application stage pattern: "Status lamaran: <stage>"
  const statusMatch = rawTitle.match(/^Status lamaran:\s*(\w+)$/i);
  if (statusMatch) {
    const stage = statusMatch[1].toLowerCase();
    // Try to extract jobTitle from body: "Status lamaran untuk <Job> berubah menjadi <stage>."
    let jobTitle = "posisi yang dilamar";
    const bodyMatch = rawBody.match(/Status lamaran untuk\s+(.+?)\s+berubah menjadi/i);
    if (bodyMatch && bodyMatch[1]) {
      jobTitle = bodyMatch[1].trim();
    }
    const formatted = formatApplicationStageNotification({ stage, jobTitle });
    nextTitle = formatted.title;
    nextBody = formatted.body;
  }

  // 2. Check legacy offer letter title / body
  else if (/^Surat Penawaran Kerja:\s*(.+)$/i.test(rawTitle)) {
    const jobTitleMatch = rawTitle.match(/^Surat Penawaran Kerja:\s*(.+)$/i);
    const jobTitle = sanitizeText(jobTitleMatch ? jobTitleMatch[1] : "");
    nextTitle = `Surat Penawaran Kerja: ${jobTitle}`;
    nextBody = `Perusahaan telah menerbitkan surat penawaran kerja resmi untuk posisi ${jobTitle}. Silakan periksa rincian dan konfirmasi penawaran ini.`;
  }

  // 3. Check legacy profile viewed: "Profil kamu dibuka oleh <Company> ✨"
  else if (/^Profil\s*(?:kamu\s*)?dibuka oleh\s+(.+)$/i.test(rawTitle)) {
    const companyMatch = rawTitle.match(/^Profil\s*(?:kamu\s*)?dibuka oleh\s+(.+)$/i);
    const company = sanitizeText(companyMatch ? companyMatch[1] : "Perusahaan Mitra");
    nextTitle = `Profil Dilihat: ${company}`;
    nextBody = `${company} baru saja membuka profil lengkap dan sedang meninjau kualifikasi Anda.`;
  }

  // 4. Check assessment invitation: "Invitation assessment baru"
  else if (/^Invitation assessment baru$/i.test(rawTitle.trim())) {
    nextTitle = "Undangan Asesmen Kompetensi";
    nextBody = "Anda diundang untuk menyelesaikan asesmen kompetensi kerja. Silakan periksa instruksi dan batas waktu pengerjaan.";
  }

  // 5. Check assessment review: "Review assessment completed" / "Review assessment selesai"
  else if (/^Review assessment\s*(completed|selesai|memerlukan perhatian|disputed)?$/i.test(rawTitle.trim())) {
    const status = (rawTitle.match(/Review assessment\s*(.+)?/i)?.[1] || "").toLowerCase();
    if (status === "memerlukan perhatian" || status === "disputed") {
      nextTitle = "Catatan Evaluasi Asesmen";
      nextBody = "Terdapat catatan evaluasi asesmen yang memerlukan peninjauan kembali.";
    } else {
      nextTitle = "Hasil Evaluasi Asesmen Selesai";
      nextBody = "Evaluasi asesmen kompetensi Anda telah selesai dinilai oleh peninjau. Silakan buka ringkasan untuk melihat catatan evaluasi.";
    }
  }

  // 6. Check consent request: "Permintaan consent baru"
  else if (/^Permintaan consent baru$/i.test(rawTitle.trim())) {
    nextTitle = "Permintaan Izin Akses Kontak";
    const purposeMatch = rawBody.match(/(?:untuk:\s*|keperluan:\s*)(.+)$/i);
    if (purposeMatch && purposeMatch[1]) {
      nextBody = `Rekruter mengajukan permohonan akses data kontak dan profil untuk: ${sanitizeText(purposeMatch[1])}.`;
    } else {
      nextBody = "Rekruter mengajukan permohonan akses data kontak dan verifikasi profil Anda.";
    }
  }

  // 7. Check recruiter acceptance notification: "Selamat! Anda Diterima Bekerja 🎉" or "Kandidat Menerima Penawaran! 🎉"
  else if (/Selamat!\s*Anda Diterima Bekerja/i.test(rawTitle)) {
    const jobTitleMatch = rawBody.match(/posisi\s+(.+?)\s+telah resmi diterima/i);
    const job = jobTitleMatch ? sanitizeText(jobTitleMatch[1]) : "pekerjaan";
    nextTitle = `Penerimaan Kerja: ${job}`;
    nextBody = `Lamaran Anda untuk posisi ${job} telah resmi diterima. Silakan periksa detail penugasan dan langkah selanjutnya.`;
  } else if (/Kandidat Menerima Penawaran/i.test(rawTitle)) {
    nextTitle = "Penawaran Kerja Diterima";
    nextBody = sanitizeText(rawBody).replace(/status lamaran:\s*hired\.?/gi, "Status lamaran kini resmi diterima.");
  }

  // Final pass: always sanitize any lingering emojis and trim
  nextTitle = sanitizeText(nextTitle);
  nextBody = sanitizeText(nextBody);

  const changed = nextTitle !== rawTitle || nextBody !== rawBody;
  return { title: nextTitle, body: nextBody, changed };
}
