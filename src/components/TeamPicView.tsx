import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Cloud,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  PIC_USERS,
  type IndicatorProgress,
} from '../data/pkkmData';
import type { CloudTeamMember } from '../utils/pkkmFirestore';

interface TeamPicViewProps {
  progressMap: Record<string, IndicatorProgress>;
  initialSelectedPicId?: string | null;
  onJumpToIndicator: (componentId: number, indicatorId: string) => void;
  cloudConnected?: boolean;
  isCloudAdmin?: boolean;
  cloudEmail?: string | null;
  cloudMembers?: CloudTeamMember[];
  onConnectCloud?: () => Promise<void>;
  onUpsertCloudMember?: (params: {
    email: string;
    name: string;
    picId: string;
    active: boolean;
  }) => Promise<void>;
  onRemoveCloudMember?: (email: string) => Promise<void>;
}

export const TeamPicView: React.FC<TeamPicViewProps> = ({
  progressMap,
  initialSelectedPicId,
  onJumpToIndicator,
  cloudConnected = false,
  isCloudAdmin = false,
  cloudEmail,
  cloudMembers = [],
  onConnectCloud,
  onUpsertCloudMember,
  onRemoveCloudMember,
}) => {
  const [selectedPicId, setSelectedPicId] = useState<string>(
    initialSelectedPicId || PIC_USERS[0].id
  );
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPicId, setNewPicId] = useState('tata-usaha');
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberErr, setMemberErr] = useState<string | null>(null);

  const selectedUser = PIC_USERS.find((u) => u.id === selectedPicId) ?? PIC_USERS[0];
  const assignedIndicators = ALL_INDICATORS.filter((i) => i.pics.includes(selectedUser.id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpsertCloudMember) return;
    setMemberErr(null);
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setMemberErr('Masukkan alamat email Google yang valid.');
      return;
    }
    setMemberSaving(true);
    try {
      await onUpsertCloudMember({
        email,
        name: newName.trim() || email,
        picId: newPicId,
        active: true,
      });
      setNewEmail('');
      setNewName('');
    } catch (err) {
      setMemberErr(err instanceof Error ? err.message : 'Gagal menambahkan email kolaborator.');
    } finally {
      setMemberSaving(false);
    }
  };

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

      {/* Panel Akses Kolaborator Cloud Real-Time */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Cloud className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Akses Kolaborator Cloud (Sinkronisasi Multi-Device)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {cloudConnected
                  ? `Terhubung ke Firestore sebagai ${cloudEmail || 'Pengguna Google'}. Setiap perubahan progres tersinkron seketika ke semua perangkat tim.`
                  : 'Hubungkan akun Google Administrator agar perubahan progres dapat disinkronkan secara real-time antar perangkat.'}
              </p>
            </div>
          </div>

          {!cloudConnected && onConnectCloud && (
            <button
              type="button"
              onClick={onConnectCloud}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Cloud className="w-4 h-4" />
              <span>Hubungkan Google Cloud</span>
            </button>
          )}
        </div>

        {cloudConnected && isCloudAdmin && onUpsertCloudMember && (
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <form
              onSubmit={handleAddMember}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
            >
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Email Google Kolaborator
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contoh: guru@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Personil
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama pelaksana"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Peran PIC
                </label>
                <select
                  value={newPicId}
                  onChange={(e) => setNewPicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {PIC_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={memberSaving}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{memberSaving ? 'Menyimpan...' : 'Tambah'}</span>
                </button>
              </div>
            </form>

            {memberErr && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {memberErr}
              </div>
            )}

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {cloudMembers.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500">
                  Belum ada email kolaborator tambahan. Saat ini akses cloud aktif untuk akun Administrator utama ({cloudEmail}).
                </div>
              ) : (
                cloudMembers.map((m) => (
                  <div
                    key={m.email}
                    className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900">{m.name}</span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="font-mono text-slate-600">{m.email}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpsertCloudMember({
                            email: m.email,
                            name: m.name,
                            picId: m.picId,
                            active: !m.active,
                          })
                        }
                        className={`px-2.5 py-1 rounded border font-medium ${
                          m.active
                            ? 'bg-teal-50 border-teal-200 text-teal-800'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {m.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                      {onRemoveCloudMember && (
                        <button
                          type="button"
                          onClick={() => onRemoveCloudMember(m.email)}
                          title="Hapus akses email"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
