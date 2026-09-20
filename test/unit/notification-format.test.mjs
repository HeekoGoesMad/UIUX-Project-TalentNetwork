import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeText,
  formatApplicationStageNotification,
  distillNotificationContent,
} from "../../src/lib/notifications/candidate-formatter.ts";

test("sanitizeText removes emojis, pictographs, and double spaces", () => {
  const input = "Profil kamu dibuka oleh SmartFit ✨🎉  🚀";
  const result = sanitizeText(input);
  assert.equal(result, "Profil kamu dibuka oleh SmartFit");
});

test("formatApplicationStageNotification produces clean copy without emojis", () => {
  const screening = formatApplicationStageNotification({
    stage: "screening",
    jobTitle: "Senior Frontend Engineer",
    organizationName: "TechCorp",
  });
  assert.equal(screening.title, "Tahap Skrining: Senior Frontend Engineer");
  assert.match(screening.body, /TechCorp/);
  assert.doesNotMatch(screening.body, /[\u{1F300}-\u{1F9FF}]/u);

  const interview = formatApplicationStageNotification({
    stage: "interview",
    jobTitle: "Product Designer",
  });
  assert.equal(interview.title, "Tahap Wawancara: Product Designer");
  assert.match(interview.body, /tahap wawancara/);

  const hired = formatApplicationStageNotification({
    stage: "hired",
    jobTitle: "Fullstack Developer",
  });
  assert.equal(hired.title, "Penerimaan Kerja: Fullstack Developer");
  assert.match(hired.body, /diterima/);
});

test("distillNotificationContent updates legacy screening notification", () => {
  const result = distillNotificationContent({
    title: "Status lamaran: screening",
    body: "Status lamaran untuk Product Designer berubah menjadi screening.",
  });
  assert.equal(result.changed, true);
  assert.equal(result.title, "Tahap Skrining: Product Designer");
  assert.match(result.body, /meninjau kualifikasi/);
});

test("distillNotificationContent updates legacy interview notification", () => {
  const result = distillNotificationContent({
    title: "Status lamaran: interview",
    body: "Status lamaran untuk Product Designer berubah menjadi interview.",
  });
  assert.equal(result.changed, true);
  assert.equal(result.title, "Tahap Wawancara: Product Designer");
  assert.match(result.body, /berlanjut ke tahap wawancara/);
});

test("distillNotificationContent updates legacy hired notification", () => {
  const result = distillNotificationContent({
    title: "Status lamaran: hired",
    body: "Status lamaran untuk Talent Network Candidate berubah menjadi hired.",
  });
  assert.equal(result.changed, true);
  assert.equal(result.title, "Penerimaan Kerja: Talent Network Candidate");
  assert.match(result.body, /diterima/);
});

test("distillNotificationContent strips emojis and cleans profile viewed notification", () => {
  const result = distillNotificationContent({
    title: "Profil kamu dibuka oleh SmartFit ✨",
    body: "SmartFit baru saja membuka profil lengkapmu dan sedang meninjau kualifikasimu.",
  });
  assert.equal(result.changed, true);
  assert.equal(result.title, "Profil Dilihat: SmartFit");
  assert.equal(result.body, "SmartFit baru saja membuka profil lengkap dan sedang meninjau kualifikasi Anda.");
});

test("distillNotificationContent modernizes offer letter notification without slop", () => {
  const result = distillNotificationContent({
    title: "Surat Penawaran Kerja: Product Designer",
    body: "Selamat! Anda menerima penawaran kerja resmi untuk posisi Product Designer. Silakan tinjau dan konfirmasi penawaran ini.",
  });
  assert.equal(result.changed, true);
  assert.equal(result.title, "Surat Penawaran Kerja: Product Designer");
  assert.equal(
    result.body,
    "Perusahaan telah menerbitkan surat penawaran kerja resmi untuk posisi Product Designer. Silakan periksa rincian dan konfirmasi penawaran ini."
  );
  assert.doesNotMatch(result.body, /Selamat!/);
});

test("distillNotificationContent handles assessment invitation & review", () => {
  const invite = distillNotificationContent({
    title: "Invitation assessment baru",
    body: "Anda menerima invitation assessment baru dari recruiter.",
  });
  assert.equal(invite.changed, true);
  assert.equal(invite.title, "Undangan Asesmen Kompetensi");

  const review = distillNotificationContent({
    title: "Review assessment completed",
    body: "Review assessment Anda telah selesai.",
  });
  assert.equal(review.changed, true);
  assert.equal(review.title, "Hasil Evaluasi Asesmen Selesai");
});

test("distillNotificationContent returns changed: false when content is already modern", () => {
  const modern = distillNotificationContent({
    title: "Tahap Wawancara: Product Designer",
    body: "Lamaran Anda untuk posisi Product Designer berlanjut ke tahap wawancara.",
  });
  assert.equal(modern.changed, false);
});
