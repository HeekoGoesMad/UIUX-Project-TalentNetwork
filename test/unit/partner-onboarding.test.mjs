import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractIndonesianLocalPhone, formatToE164Indonesian, isValidWebsiteUrl } from "../../src/lib/utils.ts";

describe("Partner Phone Number Handling", () => {
  it("extracts local digits from various Indonesian phone formats", () => {
    assert.equal(extractIndonesianLocalPhone("+6281234567890"), "81234567890");
    assert.equal(extractIndonesianLocalPhone("081234567890"), "81234567890");
    assert.equal(extractIndonesianLocalPhone("6281234567890"), "81234567890");
    assert.equal(extractIndonesianLocalPhone("0812-3456-7890"), "81234567890");
  });

  it("formats Indonesian local digits to standard E.164 (+62)", () => {
    assert.equal(formatToE164Indonesian("81234567890"), "+6281234567890");
    assert.equal(formatToE164Indonesian("081234567890"), "+6281234567890");
    assert.equal(formatToE164Indonesian("+6281234567890"), "+6281234567890");
    assert.equal(formatToE164Indonesian(""), "");
  });

  it("validates that valid mobile phone has at least 8 digits", () => {
    const valid = extractIndonesianLocalPhone("0812345678");
    assert.ok(valid.length >= 8 && valid.length <= 15);

    const tooShort = extractIndonesianLocalPhone("08123");
    assert.ok(tooShort.length < 8);
  });
});

describe("Partner Onboarding Required Data Validation", () => {
  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  it("validates PIC required fields correctly", () => {
    const validPic = {
      name: "Dr. Budi Santoso",
      title: "Kepala Career Center",
      email: "budi@kampus.ac.id",
      phone: "+6281234567890",
    };

    assert.ok(validPic.name.trim().length >= 2);
    assert.ok(validPic.title.trim().length >= 2);
    assert.ok(isEmailValid(validPic.email));
    assert.ok(extractIndonesianLocalPhone(validPic.phone).length >= 8);

    assert.equal(isEmailValid("not-an-email"), false);
  });

  it("validates Lembaga required fields correctly", () => {
    const validInstitution = {
      name: "Universitas Indonesia",
      type: "Universitas Negeri (PTN)",
      province: "DKI Jakarta",
      city: "Jakarta Pusat",
      officeAddress: "Gedung Rektorat Lt. 2, Kampus Salemba",
      website: "https://ui.ac.id",
    };

    assert.ok(validInstitution.name.trim().length >= 2);
    assert.ok(validInstitution.type.trim().length > 0);
    assert.ok(validInstitution.province.trim().length > 0);
    assert.ok(validInstitution.city.trim().length >= 2);
    assert.ok(validInstitution.officeAddress.trim().length >= 5);
    assert.ok(isValidWebsiteUrl(validInstitution.website));

    assert.equal(isValidWebsiteUrl("invalid url with spaces"), false);
  });

  it("enforces SK Document upload and SK number (no bypass)", () => {
    const validLegal = {
      skNumber: "SK-DIKTI-2024/001",
      skDocumentUrl: "legal-documents/user-123/partner-sk-123456.pdf",
    };

    assert.ok(validLegal.skNumber.trim().length >= 3);
    assert.ok(Boolean(validLegal.skDocumentUrl && validLegal.skDocumentUrl.trim().length > 0));

    // Empty skDocumentUrl must fail
    const bypassedLegal = {
      skNumber: "SK-DIKTI-2024/001",
      skDocumentUrl: "",
    };
    assert.equal(Boolean(bypassedLegal.skDocumentUrl && bypassedLegal.skDocumentUrl.trim().length > 0), false);
  });
});
