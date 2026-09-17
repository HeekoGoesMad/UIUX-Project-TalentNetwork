/**
 * Konfigurasi dan utilitas data lokasi & provinsi Indonesia untuk ProofyLink Talent Network.
 * Standar format lokasi kandidat: "[Kabupaten/Kota], [Provinsi]" (contoh: "Sleman, D.I. Yogyakarta")
 */

export const INDONESIAN_PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "D.I. Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Barat Daya",
] as const;

export type IndonesianProvince = (typeof INDONESIAN_PROVINCES)[number];

/**
 * Daftar rekomendasi pasangan Kabupaten/Kota & Provinsi populer untuk autocomplete/datalist
 */
export const POPULAR_LOCATION_SUGGESTIONS = [
  "Jakarta Selatan, DKI Jakarta",
  "Jakarta Pusat, DKI Jakarta",
  "Jakarta Barat, DKI Jakarta",
  "Jakarta Timur, DKI Jakarta",
  "Jakarta Utara, DKI Jakarta",
  "Bandung, Jawa Barat",
  "Bekasi, Jawa Barat",
  "Bogor, Jawa Barat",
  "Depok, Jawa Barat",
  "Cimahi, Jawa Barat",
  "Tangerang, Banten",
  "Tangerang Selatan, Banten",
  "Serang, Banten",
  "Semarang, Jawa Tengah",
  "Surakarta (Solo), Jawa Tengah",
  "Banyumas (Purwokerto), Jawa Tengah",
  "Sleman, D.I. Yogyakarta",
  "Bantul, D.I. Yogyakarta",
  "Kota Yogyakarta, D.I. Yogyakarta",
  "Surabaya, Jawa Timur",
  "Malang, Jawa Timur",
  "Sidoarjo, Jawa Timur",
  "Badung, Bali",
  "Denpasar, Bali",
  "Gianyar, Bali",
  "Medan, Sumatera Utara",
  "Deli Serdang, Sumatera Utara",
  "Padang, Sumatera Barat",
  "Pekanbaru, Riau",
  "Batam, Kepulauan Riau",
  "Palembang, Sumatera Selatan",
  "Bandar Lampung, Lampung",
  "Balikpapan, Kalimantan Timur",
  "Samarinda, Kalimantan Timur",
  "Pontianak, Kalimantan Barat",
  "Banjarmasin, Kalimantan Selatan",
  "Makassar, Sulawesi Selatan",
  "Manado, Sulawesi Utara",
] as const;

/**
 * Mengekstrak nama Provinsi dari string lokasi format "Kabupaten/Kota, Provinsi".
 * Contoh: "Sleman, D.I. Yogyakarta" -> "D.I. Yogyakarta"
 * Contoh: "Jakarta Selatan, DKI Jakarta" -> "DKI Jakarta"
 * Contoh: "Bandung" -> "Bandung" (fallback jika belum ada koma)
 */
export function getProvinceFromLocation(location: string | null | undefined): string {
  if (!location) return "";
  const trimmed = location.trim();
  const commaIndex = trimmed.lastIndexOf(",");
  if (commaIndex !== -1) {
    return trimmed.substring(commaIndex + 1).trim();
  }
  return trimmed;
}

/**
 * Mengekstrak nama Kabupaten/Kota dari string lokasi format "Kabupaten/Kota, Provinsi".
 * Contoh: "Sleman, D.I. Yogyakarta" -> "Sleman"
 */
export function getKabupatenFromLocation(location: string | null | undefined): string {
  if (!location) return "";
  const trimmed = location.trim();
  const commaIndex = trimmed.indexOf(",");
  if (commaIndex !== -1) {
    return trimmed.substring(0, commaIndex).trim();
  }
  return trimmed;
}

/**
 * Memeriksa apakah lokasi kandidat cocok dengan salah satu provinsi yang dipilih.
 * Mendukung pencocokan parsial dan case-insensitive.
 */
export function matchesLocationProvince(
  candidateLocation: string | null | undefined,
  selectedProvinces: string[]
): boolean {
  if (!selectedProvinces || selectedProvinces.length === 0) return true;
  if (!candidateLocation) return false;

  const candidateProv = getProvinceFromLocation(candidateLocation).toLowerCase();
  const rawLower = candidateLocation.toLowerCase();

  return selectedProvinces.some((p) => {
    const provLower = p.toLowerCase().trim();
    return candidateProv === provLower || rawLower.includes(provLower);
  });
}
