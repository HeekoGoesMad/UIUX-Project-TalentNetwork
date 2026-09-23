export interface TermSubsection {
  number: string;
  title?: string;
  content: string | string[];
  items?: string[];
  subsections?: TermSubsection[];
  closingContent?: string;
}

export interface TermSection {
  id: string;
  number: string;
  title: string;
  subsections?: TermSubsection[];
  content?: string | string[];
}

export interface LegalTermsDocument {
  title: string;
  subtitle?: string;
  preambleNotice: string;
  preambleAgreement: string;
  sections: TermSection[];
}

export const RECRUITER_TERMS: LegalTermsDocument = {
  title: "KETENTUAN PENGGUNAAN LAYANAN PROOFYLINK TALENT NETWORK",
  subtitle: "Perjanjian Resmi Penggunaan Layanan untuk Rekruter & Perusahaan Klien",
  preambleNotice:
    "Harap membaca Ketentuan Penggunaan ini dengan seksama sebelum mendaftar atau menggunakan Layanan ProofyLink Talent Network.",
  preambleAgreement:
    "Ketentuan Penggunaan ini merupakan perjanjian yang sah dan mengikat secara hukum antara Perusahaan Anda (selanjutnya disebut “Klien” atau “Anda”) dan PT Solusi Anak Sakti (selanjutnya disebut “Djoin” atau “Kami”). Dengan melakukan registrasi akun, membeli Token, atau melakukan interaksi dengan Kandidat melalui ProofyLink Talent Network, Anda setuju untuk tunduk dan mematuhi seluruh persyaratan yang tercantum dalam dokumen ini.",
  sections: [
    {
      id: "definisi",
      number: "1",
      title: "DEFINISI",
      content:
        "Untuk menghindari keraguan penafsiran, istilah-istilah berikut memiliki arti yang spesifik dalam Ketentuan ini:",
      subsections: [
        {
          number: "1.1",
          title: "ProofyLink Talent Network",
          content:
            "Platform ekosistem rekrutmen dan pengembangan karir terpadu milik Djoin yang menghubungkan perusahaan, individu, dan mitra strategis dengan tujuan memfasilitasi pencarian Kandidat serta menyediakan layanan pengecekan riwayat kredit.",
        },
        {
          number: "1.2",
          title: "Djoin",
          content:
            "Merujuk kepada PT Solusi Anak Sakti dengan NPWP 0959721861903000 sebagai penyedia layanan platform ProofyLink Talent Network.",
        },
        {
          number: "1.3",
          title: "Klien",
          content:
            "Badan usaha, perusahaan, atau entitas berbadan hukum yang terdaftar dan terverifikasi pada platform dengan tujuan mencari kandidat dan/atau melakukan verifikasi latar belakang.",
        },
        {
          number: "1.4",
          title: "Kandidat",
          content:
            "Perorangan yang telah mendaftarkan diri secara mandiri di ProofyLink Talent Network dan mempublikasikan profil dengan tujuan mencari peluang karir.",
        },
        {
          number: "1.5",
          title: "Data Pribadi",
          content:
            "Setiap data mengenai Klien yang teridentifikasi atau dapat diidentifikasi secara langsung atau tidak langsung sesuai dengan ketentuan Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (“UU PDP”).",
        },
        {
          number: "1.6",
          title: "Token",
          content:
            "Kode akses digital prabayar yang dibeli oleh Klien yang berfungsi untuk melakukan satu kali permintaan pengecekan riwayat kredit Kandidat.",
        },
        {
          number: "1.7",
          title: "Fitur Berbayar",
          content:
            "Layanan tambahan berbayar di dalam platform yang dapat diakses oleh Klien sesuai kebutuhan dengan menggunakan Token.",
        },
        {
          number: "1.8",
          title: "Fitur Unlock Profile",
          content:
            "Fitur untuk melihat secara penuh detail data pribadi, portfolio, dan riwayat Kandidat.",
        },
        {
          number: "1.9",
          title: "Fitur Pengecekan Riwayat Kredit",
          content:
            "Fitur pemrosesan data untuk menilai riwayat atau rekam jejak finansial Kandidat, yang bersumber dari Lembaga Pengelola Informasi Perkreditan.",
        },
        {
          number: "1.10",
          title: "Lembaga Pengelola Perkreditan Informasi (“LPIP”)",
          content:
            "Lembaga yang menghimpun dan mengolah data kredit serta data lain untuk menghasilkan informasi perkreditan.",
        },
        {
          number: "1.11",
          title: "Laporan Kredit",
          content:
            "Dokumen elektronik hasil pemrosesan data yang terdiri dari data riwayat kredit dari Lembaga Pengelola Informasi Perkreditan (LPIP).",
        },
        {
          number: "1.12",
          title: "Hasil Analisa",
          content:
            "Dokumen elektronik hasil pemrosesan data yang terdiri dari skor atau analisis prediktif yang dihasilkan oleh algoritma Artificial Intelligence (AI) milik Djoin.",
        },
        {
          number: "1.13",
          title: "Persetujuan",
          content:
            "Persetujuan elektronik yang sah ditandatangani oleh Subjek Data, yang memberikan kuasa kepada Klien untuk melakukan pengecekan riwayat kreditnya melalui ProofyLink Talent Network.",
        },
      ],
    },
    {
      id: "registrasi",
      number: "2",
      title: "REGISTRASI DAN VERIFIKASI AKUN",
      subsections: [
        {
          number: "2.1",
          title: "Syarat Legalitas",
          content:
            "Untuk mengaktifkan akun sebagai Klien, Anda wajib mengunggah dokumen legalitas perusahaan yang sah dan masih berlaku, meliputi:",
          items: ["Nomor Induk Berusaha (NIB);", "Nomor Pajak Wajib Pajak (NPWP)."],
        },
        {
          number: "2.2",
          title: "Proses Verifikasi",
          content:
            "Akun Anda hanya dapat digunakan secara optimal setelah tim Kami selesai memverifikasi keabsahan dokumen legalitas tersebut. Kami berhak menolak pendaftaran dan meminta mengunggah ulang jika dokumen dinilai tidak valid, kedaluwarsa atau mencurigakan.",
        },
        {
          number: "2.3",
          title: "Tujuan Penggunaan",
          content:
            "Anda menjamin bahwa akun ini semata-mata digunakan untuk kepentingan rekrutmen yang sah dan pengelolaan sumber daya manusia, bukan untuk tujuan penipuan, pencurian data, atau tindakan ilegal lainnya.",
        },
        {
          number: "2.4",
          title: "Keamanan Akun",
          content:
            "Klien bertanggung jawab penuh menjaga kerahasiaan nama pengguna (username) dan kata sandi (password) akun Anda. Segala aktivitas, pembelian Token, atau pengunduhan data yang dilakukan melalui akun Klien akan dianggap sebagai aktivitas sah yang dilakukan oleh Klien.",
        },
      ],
    },
    {
      id: "mekanisme-layanan",
      number: "3",
      title: "MEKANISME LAYANAN",
      content:
        "Melalui platform ProofyLink Talent Network, Klien dapat memanfaatkan layanan berikut sesuai dengan kebutuhan:",
      subsections: [
        {
          number: "3.1",
          title: "Penggunaan Layanan Dasar",
          content: "Ketentuan penggunaan layanan dasar meliputi:",
          items: [
            "Klien dapat melakukan pencarian, penyaringan, dan melihat ringkasan profil Kandidat secara singkat yang telah dipublikasikan di dalam ProofyLink Talent Network tanpa dikenakan biaya tambahan.",
            "Klien akan mendapatkan token gratis sesuai kebijakan yang berlaku. Token gratis hanya dapat digunakan untuk membuka Fitur Unlock Profile dasar dan tidak mencakup analisis AI yang terdapat dalam Fitur Unlock Profile.",
          ],
        },
        {
          number: "3.2",
          title: "Penggunaan Fitur Berbayar",
          content:
            "Untuk mengakses data lebih lanjut, Klien dapat menggunakan Token yang telah dibayar untuk memotong biaya fitur berikut:",
          subsections: [
            {
              number: "a",
              title: "Fitur Unlock Profile",
              content:
                "Klien menggunakan Token untuk membuka seluruh detail profil Kandidat (pendidikan lengkap, riwayat pekerjaan, detail kontak) guna melakukan penawaran lebih lanjut. Pemotongan Token untuk fitur ini terjadi secara langsung saat Klien mengklik tombol unlock profile.",
            },
            {
              number: "b",
              title: "Fitur Pengecekan Riwayat Kredit",
              content:
                "Klien menggunakan Token untuk mengecek latar belakang finansial Kandidat. Penggunaan fitur ini tunduk pada syarat operasional berikut:",
              items: [
                "Persetujuan Kandidat : Klien wajib mendapatkan persetujuan eksplisit dari Kandidat sebelum mendapatkan Laporan Kredit Kandidat.",
                "Mekanisme Persetujuan : Klien mengetahui bahwa data riwayat kredit adalah Data Pribadi yang bersifat rahasia sehingga Klien menjamin bahwa sebelum melakukan pengecekan, Klien telah mendapatkan persetujuan yang sah dari Kandidat. Sistem Kami akan mengirimkan notifikasi permintaan persetujuan kepada Kandidat.",
                "Pembagian Hasil : Klien memahami bahwa hasil Laporan Kredit hanya dikirimkan kepada Klien dan tidak mengirimkan hasil Laporan Kredit kepada Kandidat. Namun Klien dilarang menghalangi hak Kandidat untuk melihat laporan mereka sendiri.",
                "Token Klien akan dipotong dan proses pengecekan hanya dapat berjalan apabila Kandidat telah memberikan persetujuan kepada Klien.",
                "Kami berhak sewaktu-waktu meminta bukti Formulir Persetujuan tersebut kepada Klien untuk keperluan audit. Kegagalan Klien menunjukan bukti tersebut dapat mengakibatkan penghentian layanan.",
                "Segala tuntutan hukum yang timbul akibat pengecekan yang dilakukan Klien tanpa sepengetahuan atau persetujuan Kandidat sepenuhnya menjadi tanggung jawab Klien.",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "biaya-pembayaran",
      number: "4",
      title: "BIAYA, PEMBAYARAN, DAN KEBIJAKAN PENGEMBALIAN",
      subsections: [
        {
          number: "4.1",
          title: "Pembelian Token",
          content:
            "Kami menyediakan fitur pembelian atau top-up Token yang dapat dilakukan secara mandiri oleh Klien. Klien dapat memilih Token sesuai kebutuhan dan menyelesaikan pesanan langsung dalam platform ProofyLink Talent Network. Setiap pembelian yang dikonfirmasi melalui akun Klien dianggap sebagai pesanan yang sah dan mengikat.",
        },
        {
          number: "4.2",
          title: "Kewajiban Pembayaran",
          content:
            "Biaya hanya akan dikenakan apabila Klien membeli Token untuk menggunakan Fitur Berbayar. Biaya sesuai dengan yang tertera pada halaman checkout di platform serta biaya wajib dibayar lunas di muka (pre-paid).",
        },
        {
          number: "4.3",
          title: "Kebijakan Pengembalian Dana (No Refund)",
          content:
            "Seluruh pembayaran untuk pembelian Token bersifat final, Kami TIDAK melayani pengembalian dana (refund) untuk kondisi berikut:",
          items: [
            "Sisa Token yang tidak terpakai hingga masa aktif berakhir;",
            "Kandidat menolak memberikan persetujuan atas permintaan penggunaan Fitur Pengecekan Riwayat Kredit;",
            "Kesalahan Klien dalam memilih jumlah/paket Token;",
            "Penghentian sepihak penggunaan ProofyLink Talent Network oleh Klien sebelum Token habis.",
          ],
        },
        {
          number: "4.4",
          title: "Perubahan Harga",
          content:
            "Kami berhak untuk mengubah harga layanan sewaktu-waktu dengan menampilkan harga terbaru pada platform. Perubahan harga tidak berlaku surut untuk transaksi yang telah diselesaikan sebelum perubahan tersebut berlaku.",
        },
      ],
    },
    {
      id: "perlindungan-data",
      number: "5",
      title: "PERLINDUNGAN DATA, KERAHASIAAN DAN LARANGAN",
      subsections: [
        {
          number: "5.1",
          title: "Status Pengendali Data",
          content:
            "Setelah Laporan Kredit diterima oleh Klien, Klien bertindak sebagai Pengendali Data atas data tersebut dan wajib tunduk pada Undang-Undang Nomor 27 Tahun 2022 Tentang Perlindungan Data Pribadi.",
        },
        {
          number: "5.2",
          title: "Kerahasiaan Mutlak",
          content:
            "Klien wajib menjaga kerahasiaan Laporan Kredit dengan standar keamanan tertinggi. Data hanya boleh diakses oleh pihak internal Klien yang memiliki kewenangan langsung dalam proses rekrutmen.",
        },
        {
          number: "5.3",
          title: "Larangan Keras",
          content: "Klien DILARANG KERAS untuk:",
          items: [
            "Menjual, menyewakan, melisensikan kembali, atau mengomersialisasikan data Laporan Kredit kepada pihak ketiga manapun;",
            "Mempublikasikan skor atau riwayat kredit Kandidat di media sosial atau platform publik;",
            "Menggunakan data untuk tujuan diskriminasi SARA atau tindakan yang melanggar hak asasi manusia;",
            "Melakukan pengecekan riwayat kredit pada Fitur Pengecekan Riwayat Kredit tanpa memiliki persetujuan yang sah dari Kandidat;",
            "Memalsukan, memaksa atau memanipulasi persetujuan Kandidat dalam penggunaan Fitur Pengecekan Riwayat Kredit.",
          ],
        },
      ],
    },
    {
      id: "penyangkalan-jaminan",
      number: "6",
      title: "PENYANGKALAN JAMINAN",
      subsections: [
        {
          number: "6.1",
          title: "Alat Bantu Pendukung Keputusan AI",
          content:
            "Klien memahami bahwa skor dan analisis yang dihasilkan oleh ProofyLink merupakan hasil perhitungan statistik dan prediktif AI. Hasil ini bukanlah jaminan mutlak atas perilaku finansial seseorang dimasa depan, melainkan alat bantu pendukung keputusan (decision support tool).",
        },
        {
          number: "6.2",
          title: "Tanggung Jawab Keputusan Rekrutmen",
          content:
            "Keputusan untuk menerima, melanjutkan proses, atau menolak Kandidat sepenuhnya berada di tangan dan merupakan tanggung jawab Klien. Kami tidak memberikan jaminan bahwa Kandidat tertentu akan lolos evaluasi internal perusahaan Klien, maupun menjamin Kandidat pasti akan merespons tawaran Klien.",
        },
        {
          number: "6.3",
          title: "Keabsahan Data LPIP",
          content:
            "Data riwayat kredit bersumber dari Lembaga Pengelola Informasi Perkreditan (LPIP). Kami tidak bertanggung jawab atas keakuratan, kelengkapan, atau pembaruan data yang disediakan oleh LPIP. Jika data di LPIP salah, perbaikan harus dilakukan melalui mekanisme LPIP bukan melalui ProofyLink Talent Network.",
        },
        {
          number: "6.4",
          title: "Sifat Data Profil Kandidat",
          content:
            "Data yang tersedia pada Fitur Unlock Profile disajikan berdasarkan apa yang diunggah oleh Kandidat, Kami menyajikan data sebagaimana adanya dan tidak bertanggung jawab atas ketidakakuratan, kelengkapan, atau pembaruan data dari Kandidat.",
        },
        {
          number: "6.5",
          title: "Pemulihan Gangguan Teknis Internal",
          content:
            "Kami berupaya menjaga layanan tetap aktif. Dalam hal terjadi gangguan teknis yang bersumber dari sistem internal Kami, Kami bertanggung jawab untuk melakukan perbaikan sesegera mungkin untuk memulihkan layanan.",
        },
        {
          number: "6.6",
          title: "Asumsi Itikad Baik Persetujuan Data Pribadi",
          content:
            "Kami menyediakan Fitur Pengecekan Riwayat Kredit dengan asumsi itikad baik bahwa Klien telah mematuhi persetujuan data pribadi. Kami tidak bertanggung jawab atas segala kerugian, gugatan privasi, atau sengketa hukum yang muncul akibat tindakan Klien yang melakukan pengecekan data seseorang melalui Fitur Pengecekan Riwayat Kredit tanpa izin dan/atau persetujuan yang sah.",
        },
      ],
    },
    {
      id: "hki",
      number: "7",
      title: "HAK KEKAYAAN INTELEKTUAL",
      subsections: [
        {
          number: "7.1",
          title: "Kepemilikan Aset",
          content:
            "Seluruh hak cipta termasuk namun tidak terbatas pada merek dagang, kode sumber, algoritma AI, desain antarmuka, dan konten pada layanan ProofyLink Talent Network adalah aset milik Kami.",
        },
        {
          number: "7.2",
          title: "Lisensi Terbatas Penggunaan",
          content:
            "Klien hanya diberikan lisensi terbatas, non eksklusif dan apabila Klien melakukan pelanggaran akses untuk menggunakan layanan dapat ditarik kembali selama masa berlangganan. Klien dilarang menyalin, memodifikasi, membongkar, atau membuat produk yang meniru.",
        },
      ],
    },
    {
      id: "ganti-rugi",
      number: "8",
      title: "GANTI RUGI (INDEMNIFICATION)",
      subsections: [
        {
          number: "8.1",
          title: "Pembebasan Klaim dan Kerugian",
          content:
            "Anda setuju untuk mengganti rugi, membebaskan, dan melepaskan Kami dari segala bentuk klaim, tuntutan, gugatan, kerugian, kewajiban, kerusakan, dan biaya yang timbul akibat atau terkait dengan:",
          items: [
            "Pelanggaran Ketentuan: Pelanggaran yang Anda lakukan terhadap Syarat dan Ketentuan ini.",
            "Penyalahgunaan Layanan: Penggunaan platform yang tidak semestinya, ilegal, atau melanggar hukum oleh Anda (misal: pemalsuan identitas);",
            "Pelanggaran Hak Pihak Lain: Pelanggaran Anda terhadap hak pihak lain manapun, termasuk namun tidak terbatas pada hak privasi, hak cipta, atau hak milik orang lain (misal: scraping data kandidat lain, Perusahaan, atau Partner Djoin); dan/atau",
            "Kelalaian Keamanan: Kebocoran akses yang disebabkan oleh kelalaian Anda dalam menjaga keamanan perangkat seluler, kerahasiaan OTP, PIN, atau akses biometrik akun Anda.",
          ],
        },
        {
          number: "8.2",
          title: "Mekanisme Penyelesaian",
          content:
            "Dalam hal terjadi tuntutan sebagaimana dimaksud dalam pasal ini, Kami berhak untuk mengontrol pertahanan dan penyelesaian hukum atas klaim tersebut, dan Anda diwajibkan untuk bekerja sama sepenuhnya dengan Kami dalam mempertahankan hak-hak tersebut serta menanggung seluruh biaya yang timbul.",
        },
      ],
    },
    {
      id: "pengakhiran",
      number: "9",
      title: "MASA BERLAKU DAN PENGAKHIRAN",
      subsections: [
        {
          number: "9.1",
          title: "Masa Berlaku",
          content:
            "Syarat dan Ketentuan ini mulai berlaku dan mengikat secara hukum sejak tanggal Anda mendaftarkan akun atau menggunakan layanan ProofyLink Talent Network, dan akan terus berlaku selama akun Anda masih aktif atau sampai diakhiri oleh salah satu pihak sesuai dengan ketentuan pasal ini.",
        },
        {
          number: "9.2",
          title: "Masa Berlaku Token",
          content:
            "Setiap paket Token memiliki masa aktif yang spesifik sesuai paket yang dibeli Klien. Token yang tidak digunakan setelah masa aktif berakhir akan hangus secara otomatis.",
        },
        {
          number: "9.3",
          title: "Pengakhiran oleh Anda (Hapus Akun)",
          content:
            "Anda berhak untuk mengakhiri penggunaan layanan dalam platform sewaktu-waktu dengan cara mengajukan permohonan penghapusan akun melalui fitur “Hapus Akun” yang tersedia di menu Pengaturan platform atau menghubungi layanan pelanggan kami.",
        },
        {
          number: "9.4",
          title: "Pengakhiran oleh Kami (Suspensi/Blokir)",
          content:
            "Kami berhak untuk membekukan, menangguhkan (suspend), atau mengakhiri akun Anda secara sepihak dan seketika tanpa pemberitahuan sebelumnya apabila:",
          items: [
            "Anda melanggar salah satu poin dalam Syarat dan Ketentuan ini atau peraturan perundang-undangan yang berlaku;",
            "Terdeteksi adanya aktivitas mencurigakan, penipuan (fraud), pemalsuan identitas, atau penyalahgunaan akun untuk aktivitas ilegal;",
            "Anda mencemarkan nama baik atau reputasi Kami;",
            "Adanya perintah dari kepolisian, pengadilan, atau otoritas yang berwenang; atau",
            "Akun Anda tidak aktif dalam jangka waktu yang lama sesuai kebijakan retensi data Kami.",
          ],
        },
        {
          number: "9.5",
          title: "Efek Pengakhiran",
          content: "Dalam hal terjadi pengakhiran akun (baik oleh Anda maupun oleh Kami):",
          items: [
            "Seluruh hak penggunaan platform yang diberikan kepada Anda otomatis berakhir;",
            "Kami tidak berkewajiban untuk mengembalikan dana (refund) atas sisa langganan yang masih tersisa di akun Anda pada saat pengakhiran terjadi, terutama jika pengakhiran disebabkan oleh pelanggaran yang Anda lakukan.",
          ],
        },
      ],
    },
    {
      id: "hukum-sengketa",
      number: "10",
      title: "HUKUM YANG BERLAKU DAN PENYELESAIAN SENGKETA",
      subsections: [
        {
          number: "10.1",
          title: "Hukum",
          content:
            "Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.",
        },
        {
          number: "10.2",
          title: "Musyawarah",
          content:
            "Segala perselisihan yang timbul akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender.",
        },
        {
          number: "10.3",
          title: "Domisili Hukum",
          content:
            "Apabila musyawarah tidak tercapai, perselisihan akan diselesaikan melalui Pengadilan Negeri Kota Denpasar.",
        },
      ],
    },
  ],
};

export const CANDIDATE_TERMS: LegalTermsDocument = {
  title: "KETENTUAN PENGGUNAAN LAYANAN PROOFYLINK TALENT NETWORK",
  subtitle: "Perjanjian Resmi Penggunaan Layanan untuk Kandidat & Pencari Kerja",
  preambleNotice:
    "Harap membaca Ketentuan Penggunaan ini dengan saksama sebelum mendaftar atau menggunakan Layanan ProofyLink Talent Network.",
  preambleAgreement:
    'Ketentuan Penggunaan ini merupakan perjanjian yang sah dan mengikat secara hukum antara Klien (selanjutnya disebut "Klien" atau "Anda") dan PT Solusi Anak Sakti (selanjutnya disebut "Kami" atau "Djoin”). Dengan melakukan registrasi akun, membeli fitur-fitur berbayar, atau mengakses website ProofyLink Talent Network, Anda setuju untuk tunduk dan mematuhi seluruh persyaratan yang tercantum dalam ketentuan penggunaan ini.',
  sections: [
    {
      id: "definisi",
      number: "1",
      title: "DEFINISI",
      subsections: [
        {
          number: "1.1",
          title: "ProofyLink Talent Network",
          content:
            "Platform ekosistem rekrutmen dan pengembangan karir terpadu milik Djoin yang menghubungkan perusahaan, individu, dan mitra strategis dengan tujuan memfasilitasi pencarian kandidat serta menyediakan layanan pengecekan riwayat kredit.",
        },
        {
          number: "1.2",
          title: "Djoin",
          content:
            "Merujuk kepada PT Solusi Anak Sakti dengan NPWP 0959721861903000 sebagai penyedia layanan platform ProofyLink Talent Network.",
        },
        {
          number: "1.3",
          title: "Klien",
          content:
            "Individu yang mendaftarkan akun dan membeli layanan ProofyLink Talent Network untuk keperluan pencarian kerja.",
        },
        {
          number: "1.4",
          title: "Rekruter",
          content:
            "Individu yang bertindak untuk dan atas nama perusahaan dengan tanggung jawab atau wewenang untuk melakukan kegiatan pencarian, penyeleksian, dan/atau perekrutan calon tenaga kerja melalui ProofyLink Talent Network.",
        },
        {
          number: "1.5",
          title: "Perusahaan",
          content:
            "Badan usaha, perusahaan, atau entitas berbadan hukum yang terdaftar dan terverifikasi pada platform dengan tujuan mencari kandidat dan/atau melakukan verifikasi latar belakang.",
        },
        {
          number: "1.6",
          title: "Partner Djoin",
          content:
            "Setiap perguruan tinggi, baik negeri maupun swasta, dan/atau lembaga kursus dan pelatihan yang telah memiliki perjanjian kerja sama dengan Djoin dalam hal mendukung proses verifikasi profil Klien melalui platform ProofyLink Talent Network.",
        },
        {
          number: "1.7",
          title: "Data Pribadi",
          content:
            "Setiap data mengenai Klien yang teridentifikasi atau dapat diidentifikasi secara langsung atau tidak langsung sesuai dengan ketentuan Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (“UU PDP”).",
        },
        {
          number: "1.8",
          title: "Fitur Berbayar",
          content:
            "Fitur-fitur yang tersedia di dalam platform ProofyLink Talent Network yang dapat diakses oleh Klien melalui pembelian Token.",
        },
        {
          number: "1.9",
          title: "Token",
          content:
            "Kode akses digital prabayar yang dibeli oleh Klien yang berfungsi untuk melakukan satu kali permintaan pengecekan riwayat kredit Kandidat.",
        },
      ],
    },
    {
      id: "registrasi",
      number: "2",
      title: "REGISTRASI AKUN DAN VERIFIKASI",
      subsections: [
        {
          number: "2.1",
          title: "Kelayakan Klien",
          content:
            "Anda menyatakan dan menjamin bahwa Anda adalah orang-perorangan atau individu yang memiliki keabsahan dan kecakapan hukum penuh berdasarkan peraturan perundang-undangan yang berlaku untuk mengikatkan diri dengan syarat dan ketentuan ini.",
        },
        {
          number: "2.2",
          title: "Pembuatan Akun dan Keakuratan Data",
          content:
            "Anda wajib membuat akun dan memberikan data secara lengkap, benar, dan akurat, termasuk namun tidak terbatas pada:",
          items: [
            "a. Nama lengkap sesuai KTP;",
            "b. Nomor Induk Kependudukan (NIK);",
            "c. Tempat dan tanggal lahir;",
            "d. Jenis kelamin;",
            "e. Alamat email yang valid dan aktif;",
            "f. Nomor telepon/ponsel yang aktif;",
            "g. Foto Kartu Tanpa Penduduk (KTP) yang jelas dan tidak kadaluwarsa;",
            "h. Foto selfie untuk verifikasi liveness; dan",
            "i. Dokumen pendukung lainnya yang mungkin diperlukan.",
          ],
          closingContent:
            "Setiap kesalahan, ketidakakuratan, atau kelalaian dalam memberikan data menjadi tanggung jawab Klien sepenuhnya.",
        },
        {
          number: "2.3",
          title: "Pernyataan Tujuan Penggunaan",
          content:
            "Anda menjamin bahwa akun ini hanya digunakan untuk keperluan proses pencarian kerja. Profil dan informasi yang Anda berikan melalui akun ini hanya akan digunakan dan dibagikan kepada Rekruter atau calon pemberi kerja untuk keperluan proses rekrutmen.",
        },
        {
          number: "2.4",
          title: "Keamanan Kredensial",
          content:
            "Anda bertanggung jawab penuh untuk menjaga kerahasiaan nama pengguna (username), kata sandi (password), dan OTP yang digunakan untuk mengakses platform Proofylink Talent Network. Segala aktivitas yang dilakukan melalui akun Anda akan dianggap sebagai aktivitas yang sah dan menjadi tanggung jawab Anda.",
        },
        {
          number: "2.5",
          title: "Verifikasi Status Klien",
          content:
            "Anda secara sadar mengetahui dan menyetujui bahwa penggunaan layanan ProofyLink Talent Network memberikan akses kepada Partner Djoin untuk melakukan verifikasi status alumni dan/atau keanggotaan Anda dalam universitas dan/atau lembaga pendidikan dan pelatihan berdasarkan informasi dan/atau dokumen yang Anda cantumkan saat proses pendaftaran akun.",
        },
        {
          number: "2.6",
          title: "Kegagalan Verifikasi Identitas",
          content:
            "Apabila status Anda gagal terverifikasi dalam proses verifikasi oleh Partner Djoin karena adanya ketidaksesuaian, ketidakakuratan, dan/atau ketidakabsahan informasi dan/atau dokumen, maka Anda dapat mengajukan permohonan verifikasi ulang sesuai prosedur yang ditetapkan dalam platform.",
        },
        {
          number: "2.7",
          title: "Penolakan atau Penangguhan Akun",
          content:
            "Apabila ditemukan ketidaksesuaian, ketidakakuratan, ketidakabsahan informasi dan/atau dokumen yang diberikan oleh Anda, atau terdapat dugaan atau indikasi pelanggaran hukum, maka Kami berhak untuk menolak pendaftaran dan/atau menangguhkan akun Anda.",
        },
      ],
    },
    {
      id: "mekanisme-layanan",
      number: "3",
      title: "MEKANISME LAYANAN",
      subsections: [
        {
          number: "3.1",
          title: "Ketentuan Penggunaan Platform",
          content:
            "Layanan ProofyLink Talent Network dapat digunakan melalui metode akses secara langsung di dalam platform untuk kepentingan pribadi Klien. Klien tidak memerlukan perantara dengan perusahaan manapun untuk menggunakan layanan ini.",
        },
        {
          number: "3.2",
          title: "Penggunaan Fitur Tidak Berbayar",
          content:
            "Anda dapat melakukan pendaftaran akun serta mengedit profil tanpa dikenakan biaya.",
        },
        {
          number: "3.3",
          title: "Penggunaan Fitur Berbayar",
          content:
            "Anda dapat mengakses fitur-fitur berbayar dalam platform ProofyLink Talent Network setelah melakukan pembelian Token melalui skema pembayaran dan biaya yang telah ditentukan dalam platform, yang meliputi:",
          subsections: [
            {
              number: "a",
              title: "Fitur Pembuatan CV",
              content:
                "Klien dapat membeli Token untuk mengakses fitur pembuatan CV yang memungkinkan Klien untuk membuat dan mengunduh CV dengan menggunakan informasi yang diberikan atau dicantumkan oleh Klien melalui platform Proofylink Talent Network. Informasi tersebut dapat diberikan dengan cara mengunggah file yang memuat informasi mengenai data diri dasar, pengalaman, pendidikan, dan keahlian, melengkapi formulir profil yang tersedia di dalam platform secara manual, dan/atau menggunakan informasi, profil, dan pengalaman yang telah Klien cantumkan pada saat proses pendaftaran dan/atau melalui akun Klien.",
            },
            {
              number: "b",
              title: "Fitur Career Advisor",
              content:
                "Klien dapat melakukan pembelian Token untuk mengakses fitur rekomendasi karir yang menyediakan analisis profil dan rekomendasi karir berbasis teknologi Artificial Intelligence (AI).",
            },
          ],
        },
      ],
    },
    {
      id: "biaya-pembayaran",
      number: "4",
      title: "BIAYA, PEMBAYARAN, DAN PENGEMBALIAN",
      subsections: [
        {
          number: "4.1",
          title: "Pembelian Token",
          content:
            "Kami menyediakan fitur pembelian atau top-up Token yang dapat dilakukan secara mandiri oleh Klien. Klien dapat memilih Token sesuai kebutuhan dan menyelesaikan pesanan langsung dalam platform ProofyLink Talent Network. Setiap pembelian yang dikonfirmasi melalui akun Klien dianggap sebagai pesanan yang sah dan mengikat.",
        },
        {
          number: "4.2",
          title: "Ketentuan Pembayaran",
          content:
            "Apabila Anda melakukan pembelian atau top-up Token melalui pembayaran dalam platform, berlaku ketentuan-ketentuan sebagai berikut:",
          subsections: [
            {
              number: "a",
              title: "Privasi Penuh",
              content:
                "Informasi terkait nomor kartu kredit dan/atau debit, Virtual Account, nomor handphone yang digunakan sebagai nomor e-wallet, maupun informasi-informasi lainnya yang berkaitan dengan proses pembayaran adalah bersifat rahasia dan hanya dapat dilihat oleh Anda melalui perangkat Anda. Kami tidak membagikan hasil tersebut kepada pihak manapun kecuali diwajibkan oleh hukum.",
            },
            {
              number: "b",
              title: "Tujuan Penggunaan",
              content:
                "Segala informasi yang disebutkan sebelumnya mutlak hanya ditujukan sebagai pendukung dalam proses pembayaran fitur-fitur berbayar yang Anda kehendaki.",
            },
            {
              number: "c",
              title: "Persetujuan",
              content:
                "Anda dapat memberikan persetujuan terkait ketentuan biaya dan skema pembayaran untuk memproses pembayaran dengan mengklik kotak centang (checkbox) atau tombol konfirmasi pada saat proses pembayaran.",
            },
            {
              number: "d",
              title: "Metode Pembayaran",
              content:
                "Seluruh pembayaran atas pembelian atau top-up Token dilakukan melalui pembayaran resmi yang tersedia di dalam platform ProofyLink Talent Network. Biaya Token yang digunakan untuk mengakses fitur-fitur berbayar sesuai dengan yang tertera pada halaman checkout di platform serta wajib dibayarkan lunas di muka (pre-paid).",
            },
          ],
        },
        {
          number: "4.3",
          title: "Kebijakan No Refund Policy",
          content:
            "Kami tidak melayani permintaan pengembalian dana (refund) atau pembatalan transaksi yang diajukan atas alasan tertentu, termasuk namun tidak terbatas pada:",
          items: [
            "a. Pengguna berubah pikiran setelah pembayaran berhasil dikonfirmasi;",
            "b. Pengguna merasa tidak puas dengan hasil CV serta analisis dan rekomendasi karir yang diberikan oleh platform;",
            "c. Kegagalan teknis yang disebabkan oleh perangkat atau koneksi internet Klien; dan",
            "d. Kesalahan Klien dalam memasukkan data saat melengkapi proses pembayaran.",
          ],
        },
        {
          number: "4.4",
          title: "Perubahan Harga",
          content:
            "Kami berhak untuk mengubah harga Token untuk akses layanan sewaktu-waktu dengan menampilkan harga terbaru pada platform. Perubahan harga tidak berlaku surut untuk transaksi yang telah diselesaikan sebelum perubahan tersebut berlaku.",
        },
      ],
    },
    {
      id: "perlindungan-data",
      number: "5",
      title: "PERLINDUNGAN DATA, KERAHASIAAN, DAN LARANGAN",
      subsections: [
        {
          number: "5.1",
          title: "Komitmen Perlindungan Data",
          content:
            "Kami berkomitmen untuk melindungi data pribadi Anda sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi. Kami hanya mengumpulkan, memproses, dan membagikan data Anda sesuai dengan Kebijakan Privasi (Privacy Policy) yang merupakan bagian tak terpisahkan dari Ketentuan ini.",
        },
        {
          number: "5.2",
          title: "Keamanan Akun dan Perangkat",
          content:
            "Anda bertanggung jawab penuh untuk menjaga keamanan perangkat seluler dan kerahasiaan kredensial akun (termasuk OTP, PIN, atau akses Biometrik). Segala aktivitas pengeditan profil atau pembelian fitur-fitur berbayar yang terjadi melalui akun Anda dianggap sebagai tindakan sah yang dilakukan oleh Anda sendiri. Kami tidak bertanggung jawab atas kebocoran data yang disebabkan oleh kelalaian Anda (seperti meminjamkan HP kepada orang lain atau menjadi korban phishing).",
        },
        {
          number: "5.3",
          title: "Larangan Keras (Prohibited Acts)",
          content:
            "Dalam menggunakan platform ProofyLink Talent Network, Anda DILARANG KERAS untuk:",
          items: [
            "a. Pemalsuan Informasi: Anda dilarang untuk memberikan, mengunggah, dan/atau menggunakan informasi yang palsu, tidak benar, tidak akurat, menyesatkan, dan/atau tidak sesuai dengan keadaan yang sebenarnya terkait dengan identitas dan profil diri Anda, termasuk namun tidak terbatas pada nama, NIK, alamat, usia, status alumni dan/atau keanggotaan, dan segala informasi lainnya yang berkaitan dengan profil diri Anda.",
            "b. Larangan Tindakan Scraping Data: Anda dilarang untuk menggunakan program atau bot tertentu untuk mengakses, mengambil, menyalin, mengumpulkan, mengekstrak, dan/atau mengunduh data kandidat lain, Partner Djoin, perusahaan, maupun data-data lainnya yang berada di dalam platform ProofyLink Talent Network.",
            "c. Manipulasi Sistem: Anda dilarang melakukan upaya peretasan atau modifikasi platform untuk mengelabui sistem keamanan Kami.",
          ],
        },
        {
          number: "5.4",
          title: "Sanksi Pelanggaran",
          content:
            "Kami berhak untuk melakukan pemantauan sistem secara aktif. Apabila ditemukan indikasi pelanggaran terhadap pasal ini, Kami berhak untuk:",
          items: [
            "a. Memblokir akun Anda secara permanen tanpa peringatan;",
            "b. Menghapus seluruh riwayat data pada akun Anda;",
            "c. Tidak mengembalikan dana yang telah digunakan untuk pembelian fitur-fitur premium; dan",
            "d. Melaporkan tindakan pemalsuan identitas, scraping data, dan manipulasi sistem, sebagaimana yang diuraikan sebelumnya, kepada pihak berwajib sesuai hukum yang berlaku.",
          ],
        },
      ],
    },
    {
      id: "penyangkalan-jaminan",
      number: "6",
      title: "PENYANGKALAN JAMINAN (DISCLAIMER)",
      subsections: [
        {
          number: "6.1",
          title: "Hasil Analisis AI & Rekomendasi",
          content:
            "Anda memahami dan menyetujui bahwa hasil yang diberikan melalui fitur pembuatan CV dan Career Advisor pada platform ProofyLink Talent Network merupakan hasil analisis informasi dalam profil Anda yang bersifat prediktif dan berbasis AI. Hasil tersebut bersifat informatif dan/atau prediktif serta disajikan semata-mata sebagai referensi, serta BUKAN merupakan:",
          items: [
            "a. Nasihat karir profesional;",
            "b. Jaminan mutlak atas kesesuaian hasil analisis dan/atau rekomendasi dengan minat, kemampuan, kondisi, atau rencana karir Anda; atau",
            "c. Penentu tunggal dalam membuat keputusan berkaitan dengan rencana karir Anda.",
          ],
        },
        {
          number: "6.2",
          title: "Verifikasi Data Alumni Partner Djoin",
          content:
            "Verifikasi data terkait status alumni Anda dilakukan berdasarkan data yang bersumber dari Partner Djoin. Anda memahami bahwa Kami tidak bertanggung jawab atas keakuratan, kelengkapan, dan/atau pembaruan data yang disediakan oleh Partner Djoin. Apabila terdapat kesalahan, ketidakakuratan, atau ketidaklengkapan data tersebut, perbaikan harus dilakukan melalui mekanisme Partner Djoin, bukan melalui ProofyLink Talent Network.",
        },
        {
          number: "6.3",
          title: "Peran Pendukung Career Advisor",
          content:
            "Fitur Career Advisor hanya bertindak sebagai platform pendukung untuk membantu Anda dalam melakukan perencanaan karir dan persiapan proses seleksi kerja.",
        },
        {
          number: "6.4",
          title: "Pemulihan Gangguan Teknis Internal",
          content:
            "Kami berupaya menjaga layanan tetap aktif. Dalam hal terjadi gangguan teknis yang bersumber dari internal Kami, Kami bertanggung jawab untuk melakukan perbaikan sesegera mungkin untuk memulihkan layanan.",
        },
      ],
    },
    {
      id: "ganti-rugi",
      number: "7",
      title: "GANTI RUGI (INDEMNIFICATION)",
      subsections: [
        {
          number: "7.1",
          title: "Pembebasan Tanggung Jawab",
          content:
            "Anda setuju untuk mengganti rugi, membebaskan, dan melepaskan Kami dari segala bentuk klaim, tuntutan, gugatan, kerugian, kewajiban, kerusakan, dan biaya yang timbul akibat atau terkait dengan:",
          items: [
            "a. Pelanggaran Ketentuan: Pelanggaran yang Anda lakukan terhadap Syarat dan Ketentuan ini.",
            "b. Penyalahgunaan Layanan: Penggunaan platform yang tidak semestinya, ilegal, atau melanggar hukum oleh Anda (misal: pemalsuan identitas);",
            "c. Pelanggaran Hak Pihak Lain: Pelanggaran Anda terhadap hak pihak lain manapun, termasuk namun tidak terbatas pada hak privasi, hak cipta, atau hak milik orang lain (misal: scraping data kandidat lain, Perusahaan, atau Partner Djoin); dan/atau",
            "d. Kelalaian Keamanan: Kebocoran akses yang disebabkan oleh kelalaian Anda dalam menjaga keamanan perangkat seluler, kerahasiaan OTP, PIN, atau akses biometrik akun Anda.",
          ],
        },
        {
          number: "7.2",
          title: "Mekanisme Penyelesaian",
          content:
            "Dalam hal terjadi tuntutan sebagaimana dimaksud dalam pasal ini, Kami berhak untuk mengontrol pertahanan dan penyelesaian hukum atas klaim tersebut, dan Anda diwajibkan untuk bekerja sama sepenuhnya dengan Kami dalam mempertahankan hak-hak tersebut serta menanggung seluruh biaya yang timbul.",
        },
      ],
    },
    {
      id: "pengakhiran",
      number: "8",
      title: "MASA BERLAKU DAN PENGAKHIRAN",
      subsections: [
        {
          number: "8.1",
          title: "Masa Berlaku",
          content:
            "Syarat dan Ketentuan ini mulai berlaku dan mengikat secara hukum sejak tanggal Anda mendaftarkan akun atau menggunakan layanan ProofyLink Talent Network, dan akan terus berlaku selama akun Anda masih aktif atau sampai diakhiri oleh salah satu pihak sesuai dengan ketentuan pasal ini.",
        },
        {
          number: "8.2",
          title: "Pengakhiran oleh Anda (Hapus Akun)",
          content:
            "Anda berhak untuk mengakhiri penggunaan layanan dalam platform sewaktu-waktu dengan cara mengajukan permohonan penghapusan akun melalui fitur “Hapus Akun” yang tersedia di menu Pengaturan platform atau menghubungi layanan pelanggan kami.",
        },
        {
          number: "8.3",
          title: "Pengakhiran oleh Kami (Suspensi/Blokir)",
          content:
            "Kami berhak untuk membekukan, menangguhkan (suspend), atau mengakhiri akun Anda secara sepihak dan seketika tanpa pemberitahuan sebelumnya apabila:",
          items: [
            "a. Anda melanggar salah satu poin dalam Syarat dan Ketentuan ini atau peraturan perundang-undangan yang berlaku;",
            "b. Terdeteksi adanya aktivitas mencurigakan, penipuan (fraud), pemalsuan identitas, atau penyalahgunaan akun untuk aktivitas ilegal;",
            "c. Anda mencemarkan nama baik atau reputasi Kami;",
            "d. Adanya perintah dari kepolisian, pengadilan, atau otoritas yang berwenang; atau",
            "e. Akun Anda tidak aktif dalam jangka waktu yang lama sesuai kebijakan retensi data Kami.",
          ],
        },
        {
          number: "8.4",
          title: "Efek Pengakhiran",
          content:
            "Dalam hal terjadi pengakhiran akun (baik oleh Anda maupun oleh Kami):",
          items: [
            "a. Seluruh hak penggunaan platform yang diberikan kepada Anda otomatis berakhir;",
            "b. Kami tidak berkewajiban untuk mengembalikan dana (refund) atas sisa langganan yang masih tersisa di akun Anda pada saat pengakhiran terjadi, terutama jika pengakhiran disebabkan oleh pelanggaran yang Anda lakukan.",
          ],
        },
      ],
    },
    {
      id: "hukum-sengketa",
      number: "9",
      title: "HUKUM YANG BERLAKU DAN PENYELESAIAN SENGKETA",
      subsections: [
        {
          number: "9.1",
          title: "Hukum",
          content:
            "Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.",
        },
        {
          number: "9.2",
          title: "Musyawarah",
          content:
            "Segala perselisihan yang timbul akan diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender.",
        },
        {
          number: "9.3",
          title: "Domisili Hukum",
          content:
            "Apabila musyawarah tidak tercapai, perselisihan akan diselesaikan melalui Pengadilan Negeri Kota Denpasar.",
        },
      ],
    },
  ],
};
