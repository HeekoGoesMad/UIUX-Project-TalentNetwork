import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror pure calendar logic for isolated Node unit testing
function formatIcsDateTime(isoString) {
  const date = new Date(isoString);
  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeIcsText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function generateIcs(event) {
  const startDate = new Date(event.start);
  const durationMs = (event.durationMinutes ?? 45) * 60 * 1000;
  const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + durationMs);

  const startFormatted = formatIcsDateTime(startDate.toISOString());
  const endFormatted = formatIcsDateTime(endDate.toISOString());
  const stampFormatted = formatIcsDateTime(new Date("2026-08-20T10:00:00Z").toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProofyLink//Talent Network Hiring//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:test-uid@proofylink.com`,
    `DTSTAMP:${stampFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  }

  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

describe("Calendar .ics Generator", () => {
  it("formats dates into RFC 5545 UTC timestamp format", () => {
    const formatted = formatIcsDateTime("2026-08-20T09:00:00+07:00");
    assert.equal(formatted, "20260820T020000Z");
  });

  it("properly escapes commas, semicolons, and newlines in event text", () => {
    const raw = "Interview Panel:\n- Tech Lead, Senior Dev; HR";
    const escaped = escapeIcsText(raw);
    assert.equal(escaped, "Interview Panel:\\n- Tech Lead\\, Senior Dev\\; HR");
  });

  it("produces a valid RFC 5545 VCALENDAR payload", () => {
    const ics = generateIcs({
      title: "Technical Interview - Nadia",
      description: "Discussion on system architecture & Dover workflow.",
      location: "https://meet.google.com/abc-defg-hij",
      start: "2026-08-20T09:00:00Z",
      durationMinutes: 60,
    });

    assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
    assert.ok(ics.includes("VERSION:2.0"));
    assert.ok(ics.includes("BEGIN:VEVENT"));
    assert.ok(ics.includes("SUMMARY:Technical Interview - Nadia"));
    assert.ok(ics.includes("DTSTART:20260820T090000Z"));
    assert.ok(ics.includes("DTEND:20260820T100000Z"));
    assert.ok(ics.includes("LOCATION:https://meet.google.com/abc-defg-hij"));
    assert.ok(ics.endsWith("END:VCALENDAR"));
  });
});
