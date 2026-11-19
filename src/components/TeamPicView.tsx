import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, Users } from 'lucide-react';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  PIC_USERS,
  type IndicatorProgress,
} from '../data/pkkmData';

interface TeamPicViewProps {
  progressMap: Record<string, IndicatorProgress>;
  initialSelectedPicId?: string | null;
  onJumpToIndicator: (componentId: number, indicatorId: string) => void;
}

export const TeamPicView: React.FC<TeamPicViewProps> = ({
  progressMap,
  initialSelectedPicId,
  onJumpToIndicator,
}) => {
  const [selectedPicId, setSelectedPicId] = useState<string>(
    initialSelectedPicId || PIC_USERS[0].id
  );

  const selectedUser = PIC_USERS.find((u) => u.id === selectedPicId) ?? PIC_USERS[0];
  const assignedIndicators = ALL_INDICATORS.filter((i) => i.pics.includes(selectedUser.id));

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-teal-700" />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Tim &amp; Penanggung Jawab (PIC) Komponen
            </h1>
            <p className="text-sm text-slate-600">
              Pemetaan seluruh orang yang mengerjakan 89 butir indikator sesuai kolom Keterangan berkas PKKM 2026.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Daftar Personil */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
          {PIC_USERS.map((user) => {
            const list = ALL_INDICATORS.filter((i) => i.pics.includes(user.id));
            const done = list.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
            const pct = list.length > 0 ? Math.round((done / list.length) * 100) : 0;
            const isSelected = user.id === selectedUser.id;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedPicId(user.id)}
                className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors ${
                  isSelected ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg font-display font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {user.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.role}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-semibold text-teal-700 tabular-nums">
                    {done}/{list.length}
                  </div>
                  <div className="text-[11px] text-slate-400 tabular-nums">{pct}%</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Indikator Personil Terpilih */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-teal-700 font-medium">Daftar Tugas Pelaksana</div>
              <h2 className="font-display text-lg font-bold text-slate-900">{selectedUser.name}</h2>
              <p className="text-xs text-slate-500">
                {selectedUser.role} · Menangani {assignedIndicators.length} butir indikator
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {assignedIndicators.map((ind) => {
              const prog = progressMap[ind.id];
              const status = prog?.status ?? 'belum';
              const comp = COMPONENTS_META.find((c) => c.id === ind.componentId);
              const checkedCount = prog?.checkedSubItems?.length ?? 0;

              return (
                <div
                  key={ind.id}
                  className="p-4 hover:bg-slate-50/70 flex items-start justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-900">
                        K{ind.componentId} #{ind.no}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{comp?.shortTitle}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono tabular-nums">
                        {checkedCount}/{ind.buktiFisik.length} berkas
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {ind.indikatorKinerja}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      {status === 'disetorkan' ? (
                        <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Disetorkan
                        </span>
                      ) : status === 'proses' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5" /> Dalam Proses
                        </span>
                      ) : (
                        <span className="text-slate-500">Belum Disetor</span>
                      )}
                      {prog?.lokasiBerkas && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="truncate">{prog.lokasiBerkas}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onJumpToIndicator(ind.componentId, ind.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 shrink-0 whitespace-nowrap"
                  >
                    <span>Buka</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
