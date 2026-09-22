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
 * Kamus alias provinsi untuk normalisasi input pengguna.
 */
const PROVINCE_ALIASES: Record<string, IndonesianProvince> = {
  "di yogyakarta": "D.I. Yogyakarta",
  "d.i. yogyakarta": "D.I. Yogyakarta",
  "d.i yogyakarta": "D.I. Yogyakarta",
  yogyakarta: "D.I. Yogyakarta",
  jogja: "D.I. Yogyakarta",
  jogjakarta: "D.I. Yogyakarta",
  "dki jakarta": "DKI Jakarta",
  "d.k.i. jakarta": "DKI Jakarta",
  jakarta: "DKI Jakarta",
  jabar: "Jawa Barat",
  "jawa barat": "Jawa Barat",
  jatim: "Jawa Timur",
  "jawa timur": "Jawa Timur",
  jateng: "Jawa Tengah",
  "jawa tengah": "Jawa Tengah",
  sumut: "Sumatera Utara",
  "sumatera utara": "Sumatera Utara",
  sumbar: "Sumatera Barat",
  "sumatera barat": "Sumatera Barat",
  sumsel: "Sumatera Selatan",
  "sumatera selatan": "Sumatera Selatan",
  kalsel: "Kalimantan Selatan",
  kaltim: "Kalimantan Timur",
  kalbar: "Kalimantan Barat",
  kalteng: "Kalimantan Tengah",
  sulsel: "Sulawesi Selatan",
  sulteng: "Sulawesi Tengah",
  sulut: "Sulawesi Utara",
  ntb: "Nusa Tenggara Barat",
  ntt: "Nusa Tenggara Timur",
};

/**
 * Fallback mapping kota/kabupaten populer ke provinsi asal jika data lama belum menyertakan provinsi.
 */
export const CITY_TO_PROVINCE_MAP: Record<string, IndonesianProvince> = {
  denpasar: "Bali",
  badung: "Bali",
  gianyar: "Bali",
  tabanan: "Bali",
  buleleng: "Bali",
  bandung: "Jawa Barat",
  bogor: "Jawa Barat",
  depok: "Jawa Barat",
  bekasi: "Jawa Barat",
  cimahi: "Jawa Barat",
  cirebon: "Jawa Barat",
  sukabumi: "Jawa Barat",
  tasikmalaya: "Jawa Barat",
  surabaya: "Jawa Timur",
  malang: "Jawa Timur",
  sidoarjo: "Jawa Timur",
  gresik: "Jawa Timur",
  batu: "Jawa Timur",
  kediri: "Jawa Timur",
  semarang: "Jawa Tengah",
  surakarta: "Jawa Tengah",
  solo: "Jawa Tengah",
  magelang: "Jawa Tengah",
  pekalongan: "Jawa Tengah",
  tegal: "Jawa Tengah",
  banyumas: "Jawa Tengah",
  purwokerto: "Jawa Tengah",
  sleman: "D.I. Yogyakarta",
  bantul: "D.I. Yogyakarta",
  kulonprogo: "D.I. Yogyakarta",
  gunungkidul: "D.I. Yogyakarta",
  "kota yogyakarta": "D.I. Yogyakarta",
  tangerang: "Banten",
  "tangerang selatan": "Banten",
  serang: "Banten",
  cilegon: "Banten",
  medan: "Sumatera Utara",
  "deli serdang": "Sumatera Utara",
  palembang: "Sumatera Selatan",
  padang: "Sumatera Barat",
  pekanbaru: "Riau",
  batam: "Kepulauan Riau",
  "tanjung pinang": "Kepulauan Riau",
  "bandar lampung": "Lampung",
  makassar: "Sulawesi Selatan",
  manado: "Sulawesi Utara",
  balikpapan: "Kalimantan Timur",
  samarinda: "Kalimantan Timur",
  pontianak: "Kalimantan Barat",
  banjarmasin: "Kalimantan Selatan",
  mataram: "Nusa Tenggara Barat",
  kupang: "Nusa Tenggara Timur",
  ambon: "Maluku",
  jayapura: "Papua",
};

/**
 * Mencari nama provinsi kanonikal dari teks mentah.
 */
export function resolveCanonicalProvince(rawProvince: string): IndonesianProvince | null {
  const clean = rawProvince.trim().toLowerCase();
  if (!clean) return null;

  // 1. Cek alias langsung
  if (PROVINCE_ALIASES[clean]) {
    return PROVINCE_ALIASES[clean];
  }

  // 2. Cek kecocokan persis di INDONESIAN_PROVINCES (case-insensitive)
  const exact = INDONESIAN_PROVINCES.find((p) => p.toLowerCase() === clean);
  if (exact) return exact;

  // 3. Cek kecocokan parsial
  const partial = INDONESIAN_PROVINCES.find(
    (p) => p.toLowerCase().includes(clean) || clean.includes(p.toLowerCase())
  );
  if (partial) return partial;

  return null;
}

/**
 * Validasi ketat format domisili: "[Kabupaten/Kota/Wilayah], [Provinsi]"
 * Mengharuskan tanda koma, bagian kota >= 2 karakter, dan provinsi yang valid.
 */
export function isValidLocationFormat(location: string | null | undefined): {
  isValid: boolean;
  error?: string;
  kabupaten?: string;
  province?: IndonesianProvince;
} {
  if (!location || !location.trim()) {
    return {
      isValid: false,
      error: "Domisili wajib diisi dengan format: Kabupaten/Kota, Provinsi.",
    };
  }

  const trimmed = location.trim();
  const commaIndex = trimmed.indexOf(",");

  if (commaIndex === -1) {
    return {
      isValid: false,
      error: "Format domisili harus 'Kabupaten/Kota, Provinsi' (pisahkan dengan koma). Contoh: Sleman, D.I. Yogyakarta",
    };
  }

  const kab = trimmed.substring(0, commaIndex).trim();
  const rawProv = trimmed.substring(commaIndex + 1).trim();

  if (!kab || kab.length < 2) {
    return {
      isValid: false,
      error: "Kabupaten/Kota/Wilayah belum diisi dengan benar sebelum tanda koma.",
    };
  }

  if (!rawProv || rawProv.length < 2) {
    return {
      isValid: false,
      error: "Nama Provinsi belum diisi setelah tanda koma (contoh: Sleman, D.I. Yogyakarta).",
    };
  }

  const matchedProv = resolveCanonicalProvince(rawProv);
  if (!matchedProv) {
    return {
      isValid: false,
      error: `Provinsi '${rawProv}' tidak dikenali. Pilih salah satu dari 38 provinsi di Indonesia (contoh: DKI Jakarta, Jawa Barat, Bali).`,
    };
  }

  return {
    isValid: true,
    kabupaten: kab,
    province: matchedProv,
  };
}

/**
 * Normalisasi string lokasi menjadi format rapi "[Kabupaten/Kota], [Provinsi Kanonikal]"
 */
export function normalizeLocation(location: string | null | undefined): string {
  if (!location) return "";
  const validation = isValidLocationFormat(location);
  if (validation.isValid && validation.kabupaten && validation.province) {
    return `${validation.kabupaten}, ${validation.province}`;
  }
  return location.trim();
}

/**
 * Mengekstrak nama Provinsi kanonikal dari string lokasi format "Kabupaten/Kota, Provinsi".
 * Jika tidak berformat koma, memeriksa kamus kota atau nama provinsi langsung.
 * Jika berupa teks acak tak dikenal (seperti "Test" atau "awdaw"), mengembalikan string kosong ("")
 * sehingga TIDAK MENGOTORI filter Provinsi di halaman pencarian.
 */
export function getProvinceFromLocation(location: string | null | undefined): string {
  if (!location) return "";
  const trimmed = location.trim();
  const commaIndex = trimmed.lastIndexOf(",");

  if (commaIndex !== -1) {
    const rawProv = trimmed.substring(commaIndex + 1).trim();
    const resolved = resolveCanonicalProvince(rawProv);
    if (resolved) return resolved;
  }

  // Fallback 1: Cek apakah input tanpa koma adalah nama provinsi langsung (misal "Bali")
  const directProv = resolveCanonicalProvince(trimmed);
  if (directProv) return directProv;

  // Fallback 2: Cek apakah input tanpa koma adalah kota populer yang dikenal (misal "Denpasar" -> "Bali")
  const cityLower = trimmed.toLowerCase();
  if (CITY_TO_PROVINCE_MAP[cityLower]) {
    return CITY_TO_PROVINCE_MAP[cityLower];
  }

  // Jika teks tidak dikenal (misal: "Test", "awdaw"), jangan dijadikan provinsi
  return "";
}

/**
 * Mengekstrak nama Kabupaten/Kota dari string lokasi format "Kabupaten/Kota, Provinsi".
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
 * Mendukung pencocokan kanonikal dan case-insensitive.
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
    return (candidateProv && candidateProv === provLower) || rawLower.includes(provLower);
  });
}

