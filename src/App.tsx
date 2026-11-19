import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Briefcase,
  CheckCheck,
  ClipboardCheck,
  Code2,
  Download,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  MADRASAH_INFO,
  PIC_USERS,
  type IndicatorProgress,
  type ProgressNotification,
  type SubmissionStatus,
} from './data/pkkmData';
import { DashboardView } from './components/DashboardView';
import { ComponentChecklistView } from './components/ComponentChecklistView';
import { TeamPicView } from './components/TeamPicView';
import { NotificationsView } from './components/NotificationsView';
import { PhpDeployView } from './components/PhpDeployView';
import { LoginView } from './components/LoginView';
import {
  apiArchiveIndicator,
  apiLoadState,
  apiLogout,
  apiMarkNotificationsRead,
  apiUpdateIndicator,
  apiVerifySession,
} from './utils/pkkmClient';

const AUTH_TOKEN_KEY = 'pkkm_auth_token';

type NavTab =
  | 'dashboard'
  | 'component-1'
  | 'component-2'
  | 'component-3'
  | 'component-4'
  | 'team'
  | 'notifications'
  | 'php-deploy';

export default function App() {
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [authUser, setAuthUser] = useState<{ username: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeUserId, setActiveUserId] = useState<string>('tata-usaha');
  const [progressMap, setProgressMap] = useState<Record<string, IndicatorProgress>>({});
  const [notifications, setNotifications] = useState<ProgressNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState<boolean>(false);
  const [highlightedIndicatorId, setHighlightedIndicatorId] = useState<string | null>(null);
  const [selectedTeamPicId, setSelectedTeamPicId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const verifySession = async () => {
      try {
        const user = await apiVerifySession();
        if (!cancelled && user) {
          setAuthUser(user);
        }
      } catch {
        // Ignore session check failure and render login
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };
    verifySession();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadState = useCallback(async () => {
    try {
      const data = await apiLoadState();
      setProgressMap(data.progress || {});
      setNotifications(data.notifications || []);
    } catch {
      setToastMsg('Gagal memuat sebagian data progres. Menggunakan data lokal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      loadState();
    }
  }, [authUser, loadState]);

  const handleLoginSuccess = (token: string, user: { username: string; name: string }) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
    setLoading(true);
  };

  const handleLogout = async () => {
    await apiLogout();
    setAuthUser(null);
    setActiveTab('dashboard');
  };

  const activeUser = useMemo(
    () => PIC_USERS.find((u) => u.id === activeUserId) ?? PIC_USERS[1],
    [activeUserId]
  );

  const relevantNotifications = useMemo(
    () =>
      notifications.filter(
        (n) => n.targetUserIds.includes(activeUserId) || n.actorId === activeUserId
      ),
    [notifications, activeUserId]
  );

  const unreadRelevantCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.targetUserIds.includes(activeUserId) &&
          !n.readBy.includes(activeUserId) &&
          n.actorId !== activeUserId
      ).length,
    [notifications, activeUserId]
  );

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3500);
  };

  const handleUpdateIndicator = async (
    indicatorId: string,
    payload: {
      status?: SubmissionStatus;
      checkedSubItems?: number[];
      lokasiBerkas?: string;
      catatan?: string;
      actionType: 'status_change' | 'subitem_check' | 'location_update';
      subItemIndex?: number;
    }
  ) => {
    const data = await apiUpdateIndicator(indicatorId, {
      ...payload,
      actorId: activeUserId,
    });

    if (data) {
      setProgressMap((prev) => ({
        ...prev,
        [indicatorId]: data.progress,
      }));
      setNotifications(data.notifications || []);

      const ind = ALL_INDICATORS.find((i) => i.id === indicatorId);
      const targetNames = (ind?.pics ?? [])
        .filter((pid) => pid !== activeUserId)
        .map((pid) => PIC_USERS.find((u) => u.id === pid)?.name)
        .filter(Boolean);

      showToast(
        targetNames.length > 0
          ? `Progres disimpan · Notifikasi otomatis terkirim ke ${targetNames.join(', ')} & pimpinan`
          : 'Progres disimpan · Notifikasi otomatis terkirim ke Kepala Madrasah & Administrator'
      );
    }
  };

  const handleMarkRead = async (notificationId?: string) => {
    const nextNotifs = await apiMarkNotificationsRead(activeUserId, notificationId);
    if (nextNotifs) {
      setNotifications(nextNotifs);
    }
  };

  const handleArchiveIndicator = async (indicatorId: string, archived: boolean) => {
    const data = await apiArchiveIndicator({
      indicatorId,
      archived,
      actorId: activeUserId,
    });
    if (data) {
      setProgressMap(data.progress || {});
      setNotifications(data.notifications || []);
      showToast(
        archived
          ? 'Indikator dipindahkan ke Area Arsip · Fokus aktif kini tertuju pada item belum selesai'
          : 'Indikator dikembalikan ke daftar Fokus Pengerjaan Aktif'
      );
    }
  };

  const handleBulkArchiveCompleted = async () => {
    const data = await apiArchiveIndicator({
      bulkCompleted: true,
      actorId: activeUserId,
    });
    if (data) {
      setProgressMap(data.progress || {});
      setNotifications(data.notifications || []);
      const count = data.archivedCount ?? 0;
      showToast(
        count > 0
          ? `${count} indikator yang sudah disetorkan berhasil dipindahkan ke Area Arsip`
          : 'Tidak ada indikator selesai yang perlu diarsipkan'
      );
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Komponen',
      'No',
      'Unsur Tugas',
      'Indikator Kinerja',
      'PIC / Pelaksana',
      'Status Penyetoran',
      'Bukti Fisik Tercentang',
      'Total Bukti Fisik',
      'Lokasi Berkas / Link Drive',
      'Catatan',
    ];

    const rows = ALL_INDICATORS.map((ind) => {
      const comp = COMPONENTS_META.find((c) => c.id === ind.componentId);
      const prog = progressMap[ind.id];
      const statusText =
        prog?.status === 'disetorkan'
          ? 'SUDAH DISETORKAN'
          : prog?.status === 'proses'
          ? 'DALAM PROSES'
          : 'BELUM DISETOR';

      return [
        `Komponen ${ind.componentId} - ${comp?.title ?? ''}`,
        String(ind.no),
        ind.unsurTugas,
        ind.indikatorKinerja,
        ind.rawKeterangan,
        statusText,
        String(prog?.checkedSubItems?.length ?? 0),
        String(ind.buktiFisik.length),
        prog?.lokasiBerkas ?? '',
        prog?.catatan ?? '',
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ceklist-pkkm-2026-mi-almaarif-06-toyomarto.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const jumpToIndicator = (componentId: number, indicatorId: string) => {
    setHighlightedIndicatorId(indicatorId);
    setActiveTab(`component-${componentId}` as NavTab);
    setNotifPopoverOpen(false);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`indicator-${indicatorId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const getComponentProgress = (compId: number) => {
    const inds = ALL_INDICATORS.filter((i) => i.componentId === compId);
    const done = inds.filter((i) => progressMap[i.id]?.status === 'disetorkan').length;
    return { done, total: inds.length };
  };

  const breadcrumbLabel = useMemo(() => {
    if (activeTab === 'dashboard') return 'Dashboard Ringkasan';
    if (activeTab.startsWith('component-')) {
      const cid = Number(activeTab.split('-')[1]);
      const c = COMPONENTS_META.find((m) => m.id === cid);
      return `Komponen ${cid} · ${c?.title ?? ''}`;
    }
    if (activeTab === 'team') return 'Tim & PIC Pelaksana';
    if (activeTab === 'notifications') return 'Notifikasi Progres Otomatis';
    return 'Paket Deploy PHP Native (GitHub & Vercel)';
  }, [activeTab]);

  const componentIcons: Record<number, React.ReactNode> = {
    1: <ClipboardCheck className="w-4 h-4 shrink-0" />,
    2: <Briefcase className="w-4 h-4 shrink-0" />,
    3: <ShieldCheck className="w-4 h-4 shrink-0" />,
    4: <Users className="w-4 h-4 shrink-0" />,
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full text-slate-100">
      <div className="p-5 border-b border-teal-800/70 bg-teal-950/40 flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center border border-teal-400/30">
          <img
            src="/assets/aistudio/LOGO_MIA_06_23b19dba.png"
            alt="Logo MI Almaarif 06"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold text-teal-300 tracking-wider truncate">
            {MADRASAH_INFO.namaMadrasah}
          </div>
          <div className="font-display text-base font-bold text-white mt-0.5 tracking-wide truncate">
            SIP-PKKM 2026
          </div>
          <div className="text-[11px] text-slate-300">
            Ceklist Level 4 · 89 Indikator
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            setHighlightedIndicatorId(null);
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-teal-500/25 text-white border border-teal-400/30'
              : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2.5 truncate">
            <LayoutDashboard className="w-4 h-4 shrink-0 text-teal-300" />
            <span className="truncate">Dashboard Ringkasan</span>
          </span>
          <span
            className={`font-mono text-xs tabular-nums ${
              activeTab === 'dashboard' ? 'text-teal-200 font-semibold' : 'text-slate-400'
            }`}
          >
            89
          </span>
        </button>

        {/* Menu Terpisah untuk Setiap Komponen */}
        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
          Komponen Penilaian
        </div>
        {COMPONENTS_META.map((comp) => {
          const tabKey = `component-${comp.id}` as NavTab;
          const isActive = activeTab === tabKey;
          const stats = getComponentProgress(comp.id);

          return (
            <button
              key={comp.id}
              type="button"
              onClick={() => {
                setActiveTab(tabKey);
                setHighlightedIndicatorId(null);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-500/25 text-white border border-teal-400/30'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className={isActive ? 'text-teal-200' : 'text-teal-300/80'}>
                  {componentIcons[comp.id]}
                </span>
                <span className="truncate">
                  {comp.id}. {comp.shortTitle}
                </span>
              </span>
              <span
                className={`font-mono text-xs tabular-nums shrink-0 ${
                  isActive ? 'text-teal-200 font-semibold' : 'text-slate-400'
                }`}
              >
                {stats.done}/{stats.total}
              </span>
            </button>
          );
        })}

        <div className="pt-4 pb-1 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
          Tim, Notifikasi &amp; Deploy
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedTeamPicId(null);
            setActiveTab('team');
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'team'
              ? 'bg-teal-500/25 text-white border border-teal-400/30'
              : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2.5 truncate">
            <Users className="w-4 h-4 shrink-0 text-teal-300" />
            <span className="truncate">Tim &amp; PIC Pelaksana</span>
          </span>
          <span
            className={`font-mono text-xs tabular-nums ${
              activeTab === 'team' ? 'text-teal-200 font-semibold' : 'text-slate-400'
            }`}
          >
            {PIC_USERS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('notifications');
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-teal-500/25 text-white border border-teal-400/30'
              : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2.5 truncate">
            <Bell className="w-4 h-4 shrink-0 text-teal-300" />
            <span className="truncate">Notifikasi Progres</span>
          </span>
          {unreadRelevantCount > 0 && (
            <span className="font-mono text-xs font-semibold tabular-nums text-teal-300">
              {unreadRelevantCount} baru
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('php-deploy');
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'php-deploy'
              ? 'bg-teal-500/25 text-white border border-teal-400/30'
              : 'text-slate-200 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
        >
          <span className="flex items-center gap-2.5 truncate">
            <Code2 className="w-4 h-4 shrink-0 text-teal-300" />
            <span className="truncate">Deploy PHP (Vercel)</span>
          </span>
        </button>
      </nav>

      {/* Active User / PIC Session Switcher */}
      <div className="p-4 border-t border-slate-700/80 bg-slate-900/50 space-y-2">
        <label htmlFor="active-user-select" className="block text-xs font-medium text-slate-300">
          User Aktif (Sesi Update &amp; Notifikasi)
        </label>
        <select
          id="active-user-select"
          value={activeUserId}
          onChange={(e) => setActiveUserId(e.target.value)}
          className="w-full px-2.5 py-2 text-xs bg-slate-800 text-slate-100 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400"
        >
          {PIC_USERS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 text-xs font-medium text-slate-600">
          Memeriksa sesi autentikasi...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar — Hijau Tosca & Abu-abu */}
      <aside className="hidden lg:block w-72 bg-gradient-to-b from-teal-900 via-teal-950 to-slate-800 border-r border-slate-700/60 shrink-0 sticky top-0 h-screen">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer — Hijau Tosca & Abu-abu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-gradient-to-b from-teal-900 via-teal-950 to-slate-800 h-full border-r border-slate-700/60 z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 p-1.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="text-sm text-slate-500 truncate">
              <span>PKKM 2026</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative">
            <button
              type="button"
              onClick={() => setNotifPopoverOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 whitespace-nowrap shrink-0"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Notifikasi</span>
              <span
                className={`font-mono tabular-nums ${
                  unreadRelevantCount > 0 ? 'text-teal-700 font-bold' : 'text-slate-500'
                }`}
              >
                {unreadRelevantCount}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari akun"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Keluar</span>
            </button>

            {/* Popover Notifikasi Progres Relevan */}
            {notifPopoverOpen && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-900">
                    Notifikasi Relevan · {activeUser.name}
                  </div>
                  {unreadRelevantCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Tandai Dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {relevantNotifications.slice(0, 8).map((n) => {
                    const isUnread =
                      n.targetUserIds.includes(activeUserId) &&
                      !n.readBy.includes(activeUserId) &&
                      n.actorId !== activeUserId;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          handleMarkRead(n.id);
                          jumpToIndicator(n.componentId, n.indicatorId);
                        }}
                        className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors ${
                          isUnread ? 'bg-teal-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-teal-700">
                            K{n.componentId} #{n.indicatorNo}
                          </span>
                          <span className="font-mono tabular-nums">
                            {new Date(n.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">{n.title}</div>
                        <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifPopoverOpen(false);
                      setActiveTab('notifications');
                    }}
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Buka Semua Notifikasi Progres →
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="mx-4 sm:mx-6 mt-4 px-4 py-2.5 bg-teal-900 text-white text-xs font-medium rounded-lg flex items-center justify-between gap-3">
            <span>{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-teal-200 hover:text-white"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="h-36 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse" />
                <div className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'dashboard' ? (
                <DashboardView
                  progressMap={progressMap}
                  isAdmin={activeUser.isAdmin}
                  onNavigate={(tab) => setActiveTab(tab as NavTab)}
                  onSelectPic={(picId) => {
                    setSelectedTeamPicId(picId);
                    setActiveTab('team');
                  }}
                  onJumpToIndicator={jumpToIndicator}
                  onArchiveIndicator={handleArchiveIndicator}
                  onBulkArchiveCompleted={handleBulkArchiveCompleted}
                />
              ) : activeTab.startsWith('component-') ? (
                <ComponentChecklistView
                  key={activeTab}
                  componentId={Number(activeTab.split('-')[1])}
                  progressMap={progressMap}
                  highlightedIndicatorId={highlightedIndicatorId}
                  onUpdateIndicator={handleUpdateIndicator}
                />
              ) : activeTab === 'team' ? (
                <TeamPicView
                  progressMap={progressMap}
                  initialSelectedPicId={selectedTeamPicId}
                  onJumpToIndicator={jumpToIndicator}
                />
              ) : activeTab === 'notifications' ? (
                <NotificationsView
                  notifications={notifications}
                  activeUserId={activeUserId}
                  onMarkRead={handleMarkRead}
                  onJumpToIndicator={jumpToIndicator}
                />
              ) : (
                <PhpDeployView />
              )}
            </motion.div>
          )}
        </main>

        {/* Footnote Sesuai Permintaan */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {MADRASAH_INFO.namaMadrasah} · NSM {MADRASAH_INFO.nsm} / NPSN {MADRASAH_INFO.npsn} · Periode {MADRASAH_INFO.periodePenilaian}
          </div>
          <div className="font-semibold text-slate-700">
            Developer By Administrator MI Almaarif 06 Toyomarto
          </div>
        </footer>
      </div>
    </div>
  );
}
