export type CalendarEvent = {
  title: string;
  description?: string;
  location?: string;
  start: Date | string;
  durationMinutes?: number;
  timezone?: string;
  organizerName?: string;
  organizerEmail?: string;
};

export function generateIcs(event: CalendarEvent): string {
  const startDate = new Date(event.start);
  const duration = event.durationMinutes || 45;
  const endDate = new Date(startDate.getTime() + duration * 60000);

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const uid = `proofylink-interview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@proofylink.com`;
  const stamp = formatIcsDate(new Date());
  const startStr = formatIcsDate(startDate);
  const endStr = formatIcsDate(endDate);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProofyLink//Recruiter Hiring Flow//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description || "Sesi wawancara ProofyLink Talent Network.").replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location || "Google Meet"}`,
    event.organizerName ? `ORGANIZER;CN=${event.organizerName}:mailto:${event.organizerEmail || "recruitment@proofylink.com"}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function downloadIcsFile(event: CalendarEvent, filename?: string) {
  try {
    const icsData = generateIcs(event);
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `interview-${Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Gagal mengunduh file iCalendar:", err);
  }
}
