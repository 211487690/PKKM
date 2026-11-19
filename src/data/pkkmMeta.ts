export interface MadrasahInfo {
  namaMadrasah: string;
  nsm: string;
  npsn: string;
  jenjangStatus: string;
  alamat: string;
  kepalaMadrasah: string;
  nipKamad: string;
  periodePenilaian: string;
  pengawasPembina: string;
  nipPengawas: string;
  totalIndikator: number;
  fokusBuktiFisik: string;
}

export interface ComponentMeta {
  id: number;
  code: string;
  title: string;
  shortTitle: string;
  category: string;
  totalIndicators: number;
  maxScore: number;
  description: string;
}

export interface PicUser {
  id: string;
  name: string;
  role: string;
  initials: string;
  isAdmin: boolean;
}

export interface IndicatorItem {
  id: string;
  componentId: number;
  no: number;
  unsurTugas: string;
  indikatorKinerja: string;
  buktiFisik: string[];
  pics: string[];
  rawKeterangan: string;
}

export const MADRASAH_INFO: MadrasahInfo = {
  namaMadrasah: 'MIS ALMAARIF 06 TOYOMARTO',
  nsm: '111235070217',
  npsn: '60715202',
  jenjangStatus: 'MI / Swasta',
  alamat: 'Jl. Candirawan 3 Toyomarto Singosari Malang, Kec. Singosari, Malang',
  kepalaMadrasah: 'Ahmad Syaikhu, S.Pd.I',
  nipKamad: '-',
  periodePenilaian: 'Tahun Ke-1 (PKKM 2026)',
  pengawasPembina: 'DRA. DIYAH SURYANINGSIH, M.Pd',
  nipPengawas: '196904231995032001',
  totalIndikator: 89,
  fokusBuktiFisik: 'Level 4 (Lengkap)',
};

export const COMPONENTS_META: ComponentMeta[] = [
  {
    id: 1,
    code: 'K1',
    title: 'Usaha Pengembangan Madrasah',
    shortTitle: 'Pengembangan Madrasah',
    category: 'Penilaian Tahunan & 4 Tahunan',
    totalIndicators: 25,
    maxScore: 100,
    description:
      'Struktur organisasi, personalia, pedoman kerja, inovasi pembelajaran, kemitraan, pemenuhan 8 SNP, unit layanan khusus, dan sistem informasi TIK.',
  },
  {
    id: 2,
    code: 'K2',
    title: 'Pelaksanaan Tugas Manajerial',
    shortTitle: 'Tugas Manajerial',
    category: 'Penilaian Tahunan & 4 Tahunan',
    totalIndicators: 41,
    maxScore: 164,
    description:
      'Perencanaan RKJM/RKT/e-RKAM, visi-misi, budaya belajar & prestasi, pendayagunaan SDM, sarpras, kesiswaan, kurikulum, keuangan, ketatausahaan, dan monev.',
  },
  {
    id: 3,
    code: 'K3',
    title: 'Pengembangan Kewirausahaan',
    shortTitle: 'Kewirausahaan',
    category: 'Penilaian Tahunan & 4 Tahunan',
    totalIndicators: 12,
    maxScore: 48,
    description:
      'Inovasi madrasah, budaya berpikir kreatif, pemberdayaan potensi produktif, penumbuhan jiwa kewirausahaan, bank ide, dan pemecahan masalah kelembagaan.',
  },
  {
    id: 4,
    code: 'K4',
    title: 'Supervisi Kepada Guru dan Tenaga Kependidikan',
    shortTitle: 'Supervisi Guru & Tendik',
    category: 'Penilaian Tahunan & 4 Tahunan',
    totalIndicators: 11,
    maxScore: 44,
    description:
      'Penyusunan program supervisi akademik, pengembangan instrumen, pra-observasi, pemantauan pembelajaran, refleksi pasca-observasi, dan tindak lanjut PKB.',
  },
];

export const PIC_USERS: PicUser[] = [
  {
    id: 'ahmad-syaikhu',
    name: 'Ahmad Syaikhu',
    role: 'Kepala Madrasah',
    initials: 'AS',
    isAdmin: true,
  },
  {
    id: 'tata-usaha',
    name: 'Tata Usaha / Administrator',
    role: 'Tata Usaha Madrasah (TUM)',
    initials: 'TU',
    isAdmin: true,
  },
  {
    id: 'moh-umar-jaelani',
    name: 'Moh. Umar Jaelani',
    role: 'Tim Manajerial & Sarpras',
    initials: 'UJ',
    isAdmin: false,
  },
  {
    id: 'bekti-sugiarsih',
    name: 'Bekti Sugiarsih',
    role: 'Koordinator Kurikulum & Inovasi',
    initials: 'BS',
    isAdmin: false,
  },
  {
    id: 'tsani-churoidah',
    name: 'Tsani Churoidah',
    role: 'Koordinator Literasi, Perpus & Penilaian',
    initials: 'TC',
    isAdmin: false,
  },
  {
    id: 'adi-setiawan',
    name: 'Adi Setiawan',
    role: 'Koordinator Kesiswaan & Prestasi',
    initials: 'AD',
    isAdmin: false,
  },
  {
    id: 'ilmiyatus-saadah',
    name: "Ilmiyatus Sa'adah",
    role: 'Tim Organisasi, Kesiswaan & Bank Ide',
    initials: 'IS',
    isAdmin: false,
  },
  {
    id: 'is-roviqoh-indayati',
    name: 'Is Roviqoh Indayati',
    role: 'Tim Humas, Lomba & Koperasi',
    initials: 'IR',
    isAdmin: false,
  },
  {
    id: 'mujiati',
    name: 'Mujiati',
    role: 'Tim Pembiasaan, Inovasi & Kemitraan',
    initials: 'MJ',
    isAdmin: false,
  },
  {
    id: 'sarirotul-ulum',
    name: 'Sarirotul Ulum',
    role: 'Koordinator Keuangan, Koperasi & Wirausaha',
    initials: 'SU',
    isAdmin: false,
  },
  {
    id: 'harits-al-anshori',
    name: 'Harits Al Anshori',
    role: 'Tim Ketatausahaan, Arsip & Sarpras',
    initials: 'HA',
    isAdmin: false,
  },
  {
    id: 'guru-kelas-mapel',
    name: 'Guru Kelas / Mapel',
    role: 'Dewan Guru MI Almaarif 06',
    initials: 'GK',
    isAdmin: false,
  },
];
