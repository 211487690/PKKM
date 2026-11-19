import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileDown,
  FolderOpen,
  Users,
} from 'lucide-react';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  MADRASAH_INFO,
  PIC_USERS,
  type IndicatorProgress,
} from '../data/pkkmData';
import { generatePkkmPdfReport } from '../utils/pdfReport';

interface DashboardViewProps {
  progressMap: Record<string, IndicatorProgress>;
  isAdmin: boolean;
  onNavigate: (tab: string) => void;
  onSelectPic: (picId: string) => void;
  onJumpToIndicator: (componentId: number, indicatorId: string) => void;
  onArchiveIndicator: (indicatorId: string, archived: boolean) => Promise<void>;
  onBulkArchiveCompleted: () => Promise<void>;
}

// Target deadline: 3 Desember 2026 23:59:59 WIB (UTC+7)
const DEADLINE_TIMESTAMP = new Date('2026-12-03T23:59:59+07:00').getTime();

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getCountdownParts(nowMs: number): CountdownParts {
  const diff = DEADLINE_TIMESTAMP - nowMs;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: false };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  progressMap,
  isAdmin,
  onNavigate,
  onSelectPic,
  onJumpToIndicator,
  onArchiveIndicator,
  onBulkArchiveCompleted,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');
  const [archiveCompFilter, setArchiveCompFilter] = useState<number>(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => getCountdownParts(nowMs), [nowMs]);

  const totalIndicators = ALL_INDICATORS.length;
  const disetorkanCount = ALL_INDICATORS.filter(
    (i) => progressMap[i.id]?.status === 'disetorkan'
  ).length;
  const prosesCount = ALL_INDICATORS.filter(
    (i) => progressMap[i.id]?.status === 'proses'
  ).length;
  const belumCount = totalIndicators - disetorkanCount - prosesCount;

  const archivedIndicators = useMemo(
    () => ALL_INDICATORS.filter((i) => Boolean(progressMap[i.id]?.archived)),
    [progressMap]
  );

  const activeFocusIndicators = useMemo(
    () => ALL_INDICATORS.filter((i) => !progressMap[i.id]?.archived),
    [progressMap]
  );

  const readyToArchiveCount = useMemo(
    () =>
      activeFocusIndicators.filter((i) => progressMap[i.id]?.status === 'disetorkan').length,
    [activeFocusIndicators, progressMap]
  );

  const filteredWorkspaceList = useMemo(() => {
    const base = archiveTab === 'archived' ? archivedIndicators : activeFocusIndicators;
    return base.filter((i) => archiveCompFilter === 0 || i.componentId === archiveCompFilter);
  }, [archiveTab, archivedIndicators, activeFocusIndicators, archiveCompFilter]);

  const totalSubItems = ALL_INDICATORS.reduce((acc, i) => acc + i.buktiFisik.length, 0);
  const checkedSubItems = ALL_INDICATORS.reduce(
    (acc, i) => acc + (progressMap[i.id]?.checkedSubItems?.length ?? 0),
    0
  );

  const pctGlobal = totalIndicators > 0 ? Math.round((disetorkanCount / totalIndicators) * 100) : 0;
  const pctSub = totalSubItems > 0 ? Math.round((checkedSubItems / totalSubItems) * 100) : 0;

  const barChartData = useMemo(() => {
    return COMPONENTS_META.map((comp) => {
      const inds = ALL_INDICATORS.filter((i) => i.componentId === comp.id);
      const done = inds.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
      const inProg = inds.filter((i) => progressMap[i.id]?.status === 'proses').length;
      const subTotal = inds.reduce((s, i) => s + i.buktiFisik.length, 0);
      const subDone = inds.reduce(
        (s, i) => s + (progressMap[i.id]?.checkedSubItems?.length ?? 0),
        0
      );

      return {
        componentId: comp.id,
        name: `K${comp.id} · ${comp.shortTitle}`,
        shortLabel: `Komp. ${comp.id}`,
        fullTitle: comp.title,
        persenIndikator: inds.length > 0 ? Math.round((done / inds.length) * 100) : 0,
        persenBerkas: subTotal > 0 ? Math.round((subDone / subTotal) * 100) : 0,
        done,
        inProg,
        total: inds.length,
        subDone,
        subTotal,
      };
    });
  }, [progressMap]);

  const pieChartData = useMemo(
    () => [
      {
        name: 'Sudah Disetorkan',
        value: disetorkanCount,
        color: '#0d9488',
      },
      {
        name: 'Dalam Proses',
        value: prosesCount,
        color: '#d97706',
      },
      {
        name: 'Belum Disetor',
        value: belumCount,
        color: '#94a3b8',
      },
    ],
    [disetorkanCount, prosesCount, belumCount]
  );

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const handleToggleArchive = async (indicatorId: string, nextArchived: boolean) => {
    setBusyId(indicatorId);
    try {
      await onArchiveIndicator(indicatorId, nextArchived);
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkArchive = async () => {
    setBusyId('bulk');
    try {
      await onBulkArchiveCompleted();
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      await generatePkkmPdfReport(progressMap);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Identitas Lembaga, Logo & Countdown Deadline 3 Desember 2026 */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 max-w-2xl">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-200 p-1.5 shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/LOGO_MIA_06_23b19dba.png"
                alt="Logo MIS Almaarif 06 Toyomarto"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-teal-700 font-semibold">
                <span>Lembar Kendali &amp; Ceklist Bukti Fisik Visitasi PKKM</span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>{MADRASAH_INFO.fokusBuktiFisik}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                {MADRASAH_INFO.namaMadrasah}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>
                  NSM/NPSN:{' '}
                  <strong className="font-mono text-slate-900">
                    {MADRASAH_INFO.nsm} / {MADRASAH_INFO.npsn}
                  </strong>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>
                  Kepala Madrasah:{' '}
                  <strong className="text-slate-900">{MADRASAH_INFO.kepalaMadrasah}</strong>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span>
                  Pengawas:{' '}
                  <strong className="text-slate-900">{MADRASAH_INFO.pengawasPembina}</strong>
                </span>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  disabled={exportingPdf}
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 transition-colors"
                >
                  <FileDown className="w-4 h-4 shrink-0" />
                  <span>
                    {exportingPdf
                      ? 'Menyiapkan Laporan PDF...'
                      : 'Unduh Laporan Rekapitulasi (PDF)'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Countdown Timer Batas Akhir 3 Desember 2026 */}
          <div className="bg-slate-900 text-white rounded-xl p-4 sm:px-5 sm:py-4 shrink-0 border border-slate-800">
            <div className="flex items-center justify-between gap-4 mb-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-teal-300">
                <CalendarClock className="w-4 h-4 shrink-0" />
                <span>Hitung Mundur Deadline Penyetoran</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">3 Des 2026</span>
            </div>

            {countdown.expired ? (
              <div className="text-sm font-semibold text-amber-300 py-1">
                Batas Akhir Pengerjaan (3 Desember 2026) Telah Berakhir
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-2">
                  <div className="font-mono text-xl sm:text-2xl font-bold text-teal-300 tabular-nums leading-none">
                    {pad2(countdown.days)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Hari</div>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-2">
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums leading-none">
                    {pad2(countdown.hours)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Jam</div>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-2">
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums leading-none">
                    {pad2(countdown.minutes)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Menit</div>
                </div>
                <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-2">
                  <div className="font-mono text-xl sm:text-2xl font-bold text-teal-400 tabular-nums leading-none">
                    {pad2(countdown.seconds)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Detik</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Strip Metrik Progres Global */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200/70">
            <div className="text-xs text-teal-800 font-medium">Capaian Indikator</div>
            <div className="font-mono text-2xl font-bold text-teal-700 tabular-nums mt-0.5">
              {pctGlobal}%
            </div>
            <div className="text-[11px] text-slate-600 tabular-nums">
              {disetorkanCount} / {totalIndicators} butir
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-600 font-medium">Kelengkapan Berkas</div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
              {pctSub}%
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {checkedSubItems} / {totalSubItems} dokumen
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Disetorkan</div>
              <div className="font-mono text-xl font-bold text-teal-700 tabular-nums mt-0.5">
                {disetorkanCount}
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Dalam Proses</div>
              <div className="font-mono text-xl font-bold text-amber-700 tabular-nums mt-0.5">
                {prosesCount}
              </div>
            </div>
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between col-span-2 lg:col-span-1">
            <div>
              <div className="text-xs text-slate-500">Belum Disetor</div>
              <div className="font-mono text-xl font-bold text-slate-700 tabular-nums mt-0.5">
                {belumCount}
              </div>
            </div>
            <FileCheck2 className="w-5 h-5 text-slate-400 shrink-0" />
          </div>
        </div>
      </section>

      {/* Visualisasi Grafik Batang & Diagram Pie (Recharts) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Grafik Penyelesaian Per Komponen (%)
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan persentase indikator disetorkan dan kelengkapan bukti fisik Level 4
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 inline-block" />
                Indikator Disetorkan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" />
                Bukti Fisik Tercentang
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg text-xs shadow-md border border-slate-700 space-y-1">
                        <div className="font-display font-semibold text-teal-300">
                          Komponen {item.componentId}: {item.fullTitle}
                        </div>
                        <div className="font-mono tabular-nums">
                          Indikator Disetorkan: <strong>{item.persenIndikator}%</strong> ({item.done}/{item.total})
                        </div>
                        <div className="font-mono tabular-nums text-slate-300">
                          Bukti Fisik: <strong>{item.persenBerkas}%</strong> ({item.subDone}/{item.subTotal})
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="persenIndikator"
                  name="Indikator Disetorkan"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                  animationDuration={450}
                />
                <Bar
                  dataKey="persenBerkas"
                  name="Bukti Fisik Tercentang"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                  animationDuration={450}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Diagram Proporsi Status (89 Indikator)
            </h2>
            <p className="text-xs text-slate-500">
              Distribusi keseluruhan status penyetoran instrumen PKKM 2026
            </p>
          </div>

          <div className="relative h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                  animationDuration={450}
                >
                  {pieChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0];
                    const val = Number(d.value ?? 0);
                    const p = totalIndicators > 0 ? Math.round((val / totalIndicators) * 100) : 0;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-md border border-slate-700 font-mono tabular-nums">
                        {d.name}: <strong>{val} butir</strong> ({p}%)
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {pctGlobal}%
              </span>
              <span className="text-[11px] text-slate-500">Disetorkan</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {pieChartData.map((item) => {
              const p = totalIndicators > 0 ? Math.round((item.value / totalIndicators) * 100) : 0;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs text-slate-700"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-xs inline-block shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    {item.value} butir ({p}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Arsip Indikator & Fokus Pengerjaan Aktif */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Archive className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Fokus Pengerjaan &amp; Arsip Indikator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pindahkan indikator yang sudah disetorkan ke Area Arsip agar tim tetap fokus pada item yang belum selesai.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setArchiveTab('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  archiveTab === 'active'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fokus Aktif ({activeFocusIndicators.length})
              </button>
              <button
                type="button"
                onClick={() => setArchiveTab('archived')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  archiveTab === 'archived'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Area Arsip ({archivedIndicators.length})
              </button>
            </div>

            {isAdmin && archiveTab === 'active' && readyToArchiveCount > 0 && (
              <button
                type="button"
                disabled={busyId === 'bulk'}
                onClick={handleBulkArchive}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Arsipkan Semua Selesai ({readyToArchiveCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Komponen dalam Fokus / Arsip */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto">
            {[
              { id: 0, label: 'Semua Komponen' },
              { id: 1, label: 'K1' },
              { id: 2, label: 'K2' },
              { id: 3, label: 'K3' },
              { id: 4, label: 'K4' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setArchiveCompFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  archiveCompFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {!isAdmin && (
            <div className="text-[11px] text-slate-500">
              Mode baca pelaksana · Ganti User Aktif ke <strong>Administrator / Kepala Madrasah</strong> untuk memindahkan ke Arsip
            </div>
          )}
        </div>

        {/* Daftar Indikator Fokus / Area Arsip */}
        <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
          {filteredWorkspaceList.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {archiveTab === 'archived'
                ? 'Belum ada indikator di Area Arsip. Indikator yang sudah berstatus "Disetorkan" dapat dipindahkan ke sini oleh Admin.'
                : 'Seluruh indikator pada filter ini sudah masuk ke Area Arsip.'}
            </div>
          ) : (
            filteredWorkspaceList.map((ind) => {
              const prog = progressMap[ind.id];
              const status = prog?.status ?? 'belum';
              const checkedLen = prog?.checkedSubItems?.length ?? 0;
              const picNames = ind.pics
                .map((pid) => PIC_USERS.find((u) => u.id === pid)?.name ?? pid)
                .join(', ');

              return (
                <div
                  key={ind.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900">
                        K{ind.componentId} #{ind.no}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span
                        className={`font-semibold ${
                          status === 'disetorkan'
                            ? 'text-teal-700'
                            : status === 'proses'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {status === 'disetorkan'
                          ? 'Sudah Disetorkan'
                          : status === 'proses'
                          ? 'Dalam Proses'
                          : 'Belum Disetor'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono tabular-nums">
                        {checkedLen}/{ind.buktiFisik.length} bukti fisik
                      </span>
                      {prog?.lokasiBerkas && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1 text-teal-700">
                            <FolderOpen className="w-3.5 h-3.5" />
                            {prog.lokasiBerkas}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {ind.indikatorKinerja}
                    </div>
                    <div className="text-xs text-slate-500">
                      Pelaksana: {picNames}
                      {prog?.archived && prog?.archivedAt && (
                        <>
                          {' '}
                          · Diarsipkan{' '}
                          <span className="font-mono tabular-nums">
                            {new Date(prog.archivedAt).toLocaleDateString('id-ID')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onJumpToIndicator(ind.componentId, ind.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 whitespace-nowrap"
                    >
                      <span>Buka</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && archiveTab === 'active' && status === 'disetorkan' && (
                      <button
                        type="button"
                        disabled={busyId === ind.id}
                        onClick={() => handleToggleArchive(ind.id, true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 disabled:opacity-60 whitespace-nowrap"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Arsipkan</span>
                      </button>
                    )}

                    {isAdmin && archiveTab === 'archived' && (
                      <button
                        type="button"
                        disabled={busyId === ind.id}
                        onClick={() => handleToggleArchive(ind.id, false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 disabled:opacity-60 whitespace-nowrap"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5" />
                        <span>Kembalikan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Menu Kartu 4 Komponen */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Progres Per Komponen Penilaian
          </h2>
          <p className="text-xs text-slate-500">
            Pilih komponen untuk membuka menu ceklist indikator dan rincian bukti fisik Level 4
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPONENTS_META.map((comp) => {
            const compInds = ALL_INDICATORS.filter((i) => i.componentId === comp.id);
            const done = compInds.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
            const inProg = compInds.filter((i) => progressMap[i.id]?.status === 'proses').length;
            const subTotal = compInds.reduce((s, i) => s + i.buktiFisik.length, 0);
            const subDone = compInds.reduce(
              (s, i) => s + (progressMap[i.id]?.checkedSubItems?.length ?? 0),
              0
            );
            const pct = compInds.length > 0 ? Math.round((done / compInds.length) * 100) : 0;

            const compPicIds = Array.from(new Set(compInds.flatMap((i) => i.pics)));
            const compPicNames = compPicIds
              .map((pid) => PIC_USERS.find((u) => u.id === pid)?.name)
              .filter(Boolean);

            return (
              <motion.button
                key={comp.id}
                type="button"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16 }}
                onClick={() => onNavigate(`component-${comp.id}`)}
                className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-teal-500 transition-colors group flex flex-col justify-between"
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
                        <span>Komponen {comp.id}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>Skor Maks {comp.maxScore}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 mt-1 group-hover:text-teal-800 transition-colors">
                        {comp.title}
                      </h3>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                      {done}/{compInds.length}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {comp.description}
                  </p>

                  <div className="mt-3 text-xs text-slate-600">
                    <span className="text-slate-400">Pelaksana: </span>
                    <span className="font-medium text-slate-700">
                      {compPicNames.slice(0, 4).join(', ')}
                      {compPicNames.length > 4 ? ` +${compPicNames.length - 4} lainnya` : ''}
                    </span>
                  </div>
                </div>

                <div className="w-full mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 tabular-nums">
                    <span>
                      {subDone}/{subTotal} dokumen fisik · {inProg} proses
                    </span>
                    <span className="font-semibold text-teal-700 flex items-center gap-1">
                      {pct}%
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Rekap Pelaksana / PIC */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-teal-700 shrink-0" />
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Orang yang Mengerjakan Setiap Komponen
              </h2>
              <p className="text-xs text-slate-500">
                Klik nama pelaksana untuk memfilter indikator yang menjadi tanggung jawabnya
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('team')}
            className="text-xs font-semibold text-teal-700 hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            Lihat Rincian Tim →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nama Pelaksana / Unit</th>
                <th className="px-6 py-3 font-medium">Komponen Terkait</th>
                <th className="px-6 py-3 font-medium text-right">Beban Butir</th>
                <th className="px-6 py-3 font-medium text-right">Proses</th>
                <th className="px-6 py-3 font-medium text-right">Disetorkan</th>
                <th className="px-6 py-3 font-medium text-right">Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PIC_USERS.map((user) => {
                const assigned = ALL_INDICATORS.filter((i) => i.pics.includes(user.id));
                const done = assigned.filter(
                  (i) => progressMap[i.id]?.status === 'disetorkan'
                ).length;
                const proses = assigned.filter(
                  (i) => progressMap[i.id]?.status === 'proses'
                ).length;
                const comps = Array.from(
                  new Set(assigned.map((i) => `K${i.componentId}`))
                ).join(', ');
                const pct = assigned.length > 0 ? Math.round((done / assigned.length) * 100) : 0;

                return (
                  <tr
                    key={user.id}
                    onClick={() => onSelectPic(user.id)}
                    className="hover:bg-teal-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.role}</div>
                    </td>
                    <td className="px-6 py-3 text-xs font-mono text-slate-600">{comps || '-'}</td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-700">
                      {assigned.length}
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-amber-700">
                      {proses}
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums font-semibold text-teal-700">
                      {done}
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-700">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};
