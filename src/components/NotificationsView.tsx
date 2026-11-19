import React, { useState } from 'react';
import { ArrowRight, Bell, Check, CheckCheck } from 'lucide-react';
import { PIC_USERS, type ProgressNotification } from '../data/pkkmData';

interface NotificationsViewProps {
  notifications: ProgressNotification[];
  activeUserId: string;
  onMarkRead: (notificationId?: string) => Promise<void>;
  onJumpToIndicator: (componentId: number, indicatorId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  activeUserId,
  onMarkRead,
  onJumpToIndicator,
}) => {
  const [filterMode, setFilterMode] = useState<'relevant' | 'all'>('relevant');
  const activeUser = PIC_USERS.find((u) => u.id === activeUserId) ?? PIC_USERS[1];

  const displayed =
    filterMode === 'relevant'
      ? notifications.filter(
          (n) => n.targetUserIds.includes(activeUserId) || n.actorId === activeUserId
        )
      : notifications;

  const unreadCount = displayed.filter(
    (n) => n.targetUserIds.includes(activeUserId) && !n.readBy.includes(activeUserId)
  ).length;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-teal-700 mt-1 shrink-0" />
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Notifikasi Progres Otomatis
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Setiap pembaruan bukti fisik atau status penyetoran otomatis dikirim ke pelaksana terkait, Kepala Madrasah, dan Administrator.
            </p>
            <div className="text-xs text-slate-500 mt-2">
              Sesi Aktif: <strong className="text-slate-800">{activeUser.name}</strong> ({activeUser.role})
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterMode('relevant')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                filterMode === 'relevant'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relevan Untuk Saya
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Log ({notifications.length})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => onMarkRead()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca ({unreadCount})</span>
            </button>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
        {displayed.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada notifikasi progres untuk user ini. Coba ubah ceklist atau lokasi berkas pada menu komponen untuk melihat notifikasi otomatis.
          </div>
        ) : (
          displayed.map((n) => {
            const isUnread =
              n.targetUserIds.includes(activeUserId) && !n.readBy.includes(activeUserId);

            return (
              <div
                key={n.id}
                className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isUnread ? 'bg-teal-50/40' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-teal-700">
                      Komponen {n.componentId} · Butir #{n.indicatorNo}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(n.createdAt).toLocaleString('id-ID')}
                    </span>
                    {isUnread && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-semibold text-teal-700">Baru</span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display font-bold text-sm text-slate-900">{n.title}</h2>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <div className="text-[11px] text-slate-400">
                    Penerima relevan:{' '}
                    {n.targetUserIds
                      .map((uid) => PIC_USERS.find((u) => u.id === uid)?.name ?? uid)
                      .join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(n.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Dibaca</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onJumpToIndicator(n.componentId, n.indicatorId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                  >
                    <span>Lihat Butir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
