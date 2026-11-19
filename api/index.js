// serverApp.ts
import crypto from "crypto";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

// src/data/pkkmMeta.ts
var COMPONENTS_META = [
  {
    id: 1,
    code: "K1",
    title: "Usaha Pengembangan Madrasah",
    shortTitle: "Pengembangan Madrasah",
    category: "Penilaian Tahunan & 4 Tahunan",
    totalIndicators: 25,
    maxScore: 100,
    description: "Struktur organisasi, personalia, pedoman kerja, inovasi pembelajaran, kemitraan, pemenuhan 8 SNP, unit layanan khusus, dan sistem informasi TIK."
  },
  {
    id: 2,
    code: "K2",
    title: "Pelaksanaan Tugas Manajerial",
    shortTitle: "Tugas Manajerial",
    category: "Penilaian Tahunan & 4 Tahunan",
    totalIndicators: 41,
    maxScore: 164,
    description: "Perencanaan RKJM/RKT/e-RKAM, visi-misi, budaya belajar & prestasi, pendayagunaan SDM, sarpras, kesiswaan, kurikulum, keuangan, ketatausahaan, dan monev."
  },
  {
    id: 3,
    code: "K3",
    title: "Pengembangan Kewirausahaan",
    shortTitle: "Kewirausahaan",
    category: "Penilaian Tahunan & 4 Tahunan",
    totalIndicators: 12,
    maxScore: 48,
    description: "Inovasi madrasah, budaya berpikir kreatif, pemberdayaan potensi produktif, penumbuhan jiwa kewirausahaan, bank ide, dan pemecahan masalah kelembagaan."
  },
  {
    id: 4,
    code: "K4",
    title: "Supervisi Kepada Guru dan Tenaga Kependidikan",
    shortTitle: "Supervisi Guru & Tendik",
    category: "Penilaian Tahunan & 4 Tahunan",
    totalIndicators: 11,
    maxScore: 44,
    description: "Penyusunan program supervisi akademik, pengembangan instrumen, pra-observasi, pemantauan pembelajaran, refleksi pasca-observasi, dan tindak lanjut PKB."
  }
];
var PIC_USERS = [
  {
    id: "ahmad-syaikhu",
    name: "Ahmad Syaikhu",
    role: "Kepala Madrasah",
    initials: "AS",
    isAdmin: true
  },
  {
    id: "tata-usaha",
    name: "Tata Usaha / Administrator",
    role: "Tata Usaha Madrasah (TUM)",
    initials: "TU",
    isAdmin: true
  },
  {
    id: "moh-umar-jaelani",
    name: "Moh. Umar Jaelani",
    role: "Tim Manajerial & Sarpras",
    initials: "UJ",
    isAdmin: false
  },
  {
    id: "bekti-sugiarsih",
    name: "Bekti Sugiarsih",
    role: "Koordinator Kurikulum & Inovasi",
    initials: "BS",
    isAdmin: false
  },
  {
    id: "tsani-churoidah",
    name: "Tsani Churoidah",
    role: "Koordinator Literasi, Perpus & Penilaian",
    initials: "TC",
    isAdmin: false
  },
  {
    id: "adi-setiawan",
    name: "Adi Setiawan",
    role: "Koordinator Kesiswaan & Prestasi",
    initials: "AD",
    isAdmin: false
  },
  {
    id: "ilmiyatus-saadah",
    name: "Ilmiyatus Sa'adah",
    role: "Tim Organisasi, Kesiswaan & Bank Ide",
    initials: "IS",
    isAdmin: false
  },
  {
    id: "is-roviqoh-indayati",
    name: "Is Roviqoh Indayati",
    role: "Tim Humas, Lomba & Koperasi",
    initials: "IR",
    isAdmin: false
  },
  {
    id: "mujiati",
    name: "Mujiati",
    role: "Tim Pembiasaan, Inovasi & Kemitraan",
    initials: "MJ",
    isAdmin: false
  },
  {
    id: "sarirotul-ulum",
    name: "Sarirotul Ulum",
    role: "Koordinator Keuangan, Koperasi & Wirausaha",
    initials: "SU",
    isAdmin: false
  },
  {
    id: "harits-al-anshori",
    name: "Harits Al Anshori",
    role: "Tim Ketatausahaan, Arsip & Sarpras",
    initials: "HA",
    isAdmin: false
  },
  {
    id: "guru-kelas-mapel",
    name: "Guru Kelas / Mapel",
    role: "Dewan Guru MI Almaarif 06",
    initials: "GK",
    isAdmin: false
  }
];

// src/data/indicatorsK1.ts
var INDICATORS_K1 = [
  {
    id: "k1-1",
    componentId: 1,
    no: 1,
    unsurTugas: "Mengembangkan madrasah sesuai dengan kebutuhan.",
    indikatorKinerja: "Mampu mengembangkan struktur organisasi yang sesuai dengan kebutuhan program.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Struktur Organisasi dan Pembagian Tugas/Tupoksi.",
      "Bagan struktur organisasi yang terpampang atau terpublikasi.",
      "Dokumen deskripsi kerja/tupoksi lengkap untuk seluruh personil.",
      "Undangan, daftar hadir, notula, dan foto kegiatan sosialisasi struktur organisasi.",
      "Dokumen/laporan evaluasi keterlaksanaan dan efektivitas struktur organisasi berkala.",
      "SK Penyesuaian/Revisi struktur organisasi atau dokumen rekomendasi pengembangan struktur berdasarkan hasil evaluasi."
    ],
    pics: ["ilmiyatus-saadah"],
    rawKeterangan: "Ilmiyatus Sa'adah"
  },
  {
    id: "k1-2",
    componentId: 1,
    no: 2,
    unsurTugas: "Mengembangkan madrasah sesuai dengan kebutuhan.",
    indikatorKinerja: "Mampu menempatkan personalia yang sesuai dengan kebutuhan.",
    buktiFisik: [
      "Dokumen Analisis Jabatan (Anjab) dan Analisis Beban Kerja (ABK) personalia.",
      "Dokumen pemetaan kualifikasi, kesesuaian sertifikasi, dan latar belakang pendidikan PTK.",
      "SK Kepala Madrasah tentang Penempatan/Pembagian Tugas PTK.",
      "Uraian tugas (job description) resmi yang diterima oleh setiap personalia.",
      "Dokumen/laporan evaluasi berkala terhadap kesesuaian dan efektivitas penempatan personalia.",
      "Dokumen tindak lanjut hasil evaluasi (rekomendasi pelatihan, rotasi tugas, pembinaan, atau penyesuaian posisi)."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-3",
    componentId: 1,
    no: 3,
    unsurTugas: "Mengembangkan madrasah sesuai dengan kebutuhan.",
    indikatorKinerja: "Mampu mengembangkan pedoman dan prosedur kerja organisasi madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Pedoman dan POS/SOP Organisasi Madrasah.",
      "Dokumen Pedoman Kerja Organisasi (Pedoman Akademik, Tata Tertib PTK/Siswa, Kode Etik, dan Juknis Operasional).",
      "Dokumen POS/SOP lengkap mencakup seluruh lini (Akademik, Kesiswaan, Keuangan, Sarpras, Kehumasan, dan Ketatausahaan).",
      "Bukti sosialisasi POS/SOP (Undangan, daftar hadir, notula, dan foto/dokumentasi sosialisasi).",
      "Dokumen/laporan hasil evaluasi keterlaksanaan pedoman dan POS/SOP kerja secara berkala.",
      "Dokumen revisi/pembaruan POS/SOP atau SK Penyesuaian Pedoman Kerja berdasarkan catatan hasil evaluasi."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-4",
    componentId: 1,
    no: 4,
    unsurTugas: "Mengelola perubahan dan pengembangan madrasah menuju organisasi pembelajar yang efektif.",
    indikatorKinerja: "Mampu mengembangkan program baru untuk meningkatkan pencapaian target yang lebih tinggi.",
    buktiFisik: [
      "Dokumen analisis kebutuhan inovasi/pengembangan program baru.",
      "SK Kepala Madrasah tentang Penetapan dan Tim Pengelola Program Baru.",
      "Panduan/Juknis/SOP Pelaksanaan Program Baru.",
      "Bukti sosialisasi program (undangan, daftar hadir, notula, dan dokumentasi foto).",
      "Laporan keterlaksanaan dan capaian target program baru.",
      "Dokumen/laporan evaluasi dampak pelaksanaan program baru terhadap peningkatan mutu/target madrasah.",
      "Data perbandingan capaian target (before-after) atau bukti fisik prestasi/kinerja yang meningkat.",
      "Dokumen rekomendasi tindak lanjut dan rencana pengembangan program inovasi tahap berikutnya."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-5",
    componentId: 1,
    no: 5,
    unsurTugas: "Mengelola perubahan dan pengembangan madrasah menuju organisasi pembelajar yang efektif.",
    indikatorKinerja: "Mampu dan terampil dalam membangun tim kerja yang efektif untuk mendapatkan produk kinerja yang lebih unggul.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pembentukan Tim Kerja lengkap dengan pembagian peran yang terukur.",
      "Bukti pelaksanaan kegiatan koordinasi/rapat tim (undangan, daftar hadir, notula rapat, dan foto dokumentasi).",
      "Dokumen/Produk kinerja unggul yang berhasil dihasilkan oleh tim (seperti: modul/bahan ajar inovatif, karya akademik/nonakademik, SOP/panduan kerja baru, atau produk pembelajaran digital).",
      "Dokumen/laporan evaluasi kinerja dan efektivitas kolaborasi tim kerja secara berkala.",
      "Bukti diseminasi atau penggunaan produk unggulan tim di tingkat madrasah, KKM, atau wilayah yang lebih luas.",
      "Dokumen pemberian apresiasi/penghargaan (reward) bagi tim berprestasi atau rencana pengembangan kapasitas tim secara berkelanjutan."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-6",
    componentId: 1,
    no: 6,
    unsurTugas: "Mengelola perubahan dan pengembangan madrasah menuju organisasi pembelajar yang efektif.",
    indikatorKinerja: "Mampu menerapkan berbagai teknik pembaharuan dalam pengelolaan pembelajaran.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Pedoman dan Tim Pengembang Inovasi Pembelajaran.",
      "Panduan/Juknis penerapan teknik pembaharuan/media pembelajaran interaktif.",
      "Dokumen RPP atau Modul Ajar mayoritas guru yang mengintegrasikan teknik pembaharuan.",
      "Laporan hasil supervisi akademik yang memuat instrumen penilaian teknik pembelajaran baru.",
      "Foto, video, atau tangkapan layar (screenshot) penggunaan media/platform pembelajaran digital di kelas.",
      "Dokumen/laporan evaluasi dan analisis dampak teknik pembaharuan terhadap peningkatan ketercapaian/hasil belajar siswa.",
      "Dokumen tindak lanjut supervisi dan refleksi berkala perbaikan teknik pembelajaran.",
      "Bukti diseminasi/pengimbasan teknik pembaharuan pembelajaran ke madrasah lain, KKM, atau MGMP/KKG."
    ],
    pics: ["tata-usaha", "guru-kelas-mapel"],
    rawKeterangan: "Tata Usaha / Administrator; Guru Kelas / Mapel"
  },
  {
    id: "k1-7",
    componentId: 1,
    no: 7,
    unsurTugas: "Mengelola perubahan dan pengembangan madrasah menuju organisasi pembelajar yang efektif.",
    indikatorKinerja: "Mampu mengembangkan potensi dan meningkatkan prestasi madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pembina Prestasi dan Program Pembinaan Intensif.",
      "Dokumen jadwal, jurnal pelaksanaan pembimbingan, dan daftar hadir kegiatan pembinaan.",
      "Rekapitulasi data prestasi beserta lampiran bukti fisik (sertifikat, piagam penghargaan, piala, atau medali) tingkat kabupaten/provinsi/nasional.",
      "Dokumentasi (foto/video) kegiatan pembinaan dan penerimaan penghargaan.",
      "Laporan evaluasi berkala ketercapaian dan tren grafik peningkatan prestasi madrasah dari tahun ke tahun.",
      "Dokumen/bukti pemberian penghargaan (reward) atau beasiswa bagi siswa dan guru pembimbing berprestasi.",
      "Dokumen rencana tindak lanjut (RTL) atau program regenerasi bibit berprestasi untuk keberlanjutan program."
    ],
    pics: ["adi-setiawan", "mujiati"],
    rawKeterangan: "Adi Setiawan; Mujiati"
  },
  {
    id: "k1-8",
    componentId: 1,
    no: 8,
    unsurTugas: "Mengelola hubungan antara madrasah dan masyarakat dalam rangka pencarian dukungan ide, sumber belajar, dan pembiayaan.",
    indikatorKinerja: "Merencanakan kerja sama dengan lembaga pemerintah, swasta, dan masyarakat.",
    buktiFisik: [
      "Dokumen Perencanaan Program Kerja Sama dan Kemitraan komprehensif (mencakup unsur pemerintah, swasta, dan masyarakat).",
      "SK Kepala Madrasah tentang Tim Pengelola Kerja Sama/Kemitraan.",
      "Dokumen analisis pemetaan kebutuhan sumber belajar, ide, dan pembiayaan berbasis potensi mitra.",
      "Naskah kesepakatan/kesepahaman kerja sama (Draft/Dokumen MoU/MoA) dengan mitra terkait.",
      "Bukti koordinasi/sosialisasi rencana kerja sama (undangan, daftar hadir, notula, dan foto kegiatan).",
      "Dokumen/laporan evaluasi berkala terhadap keterlaksanaan dan efektivitas perencanaan kerja sama.",
      "Dokumen pembaruan data mitra (database kemitraan) dan pemetaan potensi kerja sama baru.",
      "Dokumen analisis tindak lanjut atau perpanjangan naskah kerja sama (MoU/MoA) berdasarkan hasil evaluasi."
    ],
    pics: ["moh-umar-jaelani", "mujiati"],
    rawKeterangan: "Moh. Umar Jaelani; Mujiati"
  },
  {
    id: "k1-9",
    componentId: 1,
    no: 9,
    unsurTugas: "Mengelola hubungan antara madrasah dan masyarakat dalam rangka pencarian dukungan ide, sumber belajar, dan pembiayaan.",
    indikatorKinerja: "Melakukan pendekatan-pendekatan dalam rangka mendapatkan dukungan dari lembaga pemerintah, swasta, dan masyarakat.",
    buktiFisik: [
      "Surat audiensi dan proposal pengajuan dukungan (ide, sumber belajar, atau pembiayaan) ke lembaga pemerintah, swasta, dan masyarakat.",
      "Notula, daftar hadir, dan foto/video kegiatan audiensi atau pemaparan proposal kemitraan.",
      "Surat balasan/persetujuan penerimaan kerja sama dari pihak mitra.",
      "Dokumen nota kesepahaman (MoU/MoA) atau naskah kesepakatan kerja sama yang ditandatangani kedua pihak.",
      "Dokumen/laporan realisasi penerimaan dukungan (berkas sumbangan ide/keahlian, berita acara serah terima bantuan sumber belajar, atau laporan penerimaan dana/beasiswa).",
      "Dokumen/laporan evaluasi efektivitas strategi pendekatan dan tingkat kepuasan mitra kerja sama.",
      "Dokumen laporan pertanggungjawaban (sponsorship/partnership report) serta surat ucapan terima kasih/apresiasi resmi kepada mitra."
    ],
    pics: ["moh-umar-jaelani", "is-roviqoh-indayati"],
    rawKeterangan: "Moh. Umar Jaelani; Is Roviqoh Indayati"
  },
  {
    id: "k1-10",
    componentId: 1,
    no: 10,
    unsurTugas: "Mengelola hubungan antara madrasah dan masyarakat dalam rangka pencarian dukungan ide, sumber belajar, dan pembiayaan.",
    indikatorKinerja: "Memanfaatkan dan memelihara hubungan kerja sama dengan lembaga pemerintah, swasta, dan masyarakat.",
    buktiFisik: [
      "Dokumen realisasi kontribusi kerja sama (Laporan penerimaan beasiswa/bantuan dana, Berita Acara Serah Terima bantuan sarpras/sumber belajar, atau daftar penceramah/praktisi tamu).",
      "Laporan pelaksanaan program kerja sama rutin yang memuat jadwal, daftar hadir, notula, dan foto/video kegiatan.",
      "Dokumen komunikasi dan pemeliharaan hubungan (Surat dinas berkala, undangan kegiatan madrasah untuk mitra, dan media publikasi bersama).",
      "Dokumen/laporan evaluasi ketercapaian dan dampak pemanfaatan kerja sama terhadap mutu madrasah.",
      "Dokumen/bukti pemberian piagam penghargaan atau surat ucapan terima kasih resmi kepada seluruh lembaga mitra.",
      "Dokumen tindak lanjut hasil evaluasi berupa naskah perpanjangan MoU/MoA atau adendum perluasan cakupan kerja sama."
    ],
    pics: ["moh-umar-jaelani", "tata-usaha"],
    rawKeterangan: "Moh. Umar Jaelani; TUM"
  },
  {
    id: "k1-11",
    componentId: 1,
    no: 11,
    unsurTugas: "Mengelola proses pencapaian 8 SNP sesuai dengan arah dan tujuan Pendidikan nasional.",
    indikatorKinerja: "Mengaplikasikan pengembangan kurikulum yang mengacu kepada standar isi.",
    buktiFisik: [
      "SK TPK beserta rincian tugas dan pembagian peran.",
      "Berita acara, daftar hadir, notula rapat, dan foto/dokumentasi kegiatan lokakarya/penyusunan kurikulum (melibatkan Guru, Komite, dan Pengawas).",
      "Dokumen Kurikulum Madrasah (KOSP/KOM atau KTSP) yang telah divalidasi Pengawas dan disahkan oleh Kantor Kemenag Kabupaten/Kota.",
      "Dokumen pemetaan Capaian Pembelajaran (CP)/Kompetensi Dasar (KD), Muatan Lokal, serta Panduan Kokurikuler.",
      "Bukti sosialisasi kurikulum (undangan, daftar hadir, notula, dan foto/video kegiatan).",
      "Dokumen/laporan evaluasi dan keterlaksanaan kurikulum secara berkala (semesteran/tahunan).",
      "Dokumen/lembar rekomendasi tinjauan ulang kurikulum (curriculum review) berdasarkan masukan pemangku kepentingan dan hasil evaluasi.",
      "Dokumen Kurikulum Madrasah edisi revisi/pembaruan beserta Lembar Pengesahan terbaru."
    ],
    pics: ["bekti-sugiarsih"],
    rawKeterangan: "Bekti Sugiarsih"
  },
  {
    id: "k1-12",
    componentId: 1,
    no: 12,
    unsurTugas: "Mengelola proses pencapaian 8 SNP sesuai dengan arah dan tujuan Pendidikan nasional.",
    indikatorKinerja: "Mengaplikasikan pengembangan proses pembelajaran yang mengacu kepada standar proses.",
    buktiFisik: [
      "Dokumen Perangkat Pembelajaran lengkap (CP/TP/ATP/Silabus, Prota, Prosem, RPP/Modul Ajar, Media Pembelajaran, dan Instrumen Asesmen) yang disahkan.",
      "Dokumen Program dan Jadwal Pelaksanaan Supervisi Akademik/Proses Pembelajaran.",
      "Instrumen/lembar hasil supervisi pengamatan kelas (observasi pembelajaran) yang telah diisi.",
      "Dokumentasi (foto/video) pelaksanaan proses pembelajaran di kelas/laboratorium.",
      "Dokumen Laporan Rekapitulasi dan Analisis Hasil Supervisi Akademik/Proses Pembelajaran.",
      "Dokumen Rencana Tindak Lanjut (RTL) Hasil Supervisi (seperti bukti pelaksanaan pembinaan, pendampingan, peer coaching, atau In-House Training/IHT).",
      "Dokumen/laporan evaluasi ketercapaian dan efektivitas perbaikan proses pembelajaran dari periode ke periode."
    ],
    pics: ["ahmad-syaikhu", "guru-kelas-mapel"],
    rawKeterangan: "Ahmad Syaikhu; Guru Kelas/Mapel"
  },
  {
    id: "k1-13",
    componentId: 1,
    no: 13,
    unsurTugas: "Mengelola proses pencapaian 8 SNP sesuai dengan arah dan tujuan Pendidikan nasional.",
    indikatorKinerja: "Mengaplikasikan sistem penilaian pembelajaran yang mengacu kepada standar penilaian.",
    buktiFisik: [
      "SK Panduan Penilaian dan POS/SOP Penilaian Hasil Belajar Madrasah.",
      "Perangkat Asesmen Lengkap (Kisi-kisi, Naskah Soal/Tugas, Pedoman Penskoran/Rubrik, Kunci Jawaban) untuk seluruh mata pelajaran.",
      "Dokumen Hasil Analisis Buat Soal dan Analisis Hasil Asesmen/Ulangan.",
      "Dokumen Program, Jadwal, dan Laporan Pelaksanaan Remedial dan Pengayaan.",
      "Buku Nilai Guru dan Sampel Laporan Hasil Belajar (Rapor) Siswa.",
      "Dokumen/laporan evaluasi keterlaksanaan dan efektivitas sistem penilaian pembelajaran secara berkala.",
      "Dokumen analisis pemanfaatan hasil asesmen untuk perbaikan strategi/metode pengajaran guru.",
      "Dokumen tindak lanjut hasil evaluasi (seperti bukti pelaksanaan workshop penyusunan instrumen asesmen/HOTS atau revisi SOP Penilaian)."
    ],
    pics: ["bekti-sugiarsih", "tsani-churoidah"],
    rawKeterangan: "Bekti Sugiarsih; Tsani Churoidah"
  },
  {
    id: "k1-14",
    componentId: 1,
    no: 14,
    unsurTugas: "Mengelola proses pencapaian 8 SNP sesuai dengan arah dan tujuan Pendidikan nasional.",
    indikatorKinerja: "Melaksanakan penjaminan mutu pencapaian standar kompetensi lulusan.",
    buktiFisik: [
      "SK dan Program Kerja Penjaminan Mutu SKL oleh TPMM.",
      "Dokumen Pemetaan Target Capaian SKL (Sikap, Pengetahuan, Keterampilan, dan KBC).",
      "Laporan pelaksanaan program peningkatan mutu lulusan (kegiatan bimbingan belajar/tryout, pembiasaan karakter/keagamaan, dan ekstrakurikuler).",
      "Dokumen Laporan Kriteria Kelulusan, Kelengkapan Nilai, dan Rekapitulasi Capaian Kelulusan.",
      "Instrumen dan laporan awal pelaksanaan tracer study (penelusuran alur studi lanjut alumni).",
      "Dokumen/laporan evaluasi dan analisis ketercapaian target SKL dari tahun ke tahun (grafik tren mutu lulusan).",
      "Laporan komprehensif hasil tracer study (daya serap alumni di jenjang pendidikan lanjut).",
      "Dokumen Rencana Tindak Lanjut (RTL) atau program perbaikan mutu kelulusan berdasarkan hasil evaluasi."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-15",
    componentId: 1,
    no: 15,
    unsurTugas: "Mengelola unit layanan khusus madrasah dalam mendukung kegiatan pembelajaran dan kegiatan peserta didik di madrasah.",
    indikatorKinerja: "Mampu mengelola laboratorium madrasah agar dapat dimanfaatkan secara optimal untuk kepentingan pembelajaran peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola Laboratorium lengkap dengan rincian tugas (job description).",
      "Dokumen SOP Penggunaan, Pelayanan, dan Keselamatan Kerja (K3) Laboratorium.",
      "Program kerja laboratorium dan jadwal penggunaan laboratorium per semester.",
      "Jurnal/buku log penggunaan laboratorium dan modul/panduan praktikum mata pelajaran.",
      "Buku inventaris, kartu stok bahan, serta kartu pemeliharaan/perawatan alat secara berkala.",
      "Dokumen/laporan evaluasi tingkat keterpakaian (utilization rate) dan efektivitas laboratorium untuk pembelajaran.",
      "Dokumen/laporan pemeliharaan, perbaikan, dan pembaruan alat/bahan laboratorium secara berkala.",
      "Dokumen tindak lanjut hasil evaluasi (seperti inovasi penuntun praktikum, digitalisasi sistem rekapitulasi/logbook, atau pengajuan kelengkapan alat standar)."
    ],
    pics: ["tata-usaha", "moh-umar-jaelani"],
    rawKeterangan: "Tata Usaha / Administrator; Moh. Umar Jaelani"
  },
  {
    id: "k1-16",
    componentId: 1,
    no: 16,
    unsurTugas: "Mengelola unit layanan khusus madrasah dalam mendukung kegiatan pembelajaran dan kegiatan peserta didik di madrasah.",
    indikatorKinerja: "Mampu mengelola perpustakaan madrasah dalam menyiapkan sumber belajar yang diperlukan oleh peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola Perpustakaan lengkap dengan rincian tugas (job description).",
      "Dokumen Program Kerja Perpustakaan dan POS/SOP Pelayanan Perpustakaan (peminjaman, pengembalian, dan pengadaan bahan pustaka).",
      "Buku Induk Koleksi, Sistem Klasifikasi/Katalogisasi Buku, serta Kartu/Aplikasi Peminjaman.",
      "Buku Tamu/Log Pengunjung dan Rekapitulasi Data Peminjaman Buku oleh siswa dan guru.",
      "Bukti ketersediaan koleksi sumber belajar (buku teks, modul, buku pengayaan, referensi, atau jurnal/majalah).",
      "Dokumen/laporan evaluasi berkala terhadap tingkat keterpakaian dan kecukupan layanan perpustakaan.",
      "Dokumen/bukti inovasi perpustakaan (seperti integrasi sistem otomasi perpustakaan/SLiMS, penyediaan e-library, program penguatan literasi madrasah, atau pojok baca kelas).",
      "Dokumen tindak lanjut hasil evaluasi berupa rencana pembaruan koleksi, pengembangan sarana perpustakaan, atau peningkatan kompetensi pustakawan."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-17",
    componentId: 1,
    no: 17,
    unsurTugas: "Mengelola unit layanan khusus madrasah dalam mendukung kegiatan pembelajaran dan kegiatan peserta didik di madrasah.",
    indikatorKinerja: "Mampu mengelola usaha madrasah untuk pembelajaran peserta didik dan pemasukan tambahan dana bagi madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Struktur Pengelola dan Tim Unit Usaha Madrasah lengkap dengan tupoksi.",
      "POS/SOP Pengelolaan dan Operasional Unit Usaha Madrasah.",
      "Jurnal atau rekapitulasi kegiatan praktik kewirausahaan/pembelajaran peserta didik di unit usaha.",
      "Laporan Keuangan Neraca/Laba-Rugi unit usaha yang terintegrasi dengan pembukuan madrasah.",
      "Bukti penggunaan hasil penerimaan/keuntungan unit usaha untuk mendukung kegiatan operasional/pembelajaran madrasah.",
      "Dokumen/laporan evaluasi kinerja keuangan dan operasional unit usaha secara berkala (per semester/tahun).",
      "Dokumen laporan audit internal atau pertanggungjawaban hasil usaha kepada pemangku kepentingan (stakeholders).",
      "Dokumen Rencana Business Plan / Rencana Pengembangan Usaha (ekspansi produk, digitalisasi pemasaran, atau kerja sama kemitraan) untuk tahap berikutnya."
    ],
    pics: ["moh-umar-jaelani"],
    rawKeterangan: "Moh. Umar Jaelani"
  },
  {
    id: "k1-18",
    componentId: 1,
    no: 18,
    unsurTugas: "Mengelola unit layanan khusus madrasah dalam mendukung kegiatan pembelajaran dan kegiatan peserta didik di madrasah.",
    indikatorKinerja: "Mampu mengelola koperasi madrasah baik sebagai media praktik maupun sebagai sumber belajar bagi peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola Koperasi Madrasah lengkap dengan uraian tugas (job description).",
      "POS/SOP Pengelolaan Operasional dan Transaksi Koperasi Madrasah.",
      "Dokumen RPP atau Modul Ajar mata pelajaran terkait yang mengintegrasikan koperasi sebagai media praktik/sumber belajar.",
      "Jurnal kegiatan, jadwal piket/praktik, dan daftar hadir siswa yang melakukan praktik kewirausahaan di koperasi.",
      "Laporan Keuangan Koperasi secara berkala (Neraca dan Laporan Laba/Rugi).",
      "Dokumen Berita Acara, daftar hadir, dan Laporan Rapat Anggota Tahunan (RAT) Koperasi.",
      "Dokumen/laporan evaluasi efektivitas pemanfaatan koperasi sebagai media praktik dan sumber belajar peserta didik.",
      "Dokumen inovasi pengelolaan koperasi (penggunaan sistem kasir digital/e-koperasi, program magang wirausaha muda siswa, atau pemasaran produk karya siswa) beserta RTL."
    ],
    pics: ["sarirotul-ulum", "is-roviqoh-indayati"],
    rawKeterangan: "Sarirotul Ulum; Is Roviqoh Indayati"
  },
  {
    id: "k1-19",
    componentId: 1,
    no: 19,
    unsurTugas: "Mengelola sistem informasi madrasah dalam mendukung penyusunan program dan pengambilan keputusan.",
    indikatorKinerja: "Memanfaatkan teknologi informasi dan komunikasi dalam manajemen madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola Sistem Informasi dan Layanan TIK lengkap dengan uraian tugas (job description).",
      "POS/SOP Pengelolaan dan Pengamanan Sistem Informasi/TIK Madrasah.",
      "Bukti keaktifan dan pengelolaan aplikasi/sistem informasi manajemen (tangkapan layar/dashboard dan bukti akun aktif EMIS, SIMPATIKA, RDM, e-RKAM, atau aplikasi internal).",
      "Bukti sosialisasi/pelatihan penggunaan sistem TIK bagi pendidik dan tenaga kependidikan (undangan, daftar hadir, notula, dan foto).",
      "Dokumen/laporan evaluasi berkala keterpakaian dan efektivitas pemanfaatan TIK dalam pengelolaan madrasah.",
      "Laporan pemeliharaan (maintenance), pembaruan (upgrading), dan pencadangan (backup) data/keamanan sistem TIK secara teratur.",
      "Dokumen hasil analisis data dari sistem TIK yang dimanfaatkan Kepala Madrasah sebagai dasar pengambilan keputusan atau penyusunan program kerja madrasah."
    ],
    pics: ["moh-umar-jaelani"],
    rawKeterangan: "Moh. Umar Jaelani"
  },
  {
    id: "k1-20",
    componentId: 1,
    no: 20,
    unsurTugas: "Mengelola sistem informasi madrasah dalam mendukung penyusunan program dan pengambilan keputusan.",
    indikatorKinerja: "Memanfaatkan teknologi informasi dan komunikasi dalam pembelajaran, baik sebagai sumber belajar maupun sebagai alat/media pembelajaran.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Pedoman dan Penggunaan Platform Pembelajaran Berbasis TIK.",
      "POS/SOP Pemanfaatan Sarana TIK dan Digitalisasi Pembelajaran.",
      "Dokumen RPP atau Modul Ajar mayoritas guru yang terintegrasi dengan media digital, link sumber belajar online, atau instrumen tes berbasis komputer (CBT).",
      "Bukti fisik/tangkapan layar (screenshot) penggunaan platform digital (LMS, akun e-learning, atau aplikasi pembelajaran).",
      "Dokumentasi (foto/video) kegiatan pembelajaran interaktif berbasis TIK di kelas.",
      "Dokumen/laporan evaluasi dan analisis dampak pemanfaatan TIK pembelajaran terhadap peningkatan efektivitas dan hasil belajar siswa.",
      "Katalog/kumpulan produk inovasi bahan ajar digital buatan guru (video pembelajaran, aplikasi interaktif, atau modul digital).",
      "Bukti diseminasi/pengimbasan praktik baik (best practice) pembelajaran berbasis TIK pada forum KKG/MGMP atau madrasah lain."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-21",
    componentId: 1,
    no: 21,
    unsurTugas: "Mengelola sistem informasi madrasah dalam mendukung penyusunan program dan pengambilan keputusan.",
    indikatorKinerja: "Memanfaatkan teknologi informasi dan komunikasi dalam menjalin kerja sama dengan pihak lain.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola Sistem Informasi dan Media Kemitraan Madrasah.",
      "POS/SOP Pemanfaatan Media TIK untuk Komunikasi dan Penjajakan Kerja Sama.",
      "Bukti publikasi profil dan program kemitraan pada situs web resmi, media sosial, atau portal digital madrasah.",
      "Tangkapan layar (screenshot) dan notula pelaksanaan koordinasi/audiensi kerja sama secara daring (Zoom, Google Meet, dll.).",
      "Dokumen arsip digital MoU/MoA dan korespondensi elektronik resmi dengan lembaga mitra.",
      "Dokumen/laporan evaluasi berkala efektivitas pemanfaatan media/sistem TIK dalam meningkatkan efisiensi dan jangkauan kerja sama.",
      "Dokumen analisis statistik/jangkauan (analytics) publikasi kemitraan pada media digital madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pengembangan/pembaruan platform digital kemitraan atau perluasan jaringan kerja sama berbasis TIK."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-22",
    componentId: 1,
    no: 22,
    unsurTugas: "Mengelola sistem informasi madrasah dalam mendukung penyusunan program dan pengambilan keputusan.",
    indikatorKinerja: "Memanfaatkan teknologi informasi dan komunikasi dalam promosi program madrasah dan prestasi yang telah dicapai.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola Sistem Informasi, Humas, dan Tim Kreatif Media Promosi lengkap dengan uraian tugas (job description).",
      "POS/SOP Pengelolaan Media Komunikasi, Promosi, dan Publikasi Digital Madrasah.",
      "Dokumen Kalender Konten/Rencana Publikasi (content planner) program dan prestasi madrasah.",
      "Bukti tayang/publikasi promosi program unggulan, PPDB digital, dan ucapan selamat atas prestasi siswa/guru pada situs web resmi, media sosial, atau saluran digital madrasah.",
      "Dokumen rekapitulasi atau arsip digital konten promosi dan publikasi prestasi.",
      "Dokumen/laporan evaluasi dan analisis jangkauan media promosi (social media analytics, statistik lalu lintas pengunjung situs web, atau survei efektivitas promosi PPDB/program).",
      "Dokumen/laporan evaluasi dampak publikasi prestasi terhadap peningkatan citra (branding) dan daya tarik madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi bentuk konten (video profil interaktif, tur virtual madrasah, atau strategi penguatan branding digital)."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-23",
    componentId: 1,
    no: 23,
    unsurTugas: "Memanfaatkan kemajuan teknologi informasi bagi peningkatan pembelajaran dan manajemen madrasah.",
    indikatorKinerja: "Mampu mengembangkan sistem administrasi pengelolaan secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengelola Sistem Informasi dan Administrasi Digital lengkap dengan uraian tugas (job description).",
      "POS/SOP Pengelolaan Administrasi Madrasah Berbasis TIK.",
      "Dokumen/tangkapan layar (screenshot) penggunaan sistem administrasi digital terintegrasi (seperti aplikasi e-persuratan/e-arsip, sistem database kepegawaian, e-presensi, atau e-RKAM).",
      "Laporan pelaksanaan pengelolaan administrasi digital secara berkala beserta rekapitulasi arsip digital.",
      "Dokumen/laporan evaluasi efektivitas dan tingkat efisiensi tata kelola administrasi berbasis TIK.",
      "Dokumen/laporan prosedur pencadangan data (backup data) dan pemeliharaan keamanan informasi administrasi secara berkala.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi, pembaruan aplikasi, atau efisiensi tata kelola administrasi berbasis TIK untuk tahap berikutnya."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k1-24",
    componentId: 1,
    no: 24,
    unsurTugas: "Memanfaatkan kemajuan teknologi informasi bagi peningkatan pembelajaran dan manajemen madrasah.",
    indikatorKinerja: "Mengelola administrasi pembelajaran secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Pengelolaan Administrasi Pembelajaran Berbasis TIK/Digital.",
      "POS/SOP Pengelolaan, Pemeriksaan, dan Penyimpanan Administrasi Pembelajaran Berbasis TIK.",
      "Bukti fisik/tangkapan layar (screenshot) repositori/folder terpusat administrasi pembelajaran digital (CP/ATP/Silabus, Prota, Prosem, RPP/Modul Ajar, Jurnal Mengajar Digital, e-Absensi).",
      "Bukti penggunaan dan kelengkapan data aplikasi penunjang administrasi penilaian/pembelajaran (seperti RDM atau LMS madrasah).",
      "Dokumen rekapitulasi/bukti verifikasi dan supervisi berkas administrasi pembelajaran guru oleh Kepala Madrasah/Tim Akademik.",
      "Dokumen/laporan evaluasi berkala dan kelengkapan administrasi pembelajaran berbasis TIK seluruh guru per semester.",
      "Dokumen/laporan analisis tingkat efisiensi tata kelola KBM dan kemudahan akses data pembelajaran pasca-penerapan sistem digital.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi penyempurnaan platform administrasi pembelajaran atau kegiatan peningkatan kapasitas TIK guru secara berkesinambungan."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; Tata Usaha / Administrator"
  },
  {
    id: "k1-25",
    componentId: 1,
    no: 25,
    unsurTugas: "Memanfaatkan kemajuan teknologi informasi bagi peningkatan pembelajaran dan manajemen madrasah.",
    indikatorKinerja: "Mampu mengembangkan sistem pengelolaan perpustakaan secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Pengelolaan dan Pelayanan Perpustakaan Berbasis TIK.",
      "POS/SOP Pelayanan dan Pengelolaan Sistem Otomasi/Digital Perpustakaan.",
      "Bukti fisik/tangkapan layar (screenshot) penerapan sistem otomasi perpustakaan yang aktif (modul OPAC, manajemen data anggota, dan transaksi sirkulasi digital).",
      "Laporan rekapitulasi data pengunjung dan transaksi peminjaman/pengembalian buku berbasis sistem digital secara berkala.",
      "Dokumen/laporan evaluasi dan analisis tingkat keterpakaian serta efektivitas sistem perpustakaan berbasis TIK.",
      "Dokumen/laporan prosedur pemeliharaan (maintenance) dan pencadangan data (backup data) sistem perpustakaan digital secara berkala.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi layanan perpustakaan (integrasi platform e-library, penambahan koleksi buku digital, atau akses baca berbasis aplikasi) untuk tahap berikutnya."
    ],
    pics: ["tsani-churoidah"],
    rawKeterangan: "Tsani Churoidah"
  }
];

// src/data/indicatorsK2.ts
var INDICATORS_K2 = [
  {
    id: "k2-1",
    componentId: 2,
    no: 1,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu mengembangkan RKJM, RKT/RKAM dengan program lainnya berdasarkan data hasil evaluasi dalam pemenuhan 8 SNP.",
    buktiFisik: [
      "SK TPM beserta rincian tugas dan pembagian peran (job description).",
      "Dokumen Laporan EDM/e-EDM yang memuat hasil analisis rekomendasi capaian 8 SNP secara komprehensif.",
      "Berita acara, daftar hadir, notula, dan foto/dokumentasi kegiatan lokakarya/penyusunan RKJM dan RKT/RKAM (melibatkan Guru, Komite, dan Pengawas).",
      "Dokumen RKJM (4 tahunan) dan RKT/e-RKAM (1 tahunan) yang disahkan oleh Kepala Madrasah, Komite Madrasah, dan divalidasi/disetujui oleh Kantor Kemenag Kabupaten/Kota.",
      "Bukti sosialisasi dokumen perencanaan madrasah (undangan, daftar hadir, notula, dan dokumentasi kegiatan).",
      "Dokumen/laporan evaluasi dan analisis keterlaksanaan RKT/RKAM secara berkala (per semester/tahunan).",
      "Dokumen/laporan reviu dan penyesuaian (program review) dokumen RKJM/RKT berdasarkan hasil EDM edisi terbaru.",
      "Dokumen Rencana Tindak Lanjut (RTL) penyempurnaan program perencanaan madrasah secara berkelanjutan."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-2",
    componentId: 2,
    no: 2,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu merumuskan visi-misi sebagai arah pengembangan program RKJM, RKT/RKAS dan program lainnya.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Penyusun/Perekayasa Visi, Misi, dan Tujuan Madrasah.",
      "Berita acara, daftar hadir, notula, dan foto/dokumentasi kegiatan perumusan/reviu visi, misi, dan tujuan madrasah yang melibatkan berbagai pihak (Komite, Guru, Tendik, Alumni, Tokoh Masyarakat).",
      "Dokumen Visi, Misi, Tujuan, dan Indikator Ketercapaian yang disahkan resmi.",
      "Dokumen Pemetaan/Matriks Benang Merah (Korelasional) antara Visi-Misi dengan Tujuan Strategis pada Dokumen RKJM dan RKT/e-RKAM.",
      "Bukti sosialisasi visi-misi madrasah kepada warga madrasah dan masyarakat (banner/baliho, situs web resmi, media sosial, papan informasi, atau leaflet).",
      "Dokumen/laporan evaluasi ketercapaian indikator Visi, Misi, dan Tujuan Madrasah secara berkala.",
      "Dokumen/laporan reviu berkala terhadap efektivitas dan relevansi visi-misi madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) atau re-orientasi program RKJM dan RKT/e-RKAM berdasarkan hasil evaluasi."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-3",
    componentId: 2,
    no: 3,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu menentukan strategi pencapaian tujuan madrasah, dilengkapi dengan indikator pencapaian yang terukur.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Penyusun Strategi dan Indikator Kinerja Ketercapaian Tujuan Madrasah.",
      "Dokumen Laporan Analisis SWOT/TOWS atau analisis kondisi objektif madrasah sebagai dasar penentuan strategi.",
      "Dokumen Peta Jalan (Roadmap) dan Matriks Strategi Pencapaian Tujuan beserta Indikator Kinerja Terukur dalam Dokumen RKJM dan RKT/e-RKAM.",
      "Berita acara, daftar hadir, notula, dan foto kegiatan perumusan strategi bersama TPM dan Komite Madrasah.",
      "Bukti sosialisasi penetapan strategi dan indikator capaian tujuan kepada warga madrasah.",
      "Dokumen/laporan evaluasi ketercapaian indikator keberhasilan strategi secara berkala.",
      "Dokumen analisis efektivitas strategi pencapaian tujuan (analisis kendala, faktor pendukung, dan deviasi target).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa penyesuaian strategi (re-strategizing) berdasarkan hasil evaluasi."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-4",
    componentId: 2,
    no: 4,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu menyusun program dengan rencana evaluasi keterlaksanaan dan pencapaian program.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Monitoring dan Evaluasi (Monev) Program Kerja Madrasah lengkap dengan rincian tugas.",
      "POS/SOP Pelaksanaan Monitoring dan Evaluasi Program Kerja Madrasah.",
      "Dokumen Matriks Perencanaan Program yang dilengkapi Rencana Monev (Indikator Keberhasilan, Target, Jadwal, Penanggung Jawab, dan Metode Evaluasi).",
      "Instrumen/Lembar Kerja Monev Keterlaksanaan dan Pencapaian Program Kerja yang terisi lengkap.",
      "Dokumen Laporan Hasil Monitoring Keterlaksanaan dan Pencapaian Program Kerja per semester.",
      "Dokumen/laporan evaluasi dan analisis ketercapaian target program kerja madrasah secara berkala.",
      "Dokumen analisis kesenjangan (gap analysis) antara target perencanaan dan realisasi pencapaian program.",
      "Dokumen Rencana Tindak Lanjut (RTL) atau rekomendasi perbaikan/penyesuaian program berdasarkan hasil monev."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-5",
    componentId: 2,
    no: 5,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Memimpin madrasah dalam rangka pendayagunaan sumber daya madrasah secara optimal.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pembagian Tugas Pendidik dan Tenaga Kependidikan beserta uraian tugas dan rincian beban kerja.",
      "POS/SOP Pemanfaatan dan Pemeliharaan Sarana Prasarana serta Pengelolaan Keuangan Madrasah.",
      "Dokumen Matriks Pemetaan dan Pendayagunaan Sumber Daya Madrasah (SDM, Sarpras, Anggaran) yang selaras dengan RKJM dan RKT/e-RKAM.",
      "Laporan penataan, pemanfaatan, dan pemeliharaan sarana prasarana serta fasilitas pendukung KBM.",
      "Laporan pelaksanaan program pendayagunaan SDM (jadwal pembinaan rutin, pelatihan internal, dan pengembangan kompetensi staf).",
      "Dokumen/laporan evaluasi dan efisiensi pemanfaatan sumber daya madrasah secara berkala.",
      "Dokumen/laporan hasil penilaian kinerja pendidik dan tenaga kependidikan (PKG dan PK-Tendik).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa strategi optimasi, re-alokasi anggaran, atau inovasi pemanfaatan aset."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-6",
    componentId: 2,
    no: 6,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu melaksanakan peraturan sesuai dengan ketentuan yang berlaku.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengkaji dan Penyelarasan Regulasi Tata Kelola Madrasah.",
      "Dokumen Matriks Penyelarasan/Peta Regulasi (analisis hubungan aturan hukum nasional dengan Program Kerja dan SOP Madrasah).",
      "Dokumen RKJM, RKT/e-RKAM, dan KOS/KOM yang memuat konsideran hukum mutakhir dan tepat sasaran.",
      "POS/SOP operasional madrasah yang secara eksplisit disusun berlandaskan ketentuan peraturan yang berlaku.",
      "Bukti sosialisasi regulasi dan kebijakan baru kepada pendidik, tenaga kependidikan, dan Komite Madrasah.",
      "Dokumen/laporan evaluasi dan audit kepatuhan (regulatory compliance audit) terhadap pelaksanaan peraturan di lingkungan madrasah secara berkala.",
      "Dokumen/laporan reviu dan pembaruan kebijakan internal, POS, atau KOS/KOM madrasah yang disesuaikan dengan regulasi terbaru.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa langkah penyempurnaan tata kelola berbasis hasil evaluasi kepatuhan."
    ],
    pics: ["ahmad-syaikhu", "bekti-sugiarsih", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Bekti Sugiarsih; Moh. Umar Jaelani"
  },
  {
    id: "k2-7",
    componentId: 2,
    no: 7,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu menunjukkan keteladanan dalam memanfaatkan sumber daya secara efektif dan efisien.",
    buktiFisik: [
      "SK dan POS/SOP Efisiensi dan Efektivitas Pemanfaatan Sumber Daya (Penghematan Energi, Penggunaan Fasilitas, Pengelolaan Keuangan, dan Disiplin Waktu).",
      "Dokumen/laporan hasil pembinaan rutin dan aksi nyata keteladanan Kepala Madrasah dalam penghematan dan optimasi aset madrasah.",
      "Dokumen Laporan Realisasi Keuangan (e-RKAM/RKAM) yang menunjukkan efisiensi, akuntabilitas, dan transparansi anggaran.",
      "Bukti fisik/rekaman penerapan budaya efisiensi (pencatatan daya, prapromosi paperless, logbook pemanfaatan sarpras, e-absensi).",
      "Jurnal/catatan pengawasan dan penilaian perilaku keteladanan pimpinan oleh Tim Internal/Komite.",
      "Dokumen/laporan evaluasi dan analisis efisiensi pemanfaatan sumber daya secara berkala.",
      "Laporan hasil audit internal atau pemantauan efisiensi penggunaan sarpras dan keuangan madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa program inovasi penghematan (green school, digitalisasi/paperless, optimasi aset)."
    ],
    pics: ["moh-umar-jaelani", "harits-al-anshori"],
    rawKeterangan: "Moh. Umar Jaelani; Harits Al Anshori"
  },
  {
    id: "k2-8",
    componentId: 2,
    no: 8,
    unsurTugas: "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
    indikatorKinerja: "Mampu menunjukkan kedisiplinan sebagai insan pembelajar.",
    buktiFisik: [
      "Dokumen Portofolio Pengembangan Keprofesian Berkelanjutan (PKB) Kepala Madrasah yang terstruktur (Sertifikat Diklat, Surat Tugas, Laporan Hasil).",
      "Dokumen Karya Ilmiah, Penelitian Tindakan Sekolah (PTS), artikel, atau buku/modul karya Kepala Madrasah.",
      "Bukti keaktifan dalam forum KKM/KKKS/organisasi profesi (SK kepengurusan, daftar hadir, atau sertifikat).",
      "Dokumen/laporan kegiatan pengimbasan/diseminasi hasil pelatihan kepada guru dan staf madrasah (undangan, daftar hadir, notula, dan foto).",
      "Jurnal refleksi/catatan (logbook) kedisiplinan pembelajaran mandiri Kepala Madrasah.",
      "Dokumen/laporan evaluasi dan analisis dampak kegiatan pengembangan diri Kepala Madrasah terhadap peningkatan kualitas tata kelola dan KBM.",
      "Bukti pengimbasan/diseminasi praktik baik (best practice) atau karya inovasi ke tingkat KKM, kabupaten/kota, atau provinsi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan target PKB dan peta jalan (roadmap) pengembangan keprofesian Kepala Madrasah."
    ],
    pics: ["ahmad-syaikhu"],
    rawKeterangan: "Ahmad Syaikhu"
  },
  {
    id: "k2-9",
    componentId: 2,
    no: 9,
    unsurTugas: "Menciptakan budaya dan iklim madrasah yang kondusif dan inovatif bagi pembelajaran peserta didik.",
    indikatorKinerja: "Mampu menjadi contoh dan berbudaya mutu yang kompetitif dalam mendorong peningkatan prestasi akademik dan nonakademik peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pembina dan Penanggung Jawab Bina Prestasi Akademik/Nonakademik dilengkapi rincian tugas.",
      "POS/SOP Pembinaan, Pendampingan, dan Keikutsertaan Kompetisi Peserta Didik.",
      "SK/Pedoman Sistem Penghargaan (Reward System) bagi peserta didik dan guru pembimbing berprestasi.",
      "Dokumen Program Kerja Bimbingan Intensif Prestasi, Jadwal Pembinaan Rutin, dan Absensi Kegiatan.",
      "Dokumen Rekapitulasi Prestasi/Kejuaraan Peserta Didik (Kabupaten, Provinsi, Nasional, Internasional) dilampiri bukti fisik otentik (sertifikat, trofi, foto).",
      "Dokumen/laporan evaluasi dan analisis tren kenaikan capaian prestasi akademik/nonakademik peserta didik secara berkala.",
      "Dokumen/laporan evaluasi dampak budaya mutu dan sistem reward terhadap peningkatan motivasi serta iklim kompetitif.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan strategi pembinaan, kemitraan pelatih profesional, atau kelas bakat/riset."
    ],
    pics: ["adi-setiawan", "tsani-churoidah"],
    rawKeterangan: "Adi Setiawan; Tsani Churoidah"
  },
  {
    id: "k2-10",
    componentId: 2,
    no: 10,
    unsurTugas: "Menciptakan budaya dan iklim madrasah yang kondusif dan inovatif bagi pembelajaran peserta didik.",
    indikatorKinerja: "Mampu melengkapi sarana dan prasarana untuk menciptakan suasana belajar kondusif dan inovatif bagi peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelolaan, Pemanfaatan, dan Pemeliharaan Sarana Prasarana Madrasah.",
      "POS/SOP Pemeliharaan, Perawatan, dan Pemanfaatan Sarana Prasarana Pembelajaran.",
      "Dokumen Rencana Pemenuhan dan Pengadaan Sarpras dalam RKJM dan RKT/e-RKAM.",
      "Dokumen Inventarisasi Sarpras Lengkap beserta Kartu Inventaris Ruang (KIR) yang terisi mutakhir.",
      "Foto/dokumentasi otentik ketersediaan sarpras kondusif dan inovatif (kelas nyaman, pojok baca, lab/multimedia, Wi-Fi, sudut ekspresi).",
      "Jurnal/catatan pemanfaatan sarpras dan media pembelajaran inovatif oleh guru dan peserta didik.",
      "Dokumen/laporan evaluasi berkala tingkat kelayakan, keterpakaian, dan kepuasan peserta didik/guru terhadap iklim fisik sarpras.",
      "Dokumen/laporan hasil pemeliharaan rutin, perbaikan, dan inspeksi keselamatan (safety inspection) sarpras madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi pengembangan sarpras modern (digital classroom, green school, peremajaan fasilitas)."
    ],
    pics: ["moh-umar-jaelani"],
    rawKeterangan: "Moh. Umar Jaelani"
  },
  {
    id: "k2-11",
    componentId: 2,
    no: 11,
    unsurTugas: "Menciptakan budaya dan iklim madrasah yang kondusif dan inovatif bagi pembelajaran peserta didik.",
    indikatorKinerja: "Mampu memfasilitasi kegiatan-kegiatan untuk meningkatkan budaya baca dan budaya tulis peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Gerakan Literasi Madrasah (GLM) dan Tim Redaksi/Publikasi Karya Peserta Didik.",
      "POS/SOP Pelaksanaan Kegiatan Literasi (Budaya Baca dan Tulis) Madrasah.",
      "Dokumen Program Kerja Literasi Terintegrasi (jadwal membaca harian, pembuatan karya tulis, mading, penerbitan buku antologi).",
      "Foto/dokumentasi otentik ketersediaan sarana pendukung (pojok baca/sudut baca di setiap kelas, mading aktif, area baca terbuka).",
      "Bukti fisik produk budaya tulis peserta didik (kumpulan cerpen/puisi/artikel, majalah sekolah, buletin digital, atau buku ber-ISBN/non-ISBN).",
      "Dokumen rekapitulasi jurnal/pencatatan pembiasaan membaca harian peserta didik.",
      "Dokumen/laporan evaluasi dan analisis tingkat ketercapaian serta efektivitas program Gerakan Literasi Madrasah secara berkala.",
      "Dokumen/laporan analisis perkembangan indeks minat baca dan produktivitas karya tulis peserta didik.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi program literasi (e-bulletin, festival literasi, penerbitan massal ber-ISBN)."
    ],
    pics: ["tsani-churoidah", "is-roviqoh-indayati"],
    rawKeterangan: "Tsani Churoidah; Is Roviqoh Indayati"
  },
  {
    id: "k2-12",
    componentId: 2,
    no: 12,
    unsurTugas: "Menciptakan budaya dan iklim madrasah yang kondusif dan inovatif bagi pembelajaran peserta didik.",
    indikatorKinerja: "Mampu memfasilitasi kegiatan-kegiatan lomba di bidang akademik dan nonakademik bagi peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pembimbing, Pendamping, dan Fasilitasi Lomba Akademik dan Nonakademik Peserta Didik.",
      "POS/SOP Fasilitasi Pembimbingan, Pendaftaran, Keikutsertaan, dan Penyelenggaraan Lomba.",
      "Dokumen Program Kerja Pembimbingan, Jadwal Pembinaan Intensif, dan Daftar Hadir Pembimbingan Lomba.",
      "Proposal Kegiatan/Keikutsertaan Lomba, Surat Tugas, RAB, dan Laporan Pertanggungjawaban (LPJ) Keuangan Fasilitasi Lomba.",
      "Dokumen rekapitulasi keikutsertaan dan rekam jejak prestasi beserta bukti fisik otentik (foto/video, pendaftaran, piagam/trofi).",
      "Dokumen/laporan evaluasi dan analisis keterlaksanaan serta efektivitas fasilitasi dan pembimbingan lomba secara berkala.",
      "Dokumen analisis tingkat keberhasilan (win rate/peta capaian prestasi) dan analisis kendala dalam keikutsertaan/penyelenggaraan lomba.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perbaikan strategi fasilitasi, peningkatan alokasi anggaran, atau perluasan kemitraan pelatih."
    ],
    pics: ["is-roviqoh-indayati", "adi-setiawan"],
    rawKeterangan: "Is Roviqoh Indayati; Adi Setiawan"
  },
  {
    id: "k2-13",
    componentId: 2,
    no: 13,
    unsurTugas: "Mengelola guru dan staf dalam rangka pendayagunaan sumber daya manusia secara optimal.",
    indikatorKinerja: "Mampu menyusun perencanaan pengembangan pendidik dan tenaga kependidikan.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Tim dan Program Pengembangan Keprofesian Berkelanjutan (PKB) / Rencana Pengembangan PTK.",
      "POS/SOP Penyusunan Perencanaan dan Pelaksanaan Pengembangan PTK.",
      "Dokumen Analisis Kebutuhan Pengembangan Diri PTK (berdasarkan hasil PKG, PK-Tendik, dan analisis kesenjangan kompetensi).",
      "Dokumen Rencana Pengembangan PTK (jangka menengah dan tahunan) yang memuat target kompetensi, jenis pelatihan, jadwal, dan alokasi anggaran.",
      "Dokumen rekapitulasi peta kompetensi, kualifikasi, dan target sertifikasi/pelatihan seluruh PTK.",
      "Dokumen/laporan evaluasi keterlaksanaan dan kesesuaian program perencanaan pengembangan PTK secara berkala.",
      "Dokumen/laporan analisis dampak peningkatan kompetensi PTK terhadap kualitas KBM dan kinerja operasional madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan peta jalan (roadmap) pengembangan PTK dan penyesuaian anggaran."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-14",
    componentId: 2,
    no: 14,
    unsurTugas: "Mengelola guru dan staf dalam rangka pendayagunaan sumber daya manusia secara optimal.",
    indikatorKinerja: "Mampu melakukan pembinaan berkala untuk meningkatkan mutu SDM madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Program Pembinaan Berkala PTK.",
      "POS/SOP Pelaksanaan Pembinaan Berkala Pendidik dan Tenaga Kependidikan.",
      "Dokumen Program Kerja dan Jadwal Pembinaan Berkala PTK (jangka pendek/semesteran).",
      "Jurnal/Buku Catatan Pembinaan (logbook) Kepala Madrasah yang memuat rekam jejak pengarahan/pembinaan individu maupun kelompok.",
      "Bukti fisik kegiatan pembinaan berkala (surat undangan, daftar hadir, berita acara, notula rapat/pembinaan, materi, dan foto).",
      "Laporan pelaksanaan pembinaan SDM madrasah per semester.",
      "Dokumen/laporan evaluasi keterlaksanaan dan efektivitas pembinaan berkala PTK secara periodik.",
      "Dokumen/laporan analisis dampak pembinaan terhadap peningkatan capaian kinerja guru/staf (diselaraskan dengan PKG/PK-Tendik/e-Kinerja).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa rekomendasi penanganan, penghargaan (reward), atau pembaruan strategi pembinaan."
    ],
    pics: ["ahmad-syaikhu"],
    rawKeterangan: "Ahmad Syaikhu"
  },
  {
    id: "k2-15",
    componentId: 2,
    no: 15,
    unsurTugas: "Mengelola guru dan staf dalam rangka pendayagunaan sumber daya manusia secara optimal.",
    indikatorKinerja: "Memfasilitasi guru dan staf administrasi untuk meningkatkan kegiatan pembinaan kompetensi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pelaksana dan Program Fasilitasi Peningkatan Kompetensi PTK.",
      "POS/SOP Fasilitasi Keikutsertaan Pembinaan dan Peningkatan Kompetensi Guru dan Staf Administrasi.",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi pembinaan kompetensi PTK yang terintegrasi dalam RKT/e-RKAM.",
      "Dokumen Surat Tugas, izin operasional/dispensasi, serta bukti dukungan fasilitas/biaya dari madrasah untuk partisipasi KKG/MGMP/Bimtek.",
      "Dokumen Laporan Hasil Pelatihan/Bimtek, sertifikat keikutsertaan, serta rekapitulasi tingkat partisipasi seluruh guru dan staf.",
      "Dokumen/laporan evaluasi dan analisis tingkat keterlaksanaan fasilitasi pembinaan kompetensi PTK secara berkala.",
      "Dokumen/laporan analisis dampak peningkatan kompetensi guru dan staf terhadap efektivitas pembelajaran serta mutu layanan administrasi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan alokasi anggaran fasilitasi, perluasan cakupan pelatihan, atau kemitraan eksternal."
    ],
    pics: ["bekti-sugiarsih", "tsani-churoidah"],
    rawKeterangan: "Bekti Sugiarsih; Tsani Churoidah"
  },
  {
    id: "k2-16",
    componentId: 2,
    no: 16,
    unsurTugas: "Mengelola guru dan staf dalam rangka pendayagunaan sumber daya manusia secara optimal.",
    indikatorKinerja: "Memantau dan menilai penerapan hasil pelatihan dalam pekerjaan di madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Evaluasi dan Pemantauan Penerapan Hasil Pelatihan/Bimtek PTK.",
      "POS/SOP Pemantauan, Supervisi, dan Penilaian Penerapan Hasil Pelatihan dalam Pekerjaan.",
      "Laporan/Dokumen Diseminasi/Pengimbasan Hasil Pelatihan oleh Guru/Staf kepada Rekan Sejawat (undangan, daftar hadir, notula, materi, foto).",
      "Instrumen/Lembar Observasi dan Assessment Penerapan Hasil Pelatihan yang terisi lengkap.",
      "Dokumen Laporan Rekapitulasi Penilaian Penerapan Hasil Pelatihan PTK per semester.",
      "Dokumen/laporan evaluasi dan analisis efektivitas penerapan hasil pelatihan (impact study/transfer of training analysis).",
      "Dokumen analisis komparatif peningkatan kinerja PTK sebelum dan sesudah mengikuti pelatihan (diselaraskan PKG/PK-Tendik/e-Kinerja).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa rekomendasi penyesuaian diklat, penguatan diseminasi internal, atau pemberian reward."
    ],
    pics: ["ahmad-syaikhu"],
    rawKeterangan: "Ahmad Syaikhu"
  },
  {
    id: "k2-17",
    componentId: 2,
    no: 17,
    unsurTugas: "Mengelola sarana dan prasarana madrasah dalam rangka pendayagunaan secara optimal.",
    indikatorKinerja: "Mampu mengelola fasilitas prasarana, perabot dan sarana madrasah (gedung, bangunan, dan lahan meja, kursi, lemari, peralatan kantor, dan alat kebersihan).",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengelola Sarana dan Prasarana lengkap dengan rincian tugas (job description).",
      "POS/SOP Pengelolaan, Pemanfaatan, Pemeliharaan, dan Penghapusan Sarana dan Prasarana Madrasah.",
      "Buku Inventaris Utama (KIB) dan Kartu Inventaris Ruang (KIR) untuk setiap gedung, ruang kelas, kantor, dan lab yang terisi mutakhir.",
      "Dokumen Program Kerja dan Jadwal Perawatan/Pemeliharaan Berkala (gedung, perabot, peralatan kantor, dan alat kebersihan).",
      "Bukti fisik/berkas pelaksanaan pemeliharaan dan perbaikan (logbook perbaikan, nota transaksi, foto before-after perbaikan aset).",
      "Laporan Keberadaan dan Kondisi Aset Madrasah secara berkala per semester.",
      "Dokumen/laporan evaluasi dan audit kondisi kelayakan sarpras, perabot, dan peralatan kantor (condition and safety audit) berkala.",
      "Dokumen/laporan analisis kesenjangan (gap analysis) kebutuhan dan ketersediaan sarpras, serta pemetaan kriteria kondisi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa rencana peremajaan, usulan rehabilitasi/penghapusan, atau digitalisasi tata kelola sarpras."
    ],
    pics: ["moh-umar-jaelani", "harits-al-anshori"],
    rawKeterangan: "Moh. Umar Jaelani; Harits Al Anshori"
  },
  {
    id: "k2-18",
    componentId: 2,
    no: 18,
    unsurTugas: "Mengelola sarana dan prasarana madrasah dalam rangka pendayagunaan secara optimal.",
    indikatorKinerja: "Mampu mengelola perpustakaan madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pengelola/Kepala Perpustakaan lengkap dengan rincian tugas dan struktur organisasi perpustakaan.",
      "POS/SOP Pengelolaan Perpustakaan (Layanan Peminjaman, Pengadaan Koleksi, Perawatan Buku, dan Tata Tertib Perpustakaan).",
      "Dokumen Program Kerja Perpustakaan tahunan yang terintegrasi dalam RKJM dan RKT/e-RKAM.",
      "Buku Inventaris Utama Perpustakaan (buku teks, modul, buku pengayaan, dan referensi) atau database sistem otomasi (SLiMS).",
      "Dokumen rekapitulasi layanan perpustakaan (Buku Pengunjung, Buku Peminjaman, dan Grafik Statistik Kunjungan) per bulan/semester.",
      "Foto/dokumentasi fisik tata ruang perpustakaan yang rapi, aman, nyaman, dan mendukung kegiatan literasi/KBM.",
      "Dokumen/laporan evaluasi dan analisis tingkat keterpakaian/pemanfaatan perpustakaan oleh guru dan peserta didik secara berkala.",
      "Dokumen/laporan analisis kepuasan pemustaka serta analisis kebutuhan penambahan koleksi/pengembangan perpustakaan digital (e-library).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa program inovasi layanan, persiapan akreditasi perpustakaan, atau otomatisasi layanan."
    ],
    pics: ["tsani-churoidah"],
    rawKeterangan: "Tsani Churoidah"
  },
  {
    id: "k2-19",
    componentId: 2,
    no: 19,
    unsurTugas: "Mengelola sarana dan prasarana madrasah dalam rangka pendayagunaan secara optimal.",
    indikatorKinerja: "Mampu mengelola laboratorium madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Kepala/Pengelola Laboratorium dan Laboran lengkap dengan rincian tugas dan struktur organisasi lab.",
      "POS/SOP Pengelolaan Laboratorium (Peminjaman Alat, K3, Pemeliharaan/Perawatan Alat, dan Pengadaan/Penghapusan Bahan).",
      "Dokumen Program Kerja dan Jadwal Rutin Penggunaan/Praktikum Laboratorium terintegrasi RKT/e-RKAM dan KOS/KOM.",
      "Buku Inventaris Alat dan Bahan Praktikum (Buku Stok Bahan/Kartu Alat) yang terisi mutakhir beserta Kartu Inventaris Ruang (KIR).",
      "Jurnal/Jadwal Pelaksanaan Praktikum, Logbook Penggunaan Ruang Laboratorium, dan Kartu Pemeliharaan/Perawatan Alat.",
      "Foto/dokumentasi fisik laboratorium tertata rapi, dilengkapi tata tertib, standar K3 (P3K, APAR), serta pelaksanaan praktikum.",
      "Dokumen/laporan evaluasi dan analisis tingkat pemanfaatan serta efektivitas kegiatan praktikum laboratorium secara berkala.",
      "Dokumen/laporan hasil audit kelayakan alat, ketersediaan bahan habis pakai, dan inspeksi K3 (safety audit) laboratorium.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa program peremajaan alat, perbaikan fasilitas lab, atau digitalisasi tata kelola lab."
    ],
    pics: ["bekti-sugiarsih", "moh-umar-jaelani"],
    rawKeterangan: "Bekti Sugiarsih; Moh. Umar Jaelani"
  },
  {
    id: "k2-20",
    componentId: 2,
    no: 20,
    unsurTugas: "Mengelola sarana dan prasarana madrasah dalam rangka pendayagunaan secara optimal.",
    indikatorKinerja: "Mampu mengelola fasilitas penunjang madrasah lainnya (bengkel, toko, koperasi, kebun, dsb).",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengelola Fasilitas Penunjang Madrasah lengkap dengan rincian tugas dan struktur organisasinya.",
      "POS/SOP Pengelolaan, Pemanfaatan, Pemeliharaan, dan Pengawasan Fasilitas Penunjang (Koperasi, Kantin, Unit Produksi, Kebun, dll.).",
      "Dokumen Program Kerja Pengelolaan Fasilitas Penunjang yang terintegrasi dengan RKT/e-RKAM dan program wirausaha/pembelajaran.",
      "Buku Inventaris dan Kartu Inventaris Ruang/Fasilitas (KIR) unit penunjang yang terisi mutakhir.",
      "Laporan Keuangan dan Operasional Unit Penunjang (Laporan Keuangan Koperasi/Kantin, Logbook Penggunaan Bengkel/Kebun) berkala.",
      "Foto/dokumentasi fisik fasilitas penunjang yang bersih, layak, aman, dan beroperasional aktif.",
      "Dokumen/laporan evaluasi dan analisis tingkat efektivitas, kemandirian, dan kontribusi fasilitas penunjang terhadap layanan madrasah.",
      "Dokumen/laporan hasil audit internal atau pengawasan kelayakan fungsi, higienitas (kantin), atau akuntabilitas keuangan unit penunjang.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa program pengembangan/inovasi unit penunjang (digitalisasi toko, modernisasi bengkel, dll.)."
    ],
    pics: ["moh-umar-jaelani", "sarirotul-ulum"],
    rawKeterangan: "Moh. Umar Jaelani; Sarirotul Ulum"
  },
  {
    id: "k2-21",
    componentId: 2,
    no: 21,
    unsurTugas: "Mengelola peserta didik dalam rangka penerimaan peserta didik baru, dan penempatan dan pengembangan kapasitas peserta didik.",
    indikatorKinerja: "Menyusun perencanaan penerimaan, pengelolaan dan pengembangan kompetensi peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Panitia PPDB, Tim Layanan Matsama, dan Tim Penelusuran Bakat/Minat Peserta Didik.",
      "POS/SOP Pelaksanaan PPDB, SOP Matsama, SOP Penempatan Kelas, serta SOP Pembinaan Pengembangan Kompetensi Peserta Didik.",
      "Dokumen Perencanaan PPDB Lengkap (Juknis PPDB, analisis kuota/daya serap, kriteria pendaftaran, jadwal, instrumen tes, RAB PPDB).",
      "Dokumen Program Kerja Matsama, Jadwal Kegiatan, serta Materi Pengenalan Lingkungan Madrasah.",
      "Dokumen Program Perencanaan Pengembangan Kompetensi Peserta Didik (Remedial & Pengayaan, Ekstrakurikuler, Bimbingan Konseling).",
      "Dokumen/laporan evaluasi dan analisis ketercapaian target PPDB, ketepatan penempatan kelas, dan efektivitas Matsama.",
      "Dokumen/laporan analisis tren kualifikasi, rekam jejak asal sekolah, serta peta potensi/bakat-minat peserta didik dari tahun ke tahun.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi PPDB Online, pembaruan strategi rekrutmen, atau penyesuaian program."
    ],
    pics: ["adi-setiawan", "ilmiyatus-saadah"],
    rawKeterangan: "Adi Setiawan; Ilmiyatus Sa'adah"
  },
  {
    id: "k2-22",
    componentId: 2,
    no: 22,
    unsurTugas: "Mengelola peserta didik dalam rangka penerimaan peserta didik baru, dan penempatan dan pengembangan kapasitas peserta didik.",
    indikatorKinerja: "Memiliki program pengembangan potensi diri dan prestasi peserta didik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengelola/Pembimbing Pengembangan Potensi Diri dan Penelusuran Bakat-Minat Peserta Didik.",
      "POS/SOP Pelaksanaan Program Pengembangan Potensi Diri, Ekstrakurikuler, dan Pembinaan Prestasi Peserta Didik.",
      "Dokumen Pemetaan Potensi, Bakat, dan Minat Peserta Didik (hasil asesmen awal, angket minat, atau tes psikologi/bakat).",
      "Dokumen Program Kerja Pengembangan Potensi Diri (jadwal ekstrakurikuler, pembinaan prestasi, kepemimpinan OSIM, Bimbingan Konseling).",
      "Dokumen Rencana Anggaran Biaya (RAB) pengembangan potensi diri dalam RKT/e-RKAM.",
      "Jurnal Pelaksanaan Pembimbingan, Daftar Hadir Pembina/Peserta, dan Laporan Keterlaksanaan Ekstrakurikuler/Klub Bakat berkala.",
      "Dokumen/laporan evaluasi dan analisis keterlaksanaan serta efektivitas program pengembangan potensi diri peserta didik berkala.",
      "Dokumen/laporan analisis tren perkembangan prestasi dan tingkat partisipasi peserta didik dalam wadah pengembangan potensi diri.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan jenis klub bakat, instruktur eksternal, atau penyempurnaan fasilitas."
    ],
    pics: ["adi-setiawan", "ilmiyatus-saadah"],
    rawKeterangan: "Adi Setiawan; Ilmiyatus Sa'adah"
  },
  {
    id: "k2-23",
    componentId: 2,
    no: 23,
    unsurTugas: "Mengelola peserta didik dalam rangka penerimaan peserta didik baru, dan penempatan dan pengembangan kapasitas peserta didik.",
    indikatorKinerja: "Memfasilitasi kegiatan-kegiatan untuk meningkatkan pembiasaan melalui penanaman nilai-nilai.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pelaksana dan Penanggung Jawab Program Pembiasaan Penanaman Nilai Karakter/Keagamaan/Kebangsaan.",
      "POS/SOP Pelaksanaan Kegiatan Pembiasaan Nilai-Nilai Karakter, Keagamaan, dan Kebangsaan Peserta Didik.",
      "Dokumen Program Kerja Pembiasaan Nilai (jadwal ibadah, pembiasaan kedisiplinan, kebersihan, peringatan hari besar, KBC).",
      "Dokumen/Buku Jurnal Pemantauan Pembiasaan Peserta Didik (Buku Kendali Ibadah/Karakter, presensi, logbook harian).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi kegiatan pembiasaan dalam RKT/e-RKAM.",
      "Foto/dokumentasi otentik pelaksanaan kegiatan pembiasaan nilai-nilai secara rutin dan konsisten.",
      "Dokumen/laporan evaluasi dan analisis tingkat keterlaksanaan serta efektivitas program pembiasaan penanaman nilai secara berkala.",
      "Dokumen/laporan analisis perubahan perilaku, tingkat kedisiplinan, dan indeks pencapaian karakter peserta didik.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi program pembiasaan, penguatan kemitraan orang tua/komite, atau strategi baru."
    ],
    pics: ["mujiati", "adi-setiawan"],
    rawKeterangan: "Mujiati; Adi Setiawan"
  },
  {
    id: "k2-24",
    componentId: 2,
    no: 24,
    unsurTugas: "Mengelola peserta didik dalam rangka penerimaan peserta didik baru, dan penempatan dan pengembangan kapasitas peserta didik.",
    indikatorKinerja: "Memfasilitasi kegiatan pengembangan diri bagi peserta didik, pendidik, dan tenaga kependidikan lainnya secara optimal.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pelaksana dan Penanggung Jawab Fasilitasi Pengembangan Diri bagi Peserta Didik, Pendidik, dan Tendik.",
      "POS/SOP Fasilitasi Kegiatan Pengembangan Diri Terpadu (Siswa, Guru, dan Staf Administrasi).",
      "Dokumen Program Kerja Pengembangan Diri Terpadu beserta alokasi anggaran yang memadai dalam RKT/e-RKAM.",
      "Dokumen rekapitulasi partisipasi dan rekam jejak pengembangan diri lengkap untuk ketiga unsur (peserta didik, guru, dan staf).",
      "Bukti fisik pendukung fasilitasi (surat tugas, izin/dispensasi, laporan hasil kegiatan, sertifikat/piagam, dan foto/dokumentasi).",
      "Dokumen/laporan evaluasi dan analisis tingkat keterlaksanaan serta efektivitas fasilitasi kegiatan pengembangan diri berkala.",
      "Dokumen/laporan analisis dampak pengembangan diri terhadap peningkatan capaian prestasi siswa dan kriteria kinerja PTK.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan strategi fasilitasi, penambahan alokasi anggaran, atau perluasan kemitraan."
    ],
    pics: ["tata-usaha", "sarirotul-ulum"],
    rawKeterangan: "Tata Usaha/Administrator; Sarirotul Ulum"
  },
  {
    id: "k2-25",
    componentId: 2,
    no: 25,
    unsurTugas: "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional.",
    indikatorKinerja: "Mampu mengarahkan secara efektif dalam menerapkan prinsip-prinsip pengembangan KTSP dalam kegiatan IHT, Workshop, Rapat Koordinasi, dan kegiatan MGMP/KKG.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Tim Pengembang Kurikulum (TPK) dan Pengarahan Pengembangan KTSP/Kurikulum Operasional.",
      "POS/SOP Pelaksanaan Pengembangan Kurikulum melalui IHT, Workshop, Rapat Koordinasi, dan Komunitas Belajar/MGMP/KKG.",
      "Dokumen Materi/Slide Pengarahan Kepala Madrasah terkait prinsip-prinsip pengembangan KTSP/kurikulum.",
      "Dokumen Pelaksanaan IHT/Workshop/Rapat Koordinasi/MGMP-KKG (Surat Undangan, Daftar Hadir, Berita Acara, Notula Rapat, Panduan).",
      "Dokumen Rencana Anggaran Biaya (RAB) kegiatan IHT/Workshop pengembangan kurikulum dalam RKT/e-RKAM.",
      "Foto/dokumentasi otentik pelaksanaan pengarahan Kepala Madrasah pada forum IHT, Workshop, Rapat Koordinasi, dan MGMP/KKG.",
      "Dokumen/laporan evaluasi dan analisis tingkat efektivitas pengarahan Kepala Madrasah dalam forum IHT/Workshop/MGMP berkala.",
      "Dokumen/laporan analisis kesesuaian dan ketercapaian penerapan prinsip KTSP/kurikulum dalam perangkat pembelajaran.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perbaikan strategi pengarahan, pendampingan MGMP/KKG, atau pembaruan materi IHT."
    ],
    pics: ["bekti-sugiarsih", "tsani-churoidah"],
    rawKeterangan: "Bekti Sugiarsih; Tsani Churoidah"
  },
  {
    id: "k2-26",
    componentId: 2,
    no: 26,
    unsurTugas: "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional.",
    indikatorKinerja: "Mampu mengendalikan pelaksanaan KTSP berlandaskan kalender pendidikan, menerbitkan surat keputusan pembagian tugas mengajar, dan menerapkan aturan akademik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pembagian Tugas Mengajar dan Tugas Tambahan Pendidik beserta lampiran rincian beban kerja (JJM/JPM) & jadwal.",
      "Dokumen Kalender Pendidikan (Kaldik) Madrasah yang telah disahkan (Pekan Efektif, Hari Efektif, dan Jadwal Evaluasi/Ujian).",
      "Dokumen Aturan Akademik Madrasah (kriteria ketuntasan, PH/PTS/PAS/PAT/Ujian Madrasah, kehadiran, Kenaikan Kelas & Kelulusan) yang disahkan.",
      "POS/SOP Pengendalian Pelaksanaan Kurikulum, Pembagian Tugas Mengajar, dan Penerapan Aturan Akademik.",
      "Dokumen sosialisasi Aturan Akademik dan Jadwal Pelajaran (undangan, daftar hadir sosialisasi guru, siswa, orang tua, notula).",
      "Jurnal pemantauan/keterlaksanaan KBM harian berdasarkan jadwal dan kalender pendidikan.",
      "Dokumen/laporan evaluasi dan analisis keterlaksanaan Kalender Pendidikan serta tingkat kepatuhan Aturan Akademik berkala.",
      "Dokumen/laporan analisis kesesuaian beban kerja guru (JJM) dan Sinkronisasi Data e-Kinerja/EMISGTK.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa penyesuaian jadwal/kaldik, penataan ulang beban kerja, atau revisi Aturan Akademik."
    ],
    pics: ["tsani-churoidah", "ilmiyatus-saadah"],
    rawKeterangan: "Tsani Churoidah; Ilmiyatus Sa'adah"
  },
  {
    id: "k2-27",
    componentId: 2,
    no: 27,
    unsurTugas: "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional.",
    indikatorKinerja: "Memfasilitasi efektivitas tim kerja guru dalam rangka meningkatkan mutu pembelajaran.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pembentukan Tim Kerja Guru/Kombel/MGMP-KKG Internal beserta rincian tugas (job description).",
      "POS/SOP Fasilitasi dan Kegiatan Tim Kerja Guru / Komunitas Belajar Madrasah.",
      "Dokumen Program Kerja dan Jadwal Rutin Kegiatan Tim Kerja Guru (Peer Coaching, Lesson Study, penyusunan perangkat KBM, analisis asesmen).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi tim kerja guru yang terintegrasi dalam RKT/e-RKAM.",
      "Bukti fisik pelaksanaan kegiatan tim kerja (surat undangan, daftar hadir, berita acara, notula, produk/modul KBM, foto kegiatan).",
      "Laporan berkala keterlaksanaan kegiatan tim kerja guru per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat efektivitas dan keaktifan tim kerja guru/Kombel secara berkala.",
      "Dokumen/laporan analisis dampak kegiatan tim kerja guru terhadap peningkatan mutu KBM dan capaian belajar peserta didik.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan strategi fasilitasi tim, apresiasi (reward), atau inovasi kolaboratif."
    ],
    pics: ["bekti-sugiarsih", "is-roviqoh-indayati"],
    rawKeterangan: "Bekti Sugiarsih; Is Roviqoh Indayati"
  },
  {
    id: "k2-28",
    componentId: 2,
    no: 28,
    unsurTugas: "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional.",
    indikatorKinerja: "Mampu mengembangkan pelayanan belajar yang inovatif melalui pengembangan perangkat dan sumber belajar yang terbarukan.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengembang dan Penggunaan Perangkat serta Sumber Belajar Inovatif Terbarukan.",
      "POS/SOP Pengembangan, Pemanfaatan, dan Evaluasi Perangkat serta Sumber Belajar Inovatif.",
      "Dokumen Perangkat Pembelajaran Inovatif (Modul Ajar/RPP berbasis TPACK, HOTS, diferensiasi, integrasi teknologi) seluruh MP disahkan.",
      "Bukti ketersediaan dan pemanfaatan sumber belajar terbarukan (LMS/e-learning, repositori digital, platform interaktif, e-library).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi/pengadaan perangkat dan sumber belajar digital terbarukan dalam RKT/e-RKAM.",
      "Foto/dokumentasi otentik KBM yang menerapkan pembelajaran inovatif berbasis perangkat dan sumber belajar terbarukan.",
      "Dokumen/laporan evaluasi dan analisis tingkat efektivitas pemanfaatan perangkat dan sumber belajar inovatif secara berkala.",
      "Dokumen/laporan analisis dampak penerapan pembelajaran inovatif terhadap peningkatan motivasi, keterlibatan, dan capaian siswa.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan platform digital, pelatihan tingkat lanjut, atau diversifikasi sumber belajar."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k2-29",
    componentId: 2,
    no: 29,
    unsurTugas: "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional.",
    indikatorKinerja: "Memfasilitasi peserta didik dalam mengembangkan kolaborasi dan kompetisi bidang akademik dan nonakademik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pelaksana, Pembimbing, dan Pendamping Kegiatan Kolaborasi serta Kompetisi Akademik & Nonakademik.",
      "POS/SOP Fasilitasi Pembimbingan, Keikutsertaan Lomba, dan Kegiatan Kolaborasi Peserta Didik.",
      "Dokumen Program Pembimbingan Intensif Lomba/Kompetisi dan Agenda Kegiatan Kolaborasi Peserta Didik.",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi pembimbingan, pendaftaran, dan akomodasi lomba/kolaborasi dalam RKT/e-RKAM.",
      "Berkas administrasi lengkap keikutsertaan (Surat Tugas, Surat Izin Orang Tua, Jurnal Pembimbingan, LPJ Kegiatan).",
      "Rekapitulasi perolehan prestasi/kejuaraan, piagam/sertifikat, piala, serta foto/dokumentasi otentik kegiatan.",
      "Dokumen/laporan evaluasi dan analisis tingkat keterlaksanaan serta efektivitas program pembimbingan lomba & kolaborasi siswa.",
      "Dokumen/laporan analisis tren perolehan prestasi dan dampak kegiatan kolaborasi terhadap karakter serta mutu madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan strategi pembimbingan, skema insentif/apresiasi, atau perluasan kemitraan."
    ],
    pics: ["is-roviqoh-indayati", "adi-setiawan"],
    rawKeterangan: "Is Roviqoh Indayati; Adi Setiawan"
  },
  {
    id: "k2-30",
    componentId: 2,
    no: 30,
    unsurTugas: "Mengelola keuangan madrasah sesuai dengan prinsip pengelolaan yang akuntabel, transparan, dan efisien.",
    indikatorKinerja: "Mampu merencanakan kebutuhan keuangan madrasah sesuai dengan rencana pengembangan madrasah, baik jangka pendek maupun jangka panjang.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Penyusun Rencana Kerja dan Anggaran Madrasah (Tim e-RKAM / Tim Pengembang Madrasah).",
      "POS/SOP Perencanaan dan Penyusunan Anggaran Keuangan Madrasah.",
      "Dokumen Evaluasi Diri Madrasah (EDM) mutakhir sebagai basis penyusunan anggaran.",
      "Dokumen Rencana Kerja Jangka Menengah (RKJM 4 Tahun) dan Rencana Kerja Tahunan (RKT) yang telah disahkan.",
      "Dokumen Rencana Kerja dan Anggaran Madrasah (e-RKAM / RAPBM) tahunan terperinci per sumber dana (BOS, Komite, DIPA, dll.).",
      "Berkas proses penyusunan anggaran (Surat Undangan, Daftar Hadir Tim & Komite, Notula, Berita Acara Penetapan RKAM).",
      "Dokumen/laporan evaluasi dan analisis tingkat ketercapaian serta efektivitas perencanaan anggaran keuangan per semester/tahun.",
      "Dokumen/laporan analisis kesenjangan (gap analysis) antara proyeksi kebutuhan dana dengan realisasi penerimaan.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa optimalisasi sumber pendapatan baru, efisiensi operasional, atau penyempurnaan e-RKAM."
    ],
    pics: ["moh-umar-jaelani", "tata-usaha"],
    rawKeterangan: "Moh. Umar Jaelani; TUM"
  },
  {
    id: "k2-31",
    componentId: 2,
    no: 31,
    unsurTugas: "Mengelola keuangan madrasah sesuai dengan prinsip pengelolaan yang akuntabel, transparan, dan efisien.",
    indikatorKinerja: "Mampu mengupayakan sumber-sumber keuangan terutama dari luar madrasah dan dari unit usaha madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Penggalangan Sumber Dana Luar (Fundraising) dan Pengelola Unit Usaha Madrasah beserta tupoksi.",
      "POS/SOP Penggalangan Dana Luar/Masyarakat dan SOP Pengelolaan Bagi Hasil/Pendapatan Unit Usaha Madrasah.",
      "Dokumen Proposal Penggalangan Dana/Sponsorship dan Perjanjian Kerja Sama (MoU/Kemitraan) dengan pihak luar (alumni, CSR, hibah).",
      "Dokumen Pembukuan dan Rekapitulasi Pendapatan Unit Usaha Madrasah (Buku Kas, Laporan Bagi Hasil/SHU).",
      "Dokumen Pencatatan Penerimaan Dana Luar dan Unit Usaha yang terintegrasi transparan dalam e-RKAM/RAPBM (Bukti Kas Masuk, kuitansi, rekening).",
      "Laporan Pertanggungjawaban (LPJ) Penggunaan Dana Luar dan Hasil Unit Usaha secara berkala.",
      "Dokumen/laporan evaluasi dan analisis efektivitas penggalangan dana luar serta diversifikasi unit usaha secara berkala.",
      "Dokumen/laporan analisis tingkat kontribusi dan rasio kemandirian finansial madrasah dari sumber non-BOS/non-DIPA.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perluasan jaringan kemitraan/CSR, digitalisasi bagi hasil, atau bisnis baru."
    ],
    pics: ["sarirotul-ulum", "adi-setiawan"],
    rawKeterangan: "Sarirotul Ulum; Adi Setiawan"
  },
  {
    id: "k2-32",
    componentId: 2,
    no: 32,
    unsurTugas: "Mengelola keuangan madrasah sesuai dengan prinsip pengelolaan yang akuntabel, transparan, dan efisien.",
    indikatorKinerja: "Mampu mengkoordinasikan pembelanjaan keuangan sesuai dengan peraturan dan perundang-undangan berdasarkan asas prioritas dan efisiensi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengelola Keuangan (KPA, PPK, Bendahara, dan Pejabat Pengadaan Barang/Jasa).",
      "POS/SOP Pengkoordinasian Pembelanjaan, Verifikasi Kelayakan Anggaran, Pencairan Dana, dan Penyusunan SPJ Keuangan.",
      "Dokumen Rencana Kerja dan Anggaran Madrasah (e-RKAM) yang menjadi acuan pembelanjaan berbasis skala prioritas program.",
      "Berkas Pembelanjaan dan SPJ Lengkap (Laporan Realisasi, BKU, Buku Kas Pembantu, kuitansi bermaterai, nota/faktur, BAST, bukti pajak).",
      "Dokumen verifikasi/uji kelayakan pembelanjaan oleh Bendahara dan Kepala Madrasah sebelum pencairan dana.",
      "Laporan Pertanggungjawaban (LPJ) Keuangan secara berkala per tahap/semester.",
      "Dokumen/laporan evaluasi dan analisis efisiensi pembelanjaan serta tingkat kesesuaian realisasi anggaran dengan e-RKAM berkala.",
      "Dokumen/laporan hasil audit internal (oleh Tim Audit/Komite) atau LHP dari Inspektorat/BPK dengan status patuh tanpa temuan.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perbaikan mekanisme PBJ, efisiensi operasional pengeluaran, atau pembaruan pedoman teknis."
    ],
    pics: ["moh-umar-jaelani", "sarirotul-ulum"],
    rawKeterangan: "Moh. Umar Jaelani; Sarirotul Ulum"
  },
  {
    id: "k2-33",
    componentId: 2,
    no: 33,
    unsurTugas: "Mengelola keuangan madrasah sesuai dengan prinsip pengelolaan yang akuntabel, transparan, dan efisien.",
    indikatorKinerja: "Mampu membuat laporan dan evaluasi pengelolaan keuangan madrasah sesuai dengan prinsip efisien, transparan, dan akuntabel.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Laporan Pertanggungjawaban (LPJ) Keuangan dan Tim Evaluasi Keuangan Madrasah.",
      "POS/SOP Penyusunan Laporan Keuangan, Evaluasi Anggaran, dan Publikasi Transparansi Keuangan.",
      "Dokumen Laporan Pertanggungjawaban (LPJ) Keuangan berkala (Bulanan, Semesteran, Tahunan) sah (LPJ BOS, Komite, DIPA) selaras e-RKAM.",
      "Dokumen kelengkapan Laporan Keuangan (BKU, Buku Kas Pembantu Bank, Buku Pembantu Pajak, BA Pemeriksaan Kas, Rekonsiliasi Bank).",
      "Bukti fisik/media transparansi keuangan (Papan Informasi Keuangan, postingan website/medsos, Notula Rapat Pleno bersama Komite/Orang Tua).",
      "Dokumen Laporan Evaluasi Pengelolaan Keuangan Madrasah secara berkala.",
      "Dokumen/laporan evaluasi dan analisis tingkat efisiensi, efektivitas, serta rasio daya serap anggaran keuangan berkala.",
      "Dokumen/laporan hasil audit internal atau LHP dari pihak eksternal (Inspektorat/BPK/Kemenag) yang telah ditindaklanjuti.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perbaikan sistem pelaporan, peningkatan akuntabilitas publik, atau efisiensi anggaran."
    ],
    pics: ["moh-umar-jaelani", "sarirotul-ulum"],
    rawKeterangan: "Moh. Umar Jaelani; Sarirotul Ulum"
  },
  {
    id: "k2-34",
    componentId: 2,
    no: 34,
    unsurTugas: "Mengelola ketatausahaan madrasah dalam mendukung pencapaian tujuan madrasah.",
    indikatorKinerja: "Mampu mengelola administrasi surat masuk dan surat keluar sesuai dengan pedoman persuratan yang berlaku.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim/Petugas Pengelola Ketatausahaan dan Kearsipan beserta rincian tugas (job description).",
      "POS/SOP Pengelolaan Surat Masuk, POS/SOP Pengelolaan Surat Keluar, dan SOP Kearsipan/Penyimpanan Dokumen.",
      "Buku Agenda Surat Masuk dan Buku Agenda Surat Keluar yang terisi mutakhir beserta Buku Ekspedisi Surat.",
      "Lembar Disposisi Surat Masuk yang telah ditindaklanjuti dan terdistribusi secara tertib.",
      "Map/Ordner/Arsip Fisik dan/atau Digital (seperti aplikasi SRIKANDI atau e-persuratan) terklasifikasi Kode Klasifikasi Surat Kemenag.",
      "Sampel berkas surat keluar (draf, lembar verifikasi/paraf hierarki, dan surat resmi bersurat/TTE).",
      "Dokumen/laporan evaluasi dan analisis ketepatan waktu alur disposisi, penyelesaian surat, dan kearsipan secara berkala.",
      "Dokumen/laporan hasil audit internal atau inspeksi ketertiban administrasi persuratan dan kearsipan madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi digitalisasi persuratan (e-persuratan), pembaruan sistem kearsipan, atau peningkatan SDM."
    ],
    pics: ["harits-al-anshori", "tata-usaha"],
    rawKeterangan: "Harits Al Anshori; TUM"
  },
  {
    id: "k2-35",
    componentId: 2,
    no: 35,
    unsurTugas: "Mengelola ketatausahaan madrasah dalam mendukung pencapaian tujuan madrasah.",
    indikatorKinerja: "Mampu mengelola administrasi madrasah yang meliputi administrasi akademik, kesiswaan, sarana/prasarana, keuangan, dan hubungan madrasah dengan masyarakat.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penugasan Tim/Pengelola Administrasi Madrasah beserta rincian tugas (job description) 5 bidang.",
      "POS/SOP Pengelolaan Administrasi Akademik, Kesiswaan, Sarpras, Keuangan, dan Humas.",
      "Dokumen Administrasi Akademik (Buku Induk Guru/Pegawai, Klaper, Buku Leger/Kumpulan Nilai, Jadwal KBM, arsip kurikulum).",
      "Dokumen Administrasi Kesiswaan (Buku Induk Siswa, Buku Mutasi Siswa, arsip rekapitulasi PPDB, rekam medis/kedisiplinan).",
      "Dokumen Administrasi Sarana/Prasarana (Buku Inventaris Barang, KIR, Buku Pemeliharaan, Berita Acara Penerimaan/Penghapusan).",
      "Dokumen Administrasi Keuangan (Buku Kas Umum, arsip SPJ/LPJ, bukti penerimaan/pengeluaran resmi).",
      "Dokumen Administrasi Humas (Buku Tamu, arsip MoU/PKS, arsip publikasi/siaran pers, Notula Rapat Komite/Masyarakat).",
      "Dokumen/laporan evaluasi dan analisis kelengkapan serta ketertiban administrasi pada kelima bidang secara berkala.",
      "Dokumen/laporan hasil audit/supervisi internal ketatausahaan (sinkronisasi data kelima bidang pada EMIS, EMISGTK, SIM Madrasah).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi digitalisasi administrasi terpadu, pembaruan tata kelola kearsipan, atau peningkatan SDM."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k2-36",
    componentId: 2,
    no: 36,
    unsurTugas: "Mengelola ketatausahaan madrasah dalam mendukung pencapaian tujuan madrasah.",
    indikatorKinerja: "Mampu mengelola administrasi kearsipan madrasah baik arsip dinamis maupun arsip lainnya.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim/Petugas Pengelola Kearsipan Madrasah dan Pola Klasifikasi Arsip.",
      "POS/SOP Pengelolaan Arsip Dinamis (Penciptaan, Penggunaan, Pemeliharaan, Penyusutan) serta SOP Kearsipan Digital.",
      "Daftar Pertelaan Arsip (DPA) / Daftar Inventaris Arsip (Arsip Dinamis Aktif, Inaktif, dan Arsip Vital/Permanen).",
      "Dokumen Kode Klasifikasi Surat/Arsip Kementerian Agama yang terintegrasi dalam sistem tata persuratan dan kearsipan.",
      "Bukti penyimpanan arsip fisik tertata rapi (labeling, index, folder/ordner, ruang arsip) dan repositori digital (SRIKANDI, Google Drive).",
      "Berita Acara Pemindahan/Penyusutan/Pemusnahan Arsip yang telah kedaluwarsa sesuai Jadwal Retensi Arsip (JRA).",
      "Dokumen/laporan evaluasi dan analisis tingkat kecepatan pencarian/penciptaan kembali (retrieval time) serta keandalan keamanan arsip.",
      "Dokumen/laporan hasil audit/inspeksi internal kelayakan dan keamanan sarana kearsipan (fisik dan digital).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa inovasi digitalisasi kearsipan (e-archiving), pembaruan sarana, atau peningkatan SDM."
    ],
    pics: ["harits-al-anshori", "tata-usaha"],
    rawKeterangan: "Harits Al Anshori; TUM"
  },
  {
    id: "k2-37",
    componentId: 2,
    no: 37,
    unsurTugas: "Mengelola ketatausahaan madrasah dalam mendukung pencapaian tujuan madrasah.",
    indikatorKinerja: "Mampu mengelola administrasi akreditasi madrasah sesuai dengan prinsip-prinsip tersedianya dokumen pendukung dan bukti fisik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Akreditasi Madrasah beserta rincian tugas (job description) per komponen/standar.",
      "POS/SOP Pengelolaan Administrasi, Penyiapan Dokumen Pendukung, dan Pengarsipan Bukti Fisik Akreditasi.",
      "Dokumen Pemetaan dan Analisis Kebutuhan Dokumen Pendukung Akreditasi (berdasarkan instrumen IASP/BAN-PDM mutakhir).",
      "Berkas/Dokumen Bukti Fisik Akreditasi Lengkap per Komponen (Mutu Lulusan, Proses Pembelajaran, Mutu Guru, Manajemen) terarsip rapi.",
      "Dokumen Rencana Anggaran Biaya (RAB) persiapan dan pemenuhan sarana akreditasi dalam RKT/e-RKAM.",
      "Bukti pemutakhiran data dan unggah dokumen pendukung pada aplikasi Sispena (BAN-PDM/BAN-S/M).",
      "Dokumen/laporan evaluasi dan analisis tingkat kesiapan dokumen serta kelengkapan bukti fisik akreditasi berkala.",
      "Dokumen/laporan hasil simulasi/penilaian mandiri (self-assessment) akreditasi beserta analisis kesenjangan (gap analysis) skor.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pemenuhan kekurangan bukti fisik, pemutakhiran data Sispena, dan perbaikan mutu."
    ],
    pics: ["ahmad-syaikhu"],
    rawKeterangan: "Ahmad Syaikhu"
  },
  {
    id: "k2-38",
    componentId: 2,
    no: 38,
    unsurTugas: "Melakukan monitoring, evaluasi, dan pelaporan pelaksanaan program kegiatan madrasah dengan prosedur yang tepat, serta merencanakan tindak lanjutnya.",
    indikatorKinerja: "Menyusun standar kinerja program pendidikan yang dapat diukur dan dinilai.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Penyusun Standar Kinerja Program Pendidikan dan Penetapan IKU/IKK Madrasah.",
      "POS/SOP Penyusunan, Penetapan, dan Pengukuran Standar Kinerja Program Pendidikan.",
      "Dokumen Matriks Standar Kinerja Program Pendidikan (target kuantitatif/kualitatif, baseline, indikator capaian, PIC) seluruh bidang.",
      "Dokumen penyelarasan standar kinerja program dengan sasaran strategis dalam RKJM, RKT/e-RKAM, dan EDM.",
      "Instrumen Pengukuran dan Penilaian Kinerja Program Pendidikan yang disahkan.",
      "Notula, daftar hadir, dan berita acara rapat penyusunan/penetapan standar kinerja program bersama TPM dan Komite.",
      "Dokumen/laporan evaluasi dan analisis relevansi serta ketepatan instrumen/standar kinerja program berkala.",
      "Dokumen/laporan analisis kesenjangan (gap analysis) antara target standar kinerja dengan realisasi pencapaian program.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan IKU/IKK, penyesuaian target, atau penyempurnaan mekanisme penilaian."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k2-39",
    componentId: 2,
    no: 39,
    unsurTugas: "Melakukan monitoring, evaluasi, dan pelaporan pelaksanaan program kegiatan madrasah dengan prosedur yang tepat, serta merencanakan tindak lanjutnya.",
    indikatorKinerja: "Melakukan monitoring dan evaluasi kinerja program pendidikan dengan menggunakan teknik yang sesuai.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pelaksana Monev Internal beserta rincian tugas dan jadwal pelaksanaan monev.",
      "POS/SOP Pelaksanaan Monitoring dan Evaluasi Kinerja Program Pendidikan.",
      "Dokumen Panduan dan Instrumen Monev Terstandar (observasi, wawancara, kuesioner/angket, dan studi dokumen).",
      "Dokumen Rencana Anggaran Biaya (RAB) kegiatan monev program yang terintegrasi dalam RKT/e-RKAM.",
      "Berkas Hasil Pelaksanaan Monev Terisi Lengkap (instrumen monev terisi, olahan data, foto/dokumentasi, notula rapat koordinasi).",
      "Laporan Hasil Monitoring dan Evaluasi Kinerja Program Pendidikan secara berkala (per semester/tahunan) disahkan Kepala Madrasah.",
      "Dokumen/laporan evaluasi dan analisis validitas serta efektivitas teknik/instrumen monev yang digunakan secara berkala.",
      "Dokumen/laporan analisis kesenjangan (gap analysis) ketercapaian target program berdasarkan temuan hasil monev.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perbaikan instrumen/teknik monev, penyesuaian strategi, atau re-alokasi sumber daya."
    ],
    pics: ["ahmad-syaikhu"],
    rawKeterangan: "Ahmad Syaikhu"
  },
  {
    id: "k2-40",
    componentId: 2,
    no: 40,
    unsurTugas: "Melakukan monitoring, evaluasi, dan pelaporan pelaksanaan program kegiatan madrasah dengan prosedur yang tepat, serta merencanakan tindak lanjutnya.",
    indikatorKinerja: "Menyusun laporan sesuai dengan standar pelaporan monitoring dan evaluasi yang faktual dan realistis.",
    buktiFisik: [
      "Laporan monev komprehensif beserta bukti autentik disahkan Kepala Madrasah.",
      "SOP/POS monitoring, evaluasi, dan pelaporan program madrasah.",
      "Instrumen monev dan data terverifikasi (rekapitulasi data dan bukti audit).",
      "Analisis capaian target vs realisasi serta analisis akar masalah.",
      "Rekomendasi perbaikan berbasis data faktual dan realistis.",
      "Dokumen RTL dengan target, jadwal, anggaran, dan penanggung jawab yang jelas.",
      "Notula dan berita acara penetapan RTL bersama tim monev.",
      "Bukti integrasi RTL ke dalam RKT/RKJM dan dokumen anggaran terkait (e-RKAM).",
      "Laporan kemajuan (progress report) pelaksanaan RTL dan analisis efektivitas dampak tindak lanjut."
    ],
    pics: ["ahmad-syaikhu"],
    rawKeterangan: "Ahmad Syaikhu"
  },
  {
    id: "k2-41",
    componentId: 2,
    no: 41,
    unsurTugas: "Melakukan monitoring, evaluasi, dan pelaporan pelaksanaan program kegiatan madrasah dengan prosedur yang tepat, serta merencanakan tindak lanjutnya.",
    indikatorKinerja: "Merumuskan program tindak lanjut berdasarkan hasil evaluasi pelaksanaan program sebelumnya.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Dokumen Rencana Tindak Lanjut (RTL) Hasil Evaluasi Program Kegiatan Madrasah.",
      "POS/SOP Penyusunan dan Pelaksanaan Program Tindak Lanjut (RTL).",
      "Dokumen Rencana Tindak Lanjut (RTL) Komprehensif (analisis hasil monev, pemetaan akar masalah, rekomendasi, action plan, timeline, PIC).",
      "Dokumen penyelarasan/integrasi rekomendasi RTL ke dalam penyusunan RKT/e-RKAM dan EDM periode berikutnya.",
      "Bukti proses perumusan RTL (Surat Undangan, Daftar Hadir Tim Evaluasi/Monev, Notula Rapat, Berita Acara Penetapan RTL).",
      "Laporan Kemajuan (Progress Report) keterlaksanaan program tindak lanjut secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat ketercapaian serta keterlaksanaan program tindak lanjut (RTL) berkala.",
      "Dokumen/laporan analisis dampak pelaksanaan RTL terhadap peningkatan mutu layanan dan pencapaian indikator kinerja.",
      "Dokumen Rekomendasi/Rencana Tindak Lanjut Siklus Berikutnya untuk memastikan kesinambungan peningkatan mutu (CQI)."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  }
];

// src/data/indicatorsK34.ts
var INDICATORS_K3 = [
  {
    id: "k3-1",
    componentId: 3,
    no: 1,
    unsurTugas: "Menciptakan inovasi yang bermanfaat dan tepat bagi pengembangan madrasah.",
    indikatorKinerja: "Memahami dan menghayati arti dan tujuan perubahan (inovasi) madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Peta Jalan (Roadmap) Inovasi dan Perubahan Madrasah serta Tim Pengembang Inovasi.",
      "POS/SOP Penyusunan, Sosialisasi, dan Pelaksanaan Perubahan/Inovasi Madrasah.",
      "Dokumen Naskah Akademik / Peta Jalan (Roadmap) Inovasi Madrasah (latar belakang, landasan filosofis, tujuan, target, SWOT/EDM).",
      "Dokumen penyelarasan program inovasi dalam dokumen strategis RKJM, RKT/e-RKAM, dan Kurikulum Operasional Madrasah (KOM/KOSP).",
      "Dokumen sosialisasi pemahaman arti dan tujuan inovasi (Surat Undangan, Daftar Hadir, Materi/Presentasi, Notula, Foto Kegiatan).",
      "Instrumen/Kuesioner Pemahaman Warga Madrasah terhadap Visi dan Tujuan Perubahan/Inovasi Madrasah yang terisi.",
      "Dokumen/laporan evaluasi dan analisis tingkat pemahaman, penerimaan (buy-in), dan komitmen warga madrasah berkala.",
      "Dokumen/laporan analisis dampak penerapan budaya inovasi terhadap iklim kerja dan kinerja kelembagaan madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa penguatan internalisasi nilai perubahan atau penyempurnaan roadmap inovasi."
    ],
    pics: ["bekti-sugiarsih", "mujiati"],
    rawKeterangan: "Bekti Sugiarsih; Mujiati"
  },
  {
    id: "k3-2",
    componentId: 3,
    no: 2,
    unsurTugas: "Menciptakan inovasi yang bermanfaat dan tepat bagi pengembangan madrasah.",
    indikatorKinerja: "Menggunakan metode, teknik dan proses perubahan madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Manajemen Perubahan/Transformasi Madrasah beserta rincian tugas (job description).",
      "POS/SOP Pengelolaan Proses Perubahan dan Metodologi Inovasi Madrasah.",
      "Dokumen Pedoman/Panduan Kerangka Kerja (Framework) dan Metode Perubahan Madrasah (kesiapan, tahapan, stakeholder, mitigasi risiko).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi penerapan metode/proses perubahan dalam RKT/e-RKAM.",
      "Berkas pelaksanaan proses perubahan lengkap (Surat Undangan, Daftar Hadir, Notula, Panduan Teknis, Foto, Jurnal Pelaksanaan).",
      "Dokumen Laporan Keterlaksanaan Tahapan dan Proses Perubahan Madrasah secara berkala.",
      "Dokumen/laporan evaluasi dan analisis kelayakan serta efektivitas metode/teknik perubahan yang digunakan berkala.",
      "Dokumen/laporan analisis dampak penerapan proses perubahan terhadap percepatan pencapaian target kinerja.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa penyempurnaan metode perubahan atau replikasi teknik perubahan pada program lainnya."
    ],
    pics: ["bekti-sugiarsih", "mujiati"],
    rawKeterangan: "Bekti Sugiarsih; Mujiati"
  },
  {
    id: "k3-3",
    componentId: 3,
    no: 3,
    unsurTugas: "Menciptakan inovasi yang bermanfaat dan tepat bagi pengembangan madrasah.",
    indikatorKinerja: "Menumbuhkan iklim yang mendorong kebebasan berpikir untuk menciptakan kreativitas dan inovasi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Program Penumbuhan Iklim Inovatif, Forum Kreativitas Warga, dan Sistem Apresiasi (Reward System).",
      "POS/SOP Pengelolaan Forum Inovasi, Penampungan/Seleksi Gagasan Kreatif, dan Pemberian Penghargaan Karya Inovasi.",
      "Dokumen Program Kerja Penumbuhan Iklim Kreatif & Inovatif (brainstorming rutin, ekspo karya inovasi, ruang ekspresi akademik).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi/insentif program apresiasi dan wadah kreativitas dalam RKT/e-RKAM.",
      "Bukti fisik pelaksanaan forum gagasan/kreativitas (Surat Undangan, Daftar Hadir, Rekapitulasi Usulan/Ide, Notula, Foto).",
      "Piagam/Sertifikat dan Dokumen Penyerahan Penghargaan (Reward) bagi Guru, Staf, atau Siswa Pencipta Karya Kreatif/Inovatif.",
      "Dokumen/laporan evaluasi dan analisis hasil survei/pemetaan iklim kerja dan belajar yang mendorong kreativitas berkala.",
      "Dokumen/laporan analisis dampak penumbuhan iklim kreatif terhadap peningkatan jumlah produk/karya inovatif dan prestasi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa peningkatan dana apresiasi, perluasan akses sarana, atau pembaruan pembinaan."
    ],
    pics: ["bekti-sugiarsih", "mujiati"],
    rawKeterangan: "Bekti Sugiarsih; Mujiati"
  },
  {
    id: "k3-4",
    componentId: 3,
    no: 4,
    unsurTugas: "Menciptakan inovasi yang bermanfaat dan tepat bagi pengembangan madrasah.",
    indikatorKinerja: "Mendorong warga madrasah untuk melakukan prakarsa/keberanian moral untuk melakukan hal-hal baru.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pendampingan/Inkubasi Prakarsa Baru dan Pedoman Penjaminan Dukungan Inovasi Warga Madrasah.",
      "POS/SOP Pengusulan, Penilaian Risiko, Pendampingan, dan Pelaksanaan Prakarsa/Hal Baru.",
      "Dokumen Program Pembinaan Prakarsa dan Inisiasi Terobosan Baru (pilot project, pendampingan legal/akademik, skema insentif).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi/inkubasi pelaksanaan prakarsa baru dalam RKT/e-RKAM.",
      "Berkas pelaksanaan prakarsa (Surat Izin/Disposisi Pilot Project, Analisis Risiko, Foto, Notula Pendampingan, Jurnal Uji Coba).",
      "Dokumen Laporan Keterlaksanaan dan Monitoring Program Prakarsa Baru secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat keberhasilan serta hambatan pelaksanaan prakarsa baru berkala.",
      "Dokumen/laporan analisis dampak keberanian moral/prakarsa warga madrasah terhadap peningkatan mutu layanan dan prestasi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa penguatan perlindungan inovasi, perluasan dana inkubasi, atau pelembagaan SOP baru."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k3-5",
    componentId: 3,
    no: 5,
    unsurTugas: "Bekerja keras untuk mencapai keberhasilan madrasah sebagai organisasi pembelajaran yang efektif.",
    indikatorKinerja: "Mampu bertindak kreatif dan inovatif dalam melaksanakan pekerjaan melalui cara berpikir dan cara bertindak.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Pola Kerja Inovatif, Tim Pengembang Learning Organization, dan Kerangka Kerja Kreatif.",
      "POS/SOP Implementasi Pola Kerja Kreatif dan Inovatif dalam Pelaksanaan Tugas Manajemen Madrasah.",
      "Dokumen Portofolio Karya/Terobosan Inovatif Kepala Madrasah (deskripsi cara berpikir baru, pola tindakan/solusi kreatif, efisiensi kerja).",
      "Dokumen Rencana Anggaran Biaya (RAB) dukungan riset/pengembangan cara kerja inovatif dalam RKT/e-RKAM.",
      "Berkas bukti fisik penerapan cara berpikir dan bertindak kreatif (Jurnal Inovasi, analisis efisiensi kerja, foto/video, produk/aplikasi).",
      "Dokumen Laporan Keterlaksanaan Budaya Kerja Kreatif dan Inovatif secara berkala.",
      "Dokumen/laporan evaluasi dan analisis tingkat efektivitas serta efisiensi penerapan pola kerja kreatif dan inovatif berkala.",
      "Dokumen/laporan analisis dampak (impact analysis) tindakan kreatif-inovatif terhadap produktivitas dan target organisasi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pelembagaan metode kerja baru, penguatan kapasitas berpikir kritis, atau replikasi inovasi."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k3-6",
    componentId: 3,
    no: 6,
    unsurTugas: "Bekerja keras untuk mencapai keberhasilan madrasah sebagai organisasi pembelajaran yang efektif.",
    indikatorKinerja: "Mampu memberdayakan potensi madrasah secara optimal kedalam berbagai kegiatan-kegiatan produktif yang menguntungkan madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengembang/Pengelola Potensi Madrasah dan Kegiatan Produktif beserta rincian tugas.",
      "POS/SOP Pengelolaan dan Pemberdayaan Potensi/Aset Madrasah serta SOP Pengelolaan Hasil Kegiatan Produktif.",
      "Dokumen Pemetaan dan Analisis Kelayakan Potensi Madrasah (Aset, SDM, Sarpras, Kemitraan) untuk Kegiatan Produktif.",
      "Dokumen Rencana Kerja/Bisnis (Action/Business Plan) Kegiatan Produktif Madrasah yang terintegrasi dalam RKT/e-RKAM.",
      "Berkas Pelaksanaan dan Pembukuan Kegiatan Produktif (Buku Kas, laporan arus kas, MoU penggunaan fasilitas, foto, bukti karya/jasa).",
      "Laporan Pertanggungjawaban (LPJ) Kinerja dan Keuangan Kegiatan Produktif secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis efektivitas serta rasio kontribusi kegiatan produktif terhadap pengembangan madrasah berkala.",
      "Dokumen/laporan analisis dampak pemberdayaan potensi terhadap peningkatan kesejahteraan dan kemandirian finansial madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa diversifikasi unit produktif baru, pembaruan strategi pemasaran, atau optimalisasi aset."
    ],
    pics: ["sarirotul-ulum"],
    rawKeterangan: "Sarirotul Ulum"
  },
  {
    id: "k3-7",
    componentId: 3,
    no: 7,
    unsurTugas: "Bekerja keras untuk mencapai keberhasilan madrasah sebagai organisasi pembelajaran yang efektif.",
    indikatorKinerja: "Mampu menumbuhkan jiwa kewirausahaan (kreatif, inovatif, dan produktif) di kalangan warga madrasah.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengembang Kewirausahaan Madrasah, Program Wirausaha, dan Tim Inkubator Bisnis/Kreatif.",
      "POS/SOP Pelaksanaan Pembinaan Kewirausahaan, Penyelenggaraan Expo/Bazar Karya, dan Pengelolaan Unit Produksi/Kreatif.",
      "Dokumen Program Kerja Kewirausahaan Madrasah (modul projek P5RA, pelatihan entrepreneurship, pendampingan produk kreatif).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi program kewirausahaan warga madrasah dalam RKT/e-RKAM.",
      "Berkas Pembinaan dan Karya Kewirausahaan Lengkap (Laporan Expo, katalog produk inovatif/kreatif, sertifikat pelatihan, foto/video).",
      "Laporan Pertanggungjawaban (LPJ) Keterlaksanaan Program Penumbuhan Jiwa Kewirausahaan secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat efektivitas serta partisipasi warga madrasah dalam program kewirausahaan berkala.",
      "Dokumen/laporan analisis dampak (impact analysis) penumbuhan jiwa kewirausahaan terhadap prestasi dan kemandirian.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa komersialisasi/pemasaran produk, pendaftaran hak cipta/merek, atau perluasan kemitraan."
    ],
    pics: ["sarirotul-ulum", "mujiati"],
    rawKeterangan: "Sarirotul Ulum; Mujiati"
  },
  {
    id: "k3-8",
    componentId: 3,
    no: 8,
    unsurTugas: "Bekerja keras untuk mencapai keberhasilan madrasah sebagai organisasi pembelajaran yang efektif.",
    indikatorKinerja: "Mampu mencatat ide-ide baru, kemudian mengembangkannya.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengelola Bank Ide dan Inovasi Madrasah beserta rincian tugas (job description).",
      "POS/SOP Inventarisasi, Pencatatan, Pengkajian, dan Pengembangan Ide Baru.",
      "Dokumen Bank Ide / Jurnal Gagasan Inovatif Madrasah (buku pencatatan fisik atau repositori digital penampung ide).",
      "Dokumen Analisis Kelayakan dan Pengkajian Ide (Feasibility Study) serta Peta Jalan (Roadmap) Pengembangan Ide menjadi Program.",
      "Dokumen Rencana Anggaran Biaya (RAB) riset/pengembangan ide dalam RKT/e-RKAM.",
      "Berkas Proses Pengembangan Ide (Surat Undangan Review Ide, Daftar Hadir, Notula Rapat Pengkajian, Berita Acara Penetapan Ide).",
      "Dokumen/laporan evaluasi dan analisis tingkat keterterapan serta rasio konversi ide menjadi program/produk nyata berkala.",
      "Dokumen/laporan analisis dampak (impact analysis) pengembangan ide-ide baru terhadap peningkatan efektivitas madrasah.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan sistem pencatatan ide, peningkatan alokasi dana, atau replikasi ide."
    ],
    pics: ["ilmiyatus-saadah", "harits-al-anshori"],
    rawKeterangan: "Ilmiyatus Sa'adah; Harits Al Anshori"
  },
  {
    id: "k3-9",
    componentId: 3,
    no: 9,
    unsurTugas: "Memiliki motivasi yang kuat untuk sukses dalam melaksanakan tugas pokok dan fungsinya sebagai pemimpin madrasah.",
    indikatorKinerja: "Bersedia belajar dari orang lain.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim/Program Belajar Berkelanjutan, Studi Tiru, dan Diseminasi Hasil Belajar Kepemimpinan.",
      "POS/SOP Pelaksanaan Studi Tiru, Keikutsertaan Pelatihan/Forum Kepemimpinan, dan Diseminasi/Pengimbasan Hasil Belajar.",
      "Dokumen Program Pembelajaran Kepemimpinan Kepala Madrasah (agenda studi tiru, coaching pengawas, KKMA/MKKS, kemitraan).",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi kegiatan belajar/studi tiru/pelatihan dalam RKT/e-RKAM.",
      "Berkas Bukti Keikutsertaan dan Hasil Belajar Lengkap (Sertifikat/STTPL, Surat Tugas, Laporan Studi Tiru, Notula/Foto Diseminasi).",
      "Dokumen Laporan Pelaksanaan Program Belajar dari Orang Lain secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat keterterapan serta efektivitas praktik baik (best practices) dari pihak luar.",
      "Dokumen/laporan analisis dampak (impact analysis) peningkatan kapasitas kepemimpinan terhadap perbaikan mutu layanan.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa adopsi/adaptasi praktik baik lanjutan, perluasan jejaring belajar, atau pengimbasan."
    ],
    pics: ["is-roviqoh-indayati"],
    rawKeterangan: "Is Roviqoh Indayati"
  },
  {
    id: "k3-10",
    componentId: 3,
    no: 10,
    unsurTugas: "Memiliki motivasi yang kuat untuk sukses dalam melaksanakan tugas pokok dan fungsinya sebagai pemimpin madrasah.",
    indikatorKinerja: "Ingin selalu melakukan yang terbaik.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Target Kinerja Unggul, Tim Penjaminan Mutu Internal (TPMI), dan Standar Keunggulan Layanan.",
      "POS/SOP Penjaminan Mutu Internal, Penetapan Target Kinerja Unggul, dan Evaluasi Capaian Mutu Kelembagaan.",
      "Dokumen Sasaran Mutu / Kontrak Kinerja Pimpinan dan Unit Kerja (indikator keunggulan layanan, target di atas standar minimal).",
      "Dokumen Rencana Anggaran Biaya (RAB) dukungan pencapaian kinerja unggul dan penjaminan mutu dalam RKT/e-RKAM.",
      "Berkas Bukti Pencapaian Kinerja Unggul Lengkap (Laporan Sasaran Mutu, Piagam/Sertifikat Akreditasi Unggul, Notula RTM).",
      "Dokumen Laporan Evaluation & Benchmarking Capaian Kinerja Unggul Madrasah secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat ketercapaian target mutu unggul yang melampaui Standar Nasional Pendidikan (SNP).",
      "Dokumen/laporan analisis kesenjangan (gap analysis) capaian mutu saat ini terhadap standar mutu tertinggi (best practices).",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pembaruan/peningkatan target sasaran mutu (raising the bar) dan perbaikan alur kerja."
    ],
    pics: ["tata-usaha"],
    rawKeterangan: "Tata Usaha / Administrator"
  },
  {
    id: "k3-11",
    componentId: 3,
    no: 11,
    unsurTugas: "Memiliki motivasi yang kuat untuk sukses dalam melaksanakan tugas pokok dan fungsinya sebagai pemimpin madrasah.",
    indikatorKinerja: "Menciptakan perubahan yang kuat.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Pengembang Transformasi/Perubahan Madrasah beserta rincian tugas (job description).",
      "POS/SOP Pengelolaan Program Perubahan, Transformasi Layanan, dan Manajemen Risiko Perubahan.",
      "Dokumen Peta Jalan (Roadmap) dan Naskah Strategi Perubahan Madrasah (analisis EDM, visi perubahan, sasaran strategis).",
      "Dokumen Rencana Anggaran Biaya (RAB) dukungan pelaksanaan program-program perubahan strategis dalam RKT/e-RKAM.",
      "Berkas Bukti Pelaksanaan Perubahan Lengkap (Surat Sosialisasi, Daftar Hadir, Notula Rapat, Foto/Video, Instrumen Pemantauan).",
      "Laporan Keterlaksanaan dan Capaian Program Perubahan Madrasah secara berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis tingkat ketercapaian dan efektivitas pelaksanaan program perubahan berkala.",
      "Dokumen/laporan analisis dampak (impact analysis) perubahan terhadap peningkatan mutu lulusan, efisiensi tata kelola, dan reputasi.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa pelembagaan (institutionalization) hasil perubahan menjadi standar operasional baru."
    ],
    pics: ["moh-umar-jaelani", "mujiati"],
    rawKeterangan: "Moh. Umar Jaelani; Mujiati"
  },
  {
    id: "k3-12",
    componentId: 3,
    no: 12,
    unsurTugas: "Pantang menyerah dan selalu mencari solusi terbaik dalam menghadapi kendala yang dihadapi madrasah.",
    indikatorKinerja: "Mampu melibatkan tokoh agama, masyarakat, dan pemerintah dalam memecahkan masalah kelembagaan.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Komunikasi Publik, Humas, dan Forum Lintas Sektor/Tokoh Pemecahan Masalah Kelembagaan.",
      "POS/SOP Pelibatan Tokoh Agama, Masyarakat, dan Pemerintah dalam Pemecahan Masalah Kelembagaan.",
      "Dokumen Pemetaan Pemangku Kepentingan (Stakeholder Mapping) dan Matriks Isu/Masalah Kelembagaan beserta Strategi Pelibatannya.",
      "Dokumen Naskah Kerja Sama (MoU/PKS) dengan tokoh agama/lembaga keagamaan, ormas, dan instansi pemerintah setempat.",
      "Dokumen Rencana Anggaran Biaya (RAB) fasilitasi forum dialog/konsultasi publik dalam RKT/e-RKAM.",
      "Berkas Pelaksanaan Dialog/Penyelesaian Masalah Lengkap (Surat Undangan, Daftar Hadir, Notula Rapat, Berita Acara, Foto/Video).",
      "Laporan Keterlaksanaan Program Pelibatan Tokoh dan Pemerintah dalam Pemecahan Masalah Kelembagaan berkala per semester.",
      "Dokumen/laporan evaluasi dan analisis efektivitas serta partisipasi tokoh agama, masyarakat, dan pemerintah berkala.",
      "Dokumen Rencana Tindak Lanjut (RTL) berupa perluasan jejaring tokoh/instansi, penguatan komitmen, atau mitigasi masalah."
    ],
    pics: ["is-roviqoh-indayati", "mujiati"],
    rawKeterangan: "Is Roviqoh Indayati; Mujiati"
  }
];
var INDICATORS_K4 = [
  {
    id: "k4-1",
    componentId: 4,
    no: 1,
    unsurTugas: "Menyusun program supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Mengidentifikasi masalah yang guru hadapi dalam pelaksanaan pembelajaran.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Supervisi Akademik Madrasah dilengkapi POS/SOP Identifikasi Masalah Kebutuhan Supervisi.",
      "Dokumen instrumen terstandar/kuesioner asesmen diagnostik kebutuhan supervisi guru (perencanaan, pedagogik, TIK, diferensiasi, asesmen).",
      "Berkas instrumen identifikasi masalah yang telah diisi lengkap oleh seluruh guru madrasah (cakupan 75% - 100%).",
      "Matriks/Tabel rekapitulasi dan tabulasi pemetaan profil masalah pembelajaran guru per mata pelajaran dan per fase/jenjang.",
      "Berkas administratif pelaksanaan identifikasi: Surat undangan kegiatan, daftar hadir guru, notula pertemuan, dan foto dokumentasi.",
      "Lembar pengesahan hasil rekapitulasi identifikasi masalah pembelajaran yang ditandatangani oleh Kepala Madrasah.",
      "Berita acara, notula, dan foto/video kegiatan FGD/Pre-Conference analisis akar masalah pembelajaran bersama tim supervisi & Pengawas.",
      "Dokumen Rencana Tindak Lanjut (RTL) supervisi akademik yang memuat target capaian perbaikan mutu pembelajaran guru spesifik."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani"
  },
  {
    id: "k4-2",
    componentId: 4,
    no: 2,
    unsurTugas: "Menyusun program supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Mampu merumuskan tujuan yang dilengkapi dengan target pencapaian yang terukur.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Pemberlakuan Program Supervisi Akademik Tahunan dilengkapi lembar pengesahan resmi (Kamad & Pengawas).",
      "Dokumen Program Supervisi Akademik Tahunan (Bab I & II) memuat tujuan umum, khusus, dan Matriks KPI Supervisi (baseline, target, deadline).",
      "Matriks/Tabel Target Pencapaian Supervisi per aspek kompetensi (perencanaan, KBM aktif/TIK, dan evaluasi/asesmen).",
      "Dokumen instrumen supervisi terstandar yang memuat rubrik penskoran terukur (skala penilaian objektif).",
      "Bukti sosialisasi tujuan dan target supervisi kepada guru: Surat undangan rapat kerja, daftar hadir, notula, dan foto dokumentasi.",
      "Matriks Target Kinerja Supervisi Individual Guru (target spesifik per guru yang disesuaikan dengan hasil supervisi klinis sebelumnya).",
      "Dokumen integrasi anggaran pembinaan target kompetensi guru yang belum tercapai ke dalam Rencana Kerja dan Anggaran (e-RKAM).",
      "Lembar reviu, telaah kritis, dan validasi rumusan target kinerja supervisi oleh Pengawas Madrasah Pembina."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; TUM / Administrator"
  },
  {
    id: "k4-3",
    componentId: 4,
    no: 3,
    unsurTugas: "Menyusun program supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Mampu mengembangkan instrumen supervisi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Supervisi Akademik Madrasah dilengkapi POS/SOP Identifikasi Masalah dan Kebutuhan Supervisi.",
      "Dokumen instrumen terstandar (Telaah Modul Ajar, Observasi KBM Kelas, Asesmen Pembelajaran, Lembar Wawancara Pra & Pasca Observasi).",
      "Berkas instrumen identifikasi masalah yang telah diisi lengkap oleh seluruh guru madrasah (cakupan 75% - 100%).",
      "Matriks/Tabel rekapitulasi dan tabulasi pemetaan profil masalah pembelajaran guru per mata pelajaran dan per fase/jenjang.",
      "Format/Tautan Instrumen Berbasis Digital (tangkapan layar e-supervisi, formulir daring, atau aplikasi seluler).",
      "Panduan Teknis Pengolahan Skor & Rekomendasi (formula konversi skor mentah menjadi predikat kinerja guru beserta format pemetaan).",
      "Lembar Validasi & Telaah Instrumen yang ditandatangani resmi oleh Pengawas Madrasah Pembina / Pengembang Kurikulum.",
      "Dokumen Berita Acara evaluasi dan reviu berkala instrumen supervisi (bukti penyempurnaan/pemutakhiran instrumen dari hasil evaluasi)."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; TUM / Administrator"
  },
  {
    id: "k4-4",
    componentId: 4,
    no: 4,
    unsurTugas: "Melaksanakan supervisi akademik terhadap guru dengan menggunakan pendekatan dan teknik supervisi yang tepat.",
    indikatorKinerja: "Mengadakan pertemuan awal untuk menjaring data rencana pembelajaran dan menetapkan fokus kegiatan supervisi.",
    buktiFisik: [
      "Surat edaran/jadwal resmi pelaksanaan pertemuan awal pra-observasi supervisi akademik.",
      "Dokumen Instrumen/Lembar Catatan Pertemuan Pra-Observasi Lengkap (tujuan, area pengembangan, strategi amatan, fokus amatan).",
      "Instrumen Telaah Modul Ajar/RPP yang telah diisi, diberi catatan telaah konstruktif, dan ditandatangani bersama Kamad dan Guru.",
      "Berkas administratif pendukung: Daftar hadir pertemuan pra-observasi, notula dialog awal, dan foto dokumentasi wawancara.",
      "Instrumen Lembar Wawancara Pra-Observasi Berbasis Coaching (pertanyaan pemantik reflektif, identifikasi tantangan riil, target mandiri).",
      "Rubrik/Lembar Kesepakatan Fokus Observasi Spesifik (Focus of Observation Protocol) memuat indikator perilaku terukur.",
      "Dokumen Lembar Evaluasi Diri Guru (Teacher Self-Assessment Sheet) sebelum pelaksanaan observasi yang ditelaah bersama."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; TUM / Administrator"
  },
  {
    id: "k4-5",
    componentId: 4,
    no: 5,
    unsurTugas: "Melaksanakan supervisi akademik terhadap guru dengan menggunakan pendekatan dan teknik supervisi yang tepat.",
    indikatorKinerja: "Melaksanakan kegiatan pemantauan pembelajaran dan membuat catatan yang objektif dan selektif sebagai bahan pemecahan masalah supervisi.",
    buktiFisik: [
      "Jadwal resmi dan surat tugas pemantauan pembelajaran/supervisi kelas bagi seluruh guru madrasah.",
      "Paket Berkas Instrumen Observasi Pembelajaran Lengkap (terisi 75% - 100% guru) memuat ceklis KBM, Field Notes faktual, & Catatan Selektif.",
      "Tanda tangan pengesahan bersama antara Kepala Madrasah dan Guru pada lembar instrumen dan catatan hasil amatan.",
      "Foto dokumentasi kegiatan pemantauan pembelajaran langsung di ruang kelas.",
      "Dokumen Lembar Analisis Kesenjangan & Identifikasi Masalah Pembelajaran (komparasi modul ajar vs realita kelas untuk post-conference).",
      "Bukti arsip digital pemantauan pembelajaran (tautan drive e-supervisi, dokumentasi video/audio mikro-pembelajaran berizin etis)."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; TUM / Administrator"
  },
  {
    id: "k4-6",
    componentId: 4,
    no: 6,
    unsurTugas: "Melaksanakan supervisi akademik terhadap guru dengan menggunakan pendekatan dan teknik supervisi yang tepat.",
    indikatorKinerja: "Melakukan pertemuan refleksi, menganalisis catatan hasil observasi, dan menyimpulkan hasil observasi.",
    buktiFisik: [
      "Jadwal resmi dan surat undangan pelaksanaan pertemuan refleksi pasca-observasi (post-conference).",
      "Dokumen Instrumen Lembar Wawancara Refleksi & Umpan Balik Pasca-Observasi Lengkap (tanggapan guru, catatan pengamat, analisis field notes).",
      "Dokumen Lembar Kesimpulan Hasil Observasi Pembelajaran (pencapaian target KBM, kekuatan guru, area perbaikan, skor, rekomendasi).",
      "Bukti legalitas dokumen: Tanda tangan pengesahan bersama antara Kepala Madrasah dan Guru pada lembar refleksi & kesimpulan.",
      "Berkas administratif pendukung: Daftar hadir pertemuan pasca-observasi, notula dialog refleksi, dan foto dokumentasi kegiatan.",
      "Instrumen Percakapan Refleksi Pasca-Observasi Berbasis Pendekatan Coaching (pertanyaan pemantik kesadaran diri, solusi mandiri, komitmen).",
      "Dokumen Lembar Kesepakatan Rencana Aksi Pengembangan Diri (Individual Development Plan / Action Plan) memuat target & strategi."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; TUM / Administrator"
  },
  {
    id: "k4-7",
    componentId: 4,
    no: 7,
    unsurTugas: "Melaksanakan supervisi akademik terhadap guru dengan menggunakan pendekatan dan teknik supervisi yang tepat.",
    indikatorKinerja: "Bersama guru menyusun rekomendasi tindak lanjut perbaikan dalam bentuk kegiatan analisis butir soal, remedial, dan pengayaan.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan SOP Analisis Hasil Evaluasi Belajar, Pelaksanaan Pembelajaran Remedial, dan Program Pengayaan.",
      "Dokumen Lembar Kesepakatan Rekomendasi Tindak Lanjut Supervisi Asesmen yang ditandatangani bersama Kamad dan Guru.",
      "Berkas Portofolio Analisis Butir Soal Guru: Lembar telaah butir soal (tingkat kesukaran, daya pembeda, keberfungsian distraktor).",
      "Berkas Dokumen Program Pembelajaran Remedial: Rencana perlakuan, daftar nama siswa, indikator belum tuntas, jadwal, daftar nilai.",
      "Berkas Dokumen Program Pengayaan: Desain materi pendalaman/soal tantangan penalaran dan portofolio hasil tugas pengayaan siswa.",
      "Berkas administratif pendukung: Surat undangan/jadwal klinik konsultasi asesmen, daftar hadir penyusunan tindak lanjut, notula, foto.",
      "Dokumen RTL Tingkat Madrasah: Perencanaan workshop/pelatihan peningkatan kompetensi guru dalam penulisan kisi-kisi dan soal dibiayai e-RKAM."
    ],
    pics: ["ahmad-syaikhu", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; TUM / Administrator"
  },
  {
    id: "k4-8",
    componentId: 4,
    no: 8,
    unsurTugas: "Menilai dan menindaklanjuti kegiatan supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Memfasilitasi guru dalam merencanakan tindak lanjut perbaikan sistem penilaian hasil belajar.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Fasilitasi dan Pengembang Penilaian/Asesmen Madrasah dilengkapi POS/SOP Perbaikan Sistem Penilaian.",
      "Dokumen Panduan Teknis Asesmen Madrasah (juknis diagnostik, formatif, sumatif, rubrik autentik, penentuan KKTP).",
      "Berkas Dokumen Fasilitasi Madrasah: Surat undangan, panduan kegiatan, jadwal IHT/workshop penilaian, daftar hadir, notula, materi, foto.",
      "Dokumen Berkas Portofolio Rencana Tindak Lanjut (RTL) Perbaikan Asesmen Guru Lengkap (75%-100% guru): Kisi-kisi, kartu soal, rubrik.",
      "Lembar verifikasi dan pengesahan dokumen RTL sistem penilaian yang ditandatangani oleh Guru dan Kepala Madrasah.",
      "Dokumen Alokasi Anggaran Fasilitasi Penilaian dalam RKT dan e-RKAM (server CBT, aplikasi penilaian digital, workshop asesmen)."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani; TUM / Administrator"
  },
  {
    id: "k4-9",
    componentId: 4,
    no: 9,
    unsurTugas: "Menilai dan menindaklanjuti kegiatan supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Mengecek ulang keterlaksanaan rekomendasi oleh guru.",
    buktiFisik: [
      "Jadwal resmi dan surat tugas pelaksanaan kegiatan pengecekan ulang/verifikasi keterlaksanaan rekomendasi supervisi akademik.",
      "Dokumen Instrumen Lembar Verifikasi Tindak Lanjut Rekomendasi Supervisi Lengkap (rincian rekomendasi, tindakan perbaikan, bukti fisik, status).",
      "Matriks Rekapitulasi Status Keterlaksanaan Rekomendasi Supervisi seluruh guru madrasah per mata pelajaran/fase.",
      "Berkas portofolio bukti otentik perbaikan dari guru (modul ajar revisi, kisi-kisi/soal baru, media peraga) divalidasi Kamad.",
      "Berkas administratif pendukung: Daftar hadir sesi pemeriksaan tindak lanjut, notula konsultasi perbaikan, dan foto dokumentasi.",
      "Dokumen Pemetaan Rekomendasi Kebijakan Lanjutan: Daftar guru tuntas (sertifikat apresiasi/reward) & daftar guru pelatihan PKB lanjutan."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani; TUM / Administrator"
  },
  {
    id: "k4-10",
    componentId: 4,
    no: 10,
    unsurTugas: "Menilai dan menindaklanjuti kegiatan supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Melaksanakan pembinaan dan pengembangan guru sebagai tindak lanjut kegiatan supervisi.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Tim Fasilitasi Pengembangan Keprofesian Berkelanjutan (PKB) dan Pembinaan Guru dilengkapi POS/SOP.",
      "Dokumen Program Pembinaan dan Pengembangan Guru Berbasis Hasil Supervisi (pemetaan kendala, target, intervensi, narasumber, jadwal).",
      "Berkas Portofolio Pembinaan Individual: Lembar catatan bimbingan teknis perseorangan/supervisi klinis ditandatangani Kamad & Guru.",
      "Berkas Portofolio Pembinaan Kelompok (IHT/Workshop/MGMP Internal): Surat tugas, daftar hadir, notula/laporan, modul/materi, foto.",
      "Dokumen alokasi anggaran fasilitasi kegiatan pembinaan guru dalam Rencana Kerja Tahunan (RKT) dan e-RKAM madrasah.",
      "Laporan berkala pelaksanaan pembinaan dan pengembangan guru yang disahkan oleh Kepala Madrasah.",
      "Dokumen Kebijakan Apresiasi Guru Berprestasi (Reward System): Piagam penghargaan madrasah, rekomendasi kenaikan jenjang, insentif.",
      "Lembar telaah, reviu berkala, dan pengesahan laporan pembinaan guru yang ditandatangani resmi oleh Pengawas Madrasah Pembina."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani; TUM / Administrator"
  },
  {
    id: "k4-11",
    componentId: 4,
    no: 11,
    unsurTugas: "Menilai dan menindaklanjuti kegiatan supervisi akademik dalam rangka peningkatan profesionalisme guru.",
    indikatorKinerja: "Menggunakan data hasil supervisi untuk pemetaan ketercapaian program sebagai dasar perbaikan siklus berikutnya.",
    buktiFisik: [
      "SK Kepala Madrasah tentang Penetapan Laporan Hasil Evaluasi dan Pemetaan Ketercapaian Program Supervisi Akademik Tahunan.",
      "Dokumen Laporan Evaluasi Keterlaksanaan Program Supervisi Akademik (rekapitulasi 75%-100% guru, target vs realisasi, faktor pendukung/penghambat).",
      "Matriks Profil Pemetaan Mutu Pembelajaran & Kompetensi Guru Tingkat Madrasah (klasifikasi guru berdasarkan pedagogik, kurikulum, asesmen).",
      "Dokumen Program Supervisi Akademik Siklus/Tahun Berikutnya yang memuat penyesuaian target terukur, jadwal, dan fokus amatan baru.",
      "Berkas administratif pendukung: Surat undangan rapat evaluasi akhir supervisi, daftar hadir dewan guru, notula, foto dokumentasi.",
      "Dokumen Laporan Analisis Tren Mutu Supervisi Lintas Periode (Longitudinal Trend Analysis Report) dengan grafik perkembangan.",
      "Dasbor Digital / Visualisasi Infografis Pemetaan Supervisi (tangkapan layar portal e-supervisi/pangkalan data digital madrasah).",
      "Dokumen Matriks Penyelarasan Hasil Supervisi dengan Perencanaan Madrasah (bukti rekomendasi supervisi diserap EDM, RKT, e-RKAM).",
      "Dokumen Inovasi Program Supervisi Akademik Siklus Baru yang memuat diferensiasi pendekatan pembinaan (akselerasi mahir, klinik, pamong)."
    ],
    pics: ["ahmad-syaikhu", "moh-umar-jaelani", "tata-usaha"],
    rawKeterangan: "Ahmad Syaikhu; Moh. Umar Jaelani; TUM / Administrator"
  }
];

// src/data/pkkmData.ts
var ALL_INDICATORS = [
  ...INDICATORS_K1,
  ...INDICATORS_K2,
  ...INDICATORS_K3,
  ...INDICATORS_K4
];

// serverApp.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var IS_VERCEL = Boolean(process.env.VERCEL || process.env.NOW_REGION);
var DATA_DIR = IS_VERCEL ? "/tmp/pkkm-data" : path.resolve(process.cwd(), "data");
var STATE_FILE = path.join(DATA_DIR, "pkkm_state.json");
var AUTH_SECRET_FILE = path.join(DATA_DIR, ".auth-secret");
var PHP_DEPLOY_DIR = fs.existsSync(path.resolve(process.cwd(), "php-vercel-deploy")) ? path.resolve(process.cwd(), "php-vercel-deploy") : path.resolve(__dirname, "php-vercel-deploy");
var ADMIN_USERNAME = "admin";
var ADMIN_PASS_HASH = crypto.createHash("sha256").update("admin123").digest();
function getAuthSecret() {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) {
    return process.env.AUTH_SECRET;
  }
  if (IS_VERCEL) {
    return crypto.createHash("sha256").update(`sip-pkkm-2026-almaarif06-${process.env.VERCEL_PROJECT_ID || "vercel-secret"}`).digest("hex");
  }
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(AUTH_SECRET_FILE)) {
      const existing = fs.readFileSync(AUTH_SECRET_FILE, "utf8").trim();
      if (existing.length >= 32) return existing;
    }
    const secret = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(AUTH_SECRET_FILE, secret, "utf8");
    return secret;
  } catch {
    return "sip-pkkm-2026-almaarif06-fallback-hmac-secret-key";
  }
}
function signSessionToken(username) {
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + 1e3 * 60 * 60 * 24 * 7
    })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded.u || !decoded.exp || Date.now() > decoded.exp) return null;
    return { username: decoded.u };
  } catch {
    return null;
  }
}
function sqlEscape(str) {
  return "'" + str.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}
function ensurePhpSeedSql() {
  if (IS_VERCEL) return;
  try {
    const seedPath = path.join(PHP_DEPLOY_DIR, "database", "seed.sql");
    const lines = [
      "-- Data Seed Lengkap SIP-PKKM 2026 MIS ALMAARIF 06 TOYOMARTO",
      "-- Berisi 12 PIC, 4 Komponen, 89 Butir Indikator, dan seluruh sub-item Bukti Fisik Level 4",
      "USE `pkkm_almaarif06`;",
      "",
      "SET FOREIGN_KEY_CHECKS = 0;",
      "TRUNCATE TABLE `notification_reads`;",
      "TRUNCATE TABLE `notifications`;",
      "TRUNCATE TABLE `indicator_pics`;",
      "TRUNCATE TABLE `bukti_fisik_items`;",
      "TRUNCATE TABLE `indicators`;",
      "TRUNCATE TABLE `components`;",
      "TRUNCATE TABLE `users`;",
      "SET FOREIGN_KEY_CHECKS = 1;",
      ""
    ];
    for (const u of PIC_USERS) {
      lines.push(
        `INSERT INTO \`users\` (\`id\`, \`name\`, \`role\`, \`initials\`, \`is_admin\`) VALUES (${sqlEscape(u.id)}, ${sqlEscape(u.name)}, ${sqlEscape(u.role)}, ${sqlEscape(u.initials)}, ${u.isAdmin ? 1 : 0});`
      );
    }
    lines.push("");
    for (const c of COMPONENTS_META) {
      lines.push(
        `INSERT INTO \`components\` (\`id\`, \`code\`, \`title\`, \`short_title\`, \`category\`, \`total_indicators\`, \`max_score\`, \`description\`) VALUES (${c.id}, ${sqlEscape(c.code)}, ${sqlEscape(c.title)}, ${sqlEscape(c.shortTitle)}, ${sqlEscape(c.category)}, ${c.totalIndicators}, ${c.maxScore}, ${sqlEscape(c.description)});`
      );
    }
    lines.push("");
    for (const ind of ALL_INDICATORS) {
      lines.push(
        `INSERT INTO \`indicators\` (\`id\`, \`component_id\`, \`no\`, \`unsur_tugas\`, \`indikator_kinerja\`, \`raw_keterangan\`, \`status\`, \`lokasi_berkas\`) VALUES (${sqlEscape(ind.id)}, ${ind.componentId}, ${ind.no}, ${sqlEscape(ind.unsurTugas)}, ${sqlEscape(ind.indikatorKinerja)}, ${sqlEscape(ind.rawKeterangan)}, 'belum', '');`
      );
      ind.buktiFisik.forEach((desc, idx) => {
        lines.push(
          `INSERT INTO \`bukti_fisik_items\` (\`indicator_id\`, \`item_order\`, \`description\`, \`is_checked\`) VALUES (${sqlEscape(ind.id)}, ${idx + 1}, ${sqlEscape(desc)}, 0);`
        );
      });
      for (const picId of ind.pics) {
        lines.push(
          `INSERT INTO \`indicator_pics\` (\`indicator_id\`, \`user_id\`) VALUES (${sqlEscape(ind.id)}, ${sqlEscape(picId)});`
        );
      }
    }
    fs.mkdirSync(path.dirname(seedPath), { recursive: true });
    fs.writeFileSync(seedPath, lines.join("\n") + "\n", "utf8");
  } catch {
  }
}
function createInitialState() {
  const progress = {};
  for (const ind of ALL_INDICATORS) {
    progress[ind.id] = {
      indicatorId: ind.id,
      status: "belum",
      checkedSubItems: [],
      lokasiBerkas: "",
      catatan: "",
      updatedBy: "",
      updatedAt: ""
    };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const initialNotif = {
    id: "notif-init-1",
    actorId: "tata-usaha",
    actorName: "Tata Usaha / Administrator",
    targetUserIds: PIC_USERS.map((u) => u.id),
    indicatorId: "k1-1",
    componentId: 1,
    indicatorNo: 1,
    type: "status_change",
    title: "Instrumen PKKM 2026 Level 4 Siap Diisi",
    message: "89 butir indikator dalam 4 komponen telah dimuat. Setiap pembaruan progres akan mengirimkan notifikasi otomatis kepada pelaksana terkait dan pimpinan.",
    createdAt: now,
    readBy: []
  };
  return {
    progress,
    notifications: [initialNotif],
    emittedMilestones: {}
  };
}
function loadState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STATE_FILE)) {
      const initial = createInitialState();
      fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    for (const ind of ALL_INDICATORS) {
      if (!parsed.progress[ind.id]) {
        parsed.progress[ind.id] = {
          indicatorId: ind.id,
          status: "belum",
          checkedSubItems: [],
          lokasiBerkas: "",
          catatan: "",
          updatedBy: "",
          updatedAt: ""
        };
      }
    }
    if (!parsed.emittedMilestones) parsed.emittedMilestones = {};
    if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
    return parsed;
  } catch {
    return createInitialState();
  }
}
function saveState(state) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${STATE_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tmpFile, STATE_FILE);
  } catch {
  }
}
function collectFilesRecursively(dirPath, baseDir) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const binaryExts = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".ico", ".pdf"]);
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursively(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const isBinary = binaryExts.has(ext);
      results.push({
        path: relPath,
        content: isBinary ? fs.readFileSync(fullPath) : fs.readFileSync(fullPath, "utf8"),
        isBinary
      });
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path));
}
function createApiApp() {
  ensurePhpSeedSql();
  let state = loadState();
  const app2 = express();
  app2.use(express.json({ limit: "4mb" }));
  app2.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const cleanUser = String(username ?? "").trim();
    const passHash = crypto.createHash("sha256").update(String(password ?? "")).digest();
    const userValid = cleanUser === ADMIN_USERNAME;
    const passValid = passHash.length === ADMIN_PASS_HASH.length && crypto.timingSafeEqual(passHash, ADMIN_PASS_HASH);
    if (!userValid || !passValid) {
      res.status(401).json({ error: "Username atau password tidak sesuai." });
      return;
    }
    const token = signSessionToken(cleanUser);
    res.json({
      token,
      user: {
        username: cleanUser,
        name: "Administrator MI Almaarif 06 Toyomarto"
      }
    });
  });
  app2.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : void 0;
    const verified = verifySessionToken(token);
    if (!verified) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      user: {
        username: verified.username,
        name: "Administrator MI Almaarif 06 Toyomarto"
      }
    });
  });
  app2.post("/api/auth/logout", (_req, res) => {
    res.json({ ok: true });
  });
  app2.get("/api/state", (_req, res) => {
    res.json({
      progress: state.progress,
      notifications: state.notifications
    });
  });
  app2.post("/api/state/restore", (req, res) => {
    const { progress, notifications } = req.body ?? {};
    if (progress && typeof progress === "object") {
      for (const ind of ALL_INDICATORS) {
        const incoming = progress[ind.id];
        if (incoming) {
          state.progress[ind.id] = {
            ...state.progress[ind.id],
            ...incoming,
            indicatorId: ind.id
          };
        }
      }
    }
    if (Array.isArray(notifications) && notifications.length > 0) {
      state.notifications = notifications.slice(0, 120);
    }
    saveState(state);
    res.json({
      progress: state.progress,
      notifications: state.notifications
    });
  });
  app2.post("/api/progress/:indicatorId", (req, res) => {
    const { indicatorId } = req.params;
    const indicator = ALL_INDICATORS.find((i) => i.id === indicatorId);
    if (!indicator) {
      res.status(404).json({ error: "Indikator tidak ditemukan" });
      return;
    }
    const {
      status,
      checkedSubItems,
      lokasiBerkas,
      catatan,
      actorId,
      actionType,
      subItemIndex
    } = req.body ?? {};
    const actor = PIC_USERS.find((u) => u.id === actorId) ?? PIC_USERS[1];
    const prev = state.progress[indicatorId];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const nextChecked = Array.isArray(checkedSubItems) ? [...new Set(checkedSubItems)].filter((n) => n >= 0 && n < indicator.buktiFisik.length).sort((a, b) => a - b) : prev.checkedSubItems;
    let nextStatus = status ?? prev.status;
    if (actionType === "subitem_check" && !status) {
      if (nextChecked.length >= indicator.buktiFisik.length && indicator.buktiFisik.length > 0) {
        nextStatus = "disetorkan";
      } else if (nextChecked.length > 0) {
        nextStatus = "proses";
      } else {
        nextStatus = "belum";
      }
    }
    const nextLokasi = typeof lokasiBerkas === "string" ? lokasiBerkas : prev.lokasiBerkas;
    const nextCatatan = typeof catatan === "string" ? catatan : prev.catatan;
    state.progress[indicatorId] = {
      indicatorId,
      status: nextStatus,
      checkedSubItems: nextChecked,
      lokasiBerkas: nextLokasi,
      catatan: nextCatatan,
      updatedBy: actor.id,
      updatedAt: now,
      archived: prev.archived ?? false,
      archivedBy: prev.archivedBy,
      archivedAt: prev.archivedAt
    };
    const targetUsers = Array.from(
      /* @__PURE__ */ new Set([...indicator.pics, "ahmad-syaikhu", "tata-usaha"])
    );
    const statusLabel = nextStatus === "disetorkan" ? "Sudah Disetorkan (Lengkap)" : nextStatus === "proses" ? "Dalam Proses" : "Belum Disetor";
    let notifTitle = `Update K${indicator.componentId} Butir #${indicator.no}`;
    let notifMessage = `${actor.name} memperbarui progres indikator "${indicator.indikatorKinerja.slice(0, 72)}..." \u2192 Status: ${statusLabel}.`;
    if (actionType === "subitem_check" && typeof subItemIndex === "number") {
      const wasChecked = nextChecked.includes(subItemIndex);
      notifTitle = `Bukti Fisik K${indicator.componentId} #${indicator.no} (${nextChecked.length}/${indicator.buktiFisik.length})`;
      notifMessage = `${actor.name} ${wasChecked ? "mencentang/menyetor" : "membatalkan"} berkas #${subItemIndex + 1} \xB7 Status saat ini: ${statusLabel}.`;
    } else if (actionType === "location_update") {
      notifTitle = `Lokasi Berkas K${indicator.componentId} #${indicator.no} Diperbarui`;
      notifMessage = `${actor.name} menyimpan lokasi arsip/tautan berkas: "${nextLokasi || "-"}".`;
    }
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId: actor.id,
      actorName: actor.name,
      targetUserIds: targetUsers,
      indicatorId: indicator.id,
      componentId: indicator.componentId,
      indicatorNo: indicator.no,
      type: actionType ?? "status_change",
      title: notifTitle,
      message: notifMessage,
      createdAt: now,
      readBy: [actor.id]
    };
    state.notifications.unshift(newNotif);
    const compIndicators = ALL_INDICATORS.filter((i) => i.componentId === indicator.componentId);
    const doneCount = compIndicators.filter((i) => state.progress[i.id]?.status === "disetorkan").length;
    const pct = Math.round(doneCount / compIndicators.length * 100);
    const compMeta = COMPONENTS_META.find((c) => c.id === indicator.componentId);
    for (const threshold of [25, 50, 75, 100]) {
      const mKey = `k${indicator.componentId}-${threshold}`;
      if (pct >= threshold && !state.emittedMilestones[mKey]) {
        state.emittedMilestones[mKey] = true;
        const compPics = Array.from(
          new Set(compIndicators.flatMap((i) => i.pics).concat(["ahmad-syaikhu", "tata-usaha"]))
        );
        state.notifications.unshift({
          id: `notif-ms-${mKey}-${Date.now()}`,
          actorId: actor.id,
          actorName: actor.name,
          targetUserIds: compPics,
          indicatorId: indicator.id,
          componentId: indicator.componentId,
          indicatorNo: indicator.no,
          type: "milestone",
          title: `Capaian Komponen ${indicator.componentId} Mencapai ${threshold}%`,
          message: `${compMeta?.title ?? ""} kini telah menyetorkan ${doneCount} dari ${compIndicators.length} indikator (${pct}%).`,
          createdAt: now,
          readBy: []
        });
      }
    }
    state.notifications = state.notifications.slice(0, 120);
    saveState(state);
    res.json({
      progress: state.progress[indicatorId],
      notifications: state.notifications
    });
  });
  app2.post("/api/archive", (req, res) => {
    const { indicatorId, archived, bulkCompleted, actorId } = req.body ?? {};
    const actor = PIC_USERS.find((u) => u.id === actorId) ?? PIC_USERS[1];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (bulkCompleted) {
      const targetIds = ALL_INDICATORS.filter(
        (i) => state.progress[i.id]?.status === "disetorkan" && !state.progress[i.id]?.archived
      ).map((i) => i.id);
      for (const id of targetIds) {
        state.progress[id] = {
          ...state.progress[id],
          archived: true,
          archivedBy: actor.id,
          archivedAt: now
        };
      }
      if (targetIds.length > 0) {
        state.notifications.unshift({
          id: `notif-arch-bulk-${Date.now()}`,
          actorId: actor.id,
          actorName: actor.name,
          targetUserIds: PIC_USERS.map((u) => u.id),
          indicatorId: targetIds[0],
          componentId: 1,
          indicatorNo: 1,
          type: "archive_update",
          title: `${targetIds.length} Indikator Selesai Diarsipkan`,
          message: `${actor.name} memindahkan ${targetIds.length} indikator yang sudah disetorkan ke Area Arsip agar tim fokus pada butir yang belum selesai.`,
          createdAt: now,
          readBy: [actor.id]
        });
      }
      state.notifications = state.notifications.slice(0, 120);
      saveState(state);
      res.json({
        archivedCount: targetIds.length,
        progress: state.progress,
        notifications: state.notifications
      });
      return;
    }
    if (!indicatorId || !state.progress[indicatorId]) {
      res.status(404).json({ error: "Indikator tidak ditemukan" });
      return;
    }
    const ind = ALL_INDICATORS.find((i) => i.id === indicatorId);
    const nextArchived = Boolean(archived);
    state.progress[indicatorId] = {
      ...state.progress[indicatorId],
      archived: nextArchived,
      archivedBy: nextArchived ? actor.id : void 0,
      archivedAt: nextArchived ? now : void 0
    };
    const targetUsers = Array.from(/* @__PURE__ */ new Set([...ind.pics, "ahmad-syaikhu", "tata-usaha"]));
    state.notifications.unshift({
      id: `notif-arch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId: actor.id,
      actorName: actor.name,
      targetUserIds: targetUsers,
      indicatorId: ind.id,
      componentId: ind.componentId,
      indicatorNo: ind.no,
      type: "archive_update",
      title: nextArchived ? `K${ind.componentId} Butir #${ind.no} Diarsipkan` : `K${ind.componentId} Butir #${ind.no} Dikembalikan dari Arsip`,
      message: nextArchived ? `${actor.name} memindahkan indikator K${ind.componentId} #${ind.no} ke Area Arsip.` : `${actor.name} mengembalikan indikator K${ind.componentId} #${ind.no} ke daftar fokus pengerjaan aktif.`,
      createdAt: now,
      readBy: [actor.id]
    });
    state.notifications = state.notifications.slice(0, 120);
    saveState(state);
    res.json({
      progress: state.progress,
      notifications: state.notifications
    });
  });
  app2.post("/api/notifications/read", (req, res) => {
    const { userId, notificationId } = req.body ?? {};
    if (!userId) {
      res.status(400).json({ error: "userId wajib diisi" });
      return;
    }
    state.notifications = state.notifications.map((n) => {
      if (notificationId && n.id !== notificationId) return n;
      if (!n.readBy.includes(userId)) {
        return { ...n, readBy: [...n.readBy, userId] };
      }
      return n;
    });
    saveState(state);
    res.json({ notifications: state.notifications });
  });
  app2.post("/api/reset", (_req, res) => {
    state = createInitialState();
    saveState(state);
    res.json({
      progress: state.progress,
      notifications: state.notifications
    });
  });
  app2.get("/api/php-files", (_req, res) => {
    const files = collectFilesRecursively(PHP_DEPLOY_DIR, PHP_DEPLOY_DIR).filter((f) => !f.isBinary).map((f) => ({ path: f.path, content: String(f.content) }));
    res.json({ files });
  });
  app2.get("/api/download-php-zip", async (_req, res) => {
    try {
      const files = collectFilesRecursively(PHP_DEPLOY_DIR, PHP_DEPLOY_DIR);
      const zip = new JSZip();
      for (const f of files) {
        zip.file(f.path, f.content);
      }
      const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="sip-pkkm-2026-php-pdo-vercel.zip"');
      res.send(buffer);
    } catch {
      res.status(500).json({ error: "Gagal membuat arsip ZIP PHP" });
    }
  });
  return app2;
}

// api-entry.ts
var app = createApiApp();
var api_entry_default = app;
export {
  api_entry_default as default
};
