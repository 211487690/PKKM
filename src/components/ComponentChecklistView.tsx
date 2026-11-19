import React, { useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  FolderOpen,
  Save,
  Search,
  UserCheck,
} from 'lucide-react';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  PIC_USERS,
  type IndicatorItem,
  type IndicatorProgress,
  type SubmissionStatus,
} from '../data/pkkmData';

interface ComponentChecklistViewProps {
  componentId: number;
  progressMap: Record<string, IndicatorProgress>;
  highlightedIndicatorId?: string | null;
  onUpdateIndicator: (
    indicatorId: string,
    payload: {
      status?: SubmissionStatus;
      checkedSubItems?: number[];
      lokasiBerkas?: string;
      catatan?: string;
      actionType: 'status_change' | 'subitem_check' | 'location_update';
      subItemIndex?: number;
    }
  ) => Promise<void>;
}

export const ComponentChecklistView: React.FC<ComponentChecklistViewProps> = ({
  componentId,
  progressMap,
  highlightedIndicatorId,
  onUpdateIndicator,
}) => {
  const compMeta = COMPONENTS_META.find((c) => c.id === componentId)!;
  const compIndicators = useMemo(
    () => ALL_INDICATORS.filter((i) => i.componentId === componentId),
    [componentId]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [picFilter, setPicFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (highlightedIndicatorId) {
      initial[highlightedIndicatorId] = true;
    } else if (compIndicators[0]) {
      initial[compIndicators[0].id] = true;
    }
    return initial;
  });

  // Draft local inputs for lokasi & catatan before pressing Save
  const [draftInputs, setDraftInputs] = useState<
    Record<string, { lokasiBerkas: string; catatan: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const compPicStats = useMemo(() => {
    const uniqueIds = Array.from(new Set(compIndicators.flatMap((i) => i.pics)));
    return uniqueIds
      .map((uid) => {
        const user = PIC_USERS.find((u) => u.id === uid);
        const items = compIndicators.filter((i) => i.pics.includes(uid));
        const done = items.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
        return {
          id: uid,
          name: user?.name ?? uid,
          role: user?.role ?? '',
          initials: user?.initials ?? '??',
          total: items.length,
          done,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [compIndicators, progressMap]);

  const archivedInCompCount = useMemo(
    () => compIndicators.filter((i) => Boolean(progressMap[i.id]?.archived)).length,
    [compIndicators, progressMap]
  );

  const filteredIndicators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return compIndicators.filter((ind) => {
      const prog = progressMap[ind.id];
      const isHighlighted = highlightedIndicatorId === ind.id;
      if (!showArchived && prog?.archived && !isHighlighted) return false;
      const currentStatus = prog?.status ?? 'belum';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
      if (picFilter !== 'all' && !ind.pics.includes(picFilter)) return false;
      if (q) {
        const haystack = [
          String(ind.no),
          ind.unsurTugas,
          ind.indikatorKinerja,
          ind.rawKeterangan,
          ...ind.buktiFisik,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    compIndicators,
    progressMap,
    statusFilter,
    picFilter,
    searchQuery,
    showArchived,
    highlightedIndicatorId,
  ]);

  const disetorkanCount = compIndicators.filter(
    (i) => progressMap[i.id]?.status === 'disetorkan'
  ).length;
  const prosesCount = compIndicators.filter(
    (i) => progressMap[i.id]?.status === 'proses'
  ).length;
  const pct = compIndicators.length > 0 ? Math.round((disetorkanCount / compIndicators.length) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleSubItem = async (ind: IndicatorItem, idx: number) => {
    const prevChecked = progressMap[ind.id]?.checkedSubItems ?? [];
    const exists = prevChecked.includes(idx);
    const nextChecked = exists
      ? prevChecked.filter((i) => i !== idx)
      : [...prevChecked, idx];

    await onUpdateIndicator(ind.id, {
      checkedSubItems: nextChecked,
      actionType: 'subitem_check',
      subItemIndex: idx,
    });
  };

  const handleCheckAllSubItems = async (ind: IndicatorItem, checkAll: boolean) => {
    const nextChecked = checkAll ? ind.buktiFisik.map((_, i) => i) : [];
    await onUpdateIndicator(ind.id, {
      checkedSubItems: nextChecked,
      status: checkAll ? 'disetorkan' : 'belum',
      actionType: 'status_change',
    });
  };

  const handleStatusChange = async (ind: IndicatorItem, newStatus: SubmissionStatus) => {
    setSavingId(ind.id);
    try {
      await onUpdateIndicator(ind.id, {
        status: newStatus,
        actionType: 'status_change',
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveLocation = async (ind: IndicatorItem) => {
    const draft = draftInputs[ind.id];
    const current = progressMap[ind.id];
    setSavingId(ind.id);
    try {
      await onUpdateIndicator(ind.id, {
        lokasiBerkas: draft ? draft.lokasiBerkas : current?.lokasiBerkas ?? '',
        catatan: draft ? draft.catatan : current?.catatan ?? '',
        actionType: 'location_update',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Komponen */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-teal-700">
              <span>Komponen {compMeta.id}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{compMeta.category}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Skor Maksimal {compMeta.maxScore}</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {compMeta.title}
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">{compMeta.description}</p>
          </div>

          <div className="shrink-0 lg:text-right">
            <div className="text-xs text-slate-500">Progres Komponen {compMeta.id}</div>
            <div className="font-mono text-2xl font-bold text-teal-700 tabular-nums">
              {disetorkanCount}/{compIndicators.length}{' '}
              <span className="text-sm font-medium text-slate-500">({pct}%)</span>
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {prosesCount} dalam proses · {compIndicators.length - disetorkanCount - prosesCount} belum
            </div>
          </div>
        </div>

        {/* Orang yang Mengerjakan Komponen Ini */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>Pelaksana / Penanggung Jawab di Komponen {compMeta.id}</span>
            </div>
            {picFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setPicFilter('all')}
                className="text-xs font-medium text-teal-700 hover:underline"
              >
                Tampilkan Semua Pelaksana
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {compPicStats.map((pic) => {
              const isSelected = picFilter === pic.id;
              return (
                <button
                  key={pic.id}
                  type="button"
                  onClick={() => setPicFilter(isSelected ? 'all' : pic.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'bg-teal-50 border-teal-500 text-teal-900'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{pic.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{pic.role}</div>
                  </div>
                  <span className="font-mono text-xs font-semibold tabular-nums shrink-0 text-teal-700">
                    {pic.done}/{pic.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filter & Pencarian */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari di Komponen ${compMeta.id} (unsur, indikator, bukti fisik, nama PIC)...`}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'disetorkan', label: 'Disetorkan' },
                { id: 'proses', label: 'Proses' },
                { id: 'belum', label: 'Belum' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {archivedInCompCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                showArchived
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>
                {showArchived
                  ? `Menampilkan Arsip (${archivedInCompCount})`
                  : `Arsip Disembunyikan (${archivedInCompCount})`}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Daftar Butir Indikator */}
      {filteredIndicators.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            Tidak ada butir indikator yang sesuai filter saat ini.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPicFilter('all');
              setShowArchived(true);
            }}
            className="mt-3 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIndicators.map((ind) => {
            const prog = progressMap[ind.id];
            const status = prog?.status ?? 'belum';
            const checked = prog?.checkedSubItems ?? [];
            const isExpanded = !!expandedIds[ind.id] || highlightedIndicatorId === ind.id;
            const draft = draftInputs[ind.id] ?? {
              lokasiBerkas: prog?.lokasiBerkas ?? '',
              catatan: prog?.catatan ?? '',
            };
            const picNames = ind.pics
              .map((pid) => PIC_USERS.find((u) => u.id === pid)?.name ?? pid)
              .join(', ');
            const updater = prog?.updatedBy
              ? PIC_USERS.find((u) => u.id === prog.updatedBy)?.name ?? prog.updatedBy
              : null;

            return (
              <div
                key={ind.id}
                id={`indicator-${ind.id}`}
                className={`bg-white border rounded-xl transition-colors ${
                  highlightedIndicatorId === ind.id
                    ? 'border-teal-500 ring-1 ring-teal-500/30'
                    : 'border-slate-200'
                }`}
              >
                {/* Ringkasan Baris Indikator */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-slate-900">
                          Butir #{ind.no}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span>
                          Pelaksana: <strong className="text-slate-800">{picNames}</strong>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono tabular-nums">
                          {checked.length}/{ind.buktiFisik.length} bukti fisik
                        </span>
                        {prog?.lokasiBerkas && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                              <FolderOpen className="w-3.5 h-3.5" />
                              {prog.lokasiBerkas}
                            </span>
                          </>
                        )}
                        {prog?.archived && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                              <Archive className="w-3.5 h-3.5" />
                              Diarsipkan
                            </span>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 leading-relaxed">
                        {ind.unsurTugas}
                      </div>

                      <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                        {ind.indikatorKinerja}
                      </h3>
                    </div>

                    {/* Kontrol Status & Expand */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ind, 'belum')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            status === 'belum'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Belum</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ind, 'proses')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            status === 'proses'
                              ? 'bg-white text-amber-800 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Proses</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ind, 'disetorkan')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                            status === 'disetorkan'
                              ? 'bg-teal-700 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              status === 'disetorkan' ? 'text-white' : 'text-teal-600'
                            }`}
                          />
                          <span>Disetorkan</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(ind.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                      >
                        <span>Bukti Fisik</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel Expand: Rincian Bukti Fisik Level 4 & Lokasi Berkas */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/40 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">
                        Bukti Fisik Level 4 (Lengkap) — {checked.length} dari {ind.buktiFisik.length}{' '}
                        dokumen siap
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCheckAllSubItems(ind, true)}
                          className="font-medium text-teal-700 hover:underline"
                        >
                          Centang Semua &amp; Setorkan
                        </button>
                        {checked.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCheckAllSubItems(ind, false)}
                            className="font-medium text-slate-500 hover:text-slate-800"
                          >
                            Reset Centang
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {ind.buktiFisik.map((itemText, idx) => {
                        const isChecked = checked.includes(idx);
                        return (
                          <label
                            key={idx}
                            className="flex items-start gap-3 p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-teal-300 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSubItem(ind, idx)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 shrink-0"
                            />
                            <span
                              className={`text-sm leading-relaxed ${
                                isChecked ? 'line-through text-slate-400' : 'text-slate-700'
                              }`}
                            >
                              <span className="font-mono text-xs text-slate-400 mr-1.5">
                                {idx + 1}.
                              </span>
                              {itemText}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Lokasi Berkas / Ordner / Google Drive */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-200/70">
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Catatan Lokasi Berkas (Nomor Ordner / Nama Map / Link Google Drive)
                        </label>
                        <input
                          type="text"
                          value={draft.lokasiBerkas}
                          onChange={(e) =>
                            setDraftInputs((prev) => ({
                              ...prev,
                              [ind.id]: { ...draft, lokasiBerkas: e.target.value },
                            }))
                          }
                          placeholder="Contoh: Ordner K1-01 / https://drive.google.com/..."
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Catatan Progres / Kendala
                        </label>
                        <input
                          type="text"
                          value={draft.catatan}
                          onChange={(e) =>
                            setDraftInputs((prev) => ({
                              ...prev,
                              [ind.id]: { ...draft, catatan: e.target.value },
                            }))
                          }
                          placeholder="Catatan tambahan untuk tim atau pengawas..."
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          disabled={savingId === ind.id}
                          onClick={() => handleSaveLocation(ind)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingId === ind.id ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                      </div>
                    </div>

                    {updater && prog?.updatedAt && (
                      <div className="text-[11px] text-slate-500">
                        Terakhir diperbarui oleh <strong className="text-slate-700">{updater}</strong> pada{' '}
                        <span className="font-mono tabular-nums">
                          {new Date(prog.updatedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
