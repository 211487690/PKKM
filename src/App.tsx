import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Bell,
  Briefcase,
  CheckCheck,
  ClipboardCheck,
  Cloud,
  CloudOff,
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
import { auth } from './firebase';
import {
  apiArchiveIndicator,
  apiConsumeGoogleRedirect,
  apiLoadState,
  apiLogout,
  apiMarkNotificationsRead,
  apiSignInWithGoogle,
  apiSignInWithGoogleRedirect,
  apiUpdateIndicator,
  apiVerifySession,
  type AuthUser,
} from './utils/pkkmClient';
import {
  checkCloudMembership,
  ensureCloudSeeded,
  fsArchiveIndicator,
  fsMarkNotificationsRead,
  fsRemoveCollaborator,
  fsUpdateIndicator,
  fsUpsertCollaborator,
  normalizeEmail,
  subscribeToPkkmCloud,
  type CloudTeamMember,
} from './utils/pkkmFirestore';

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
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [cloudUser, setCloudUser] = useState<{
    uid: string;
    email: string;
    isAdmin: boolean;
  } | null>(null);
  const [cloudMembers, setCloudMembers] = useState<CloudTeamMember[]>([]);
  const [connectingCloud, setConnectingCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudCanRedirect, setCloudCanRedirect] = useState<boolean>(false);
  const [fatalError, setFatalError] = useState<Error | null>(null);
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

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    let mounted = true;

    apiConsumeGoogleRedirect().then((redirectRes) => {
      if (!mounted || !redirectRes) return;
      if (!redirectRes.ok) {
        setCloudError(redirectRes.error);
        setCloudCanRedirect(false);
      }
    });

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return;
      if (fbUser && fbUser.email) {
        const cleanEmail = normalizeEmail(fbUser.email);
        try {
          const membership = await checkCloudMembership(cleanEmail);
          if (!mounted) return;
          if (membership.allowed) {
            await ensureCloudSeeded(cleanEmail, fbUser.uid);
            if (!mounted) return;
            setCloudError(null);
            setCloudCanRedirect(false);
            setCloudUser((prev) =>
              prev?.uid === fbUser.uid && prev?.email === cleanEmail
                ? prev
                : {
                    uid: fbUser.uid,
                    email: cleanEmail,
                    isAdmin: membership.isBootstrapAdmin,
                  }
            );
            setAuthUser({
              username: cleanEmail,
              name: fbUser.displayName || membership.member?.name || cleanEmail,
              authMode: 'google',
              email: cleanEmail,
              uid: fbUser.uid,
              isCloudAdmin: membership.isBootstrapAdmin,
            });
            if (membership.member?.picId) {
              setActiveUserId(membership.member.picId);
            }
            setAuthChecking(false);
            return;
          } else {
            setCloudError(
              `Email ${cleanEmail} belum didaftarkan sebagai kolaborator aktif. Masuklah menggunakan email Administrator (zaeymar@gmail.com) atau minta Administrator mendaftarkan ${cleanEmail} di menu Tim & PIC Pelaksana.`
            );
            await signOut(auth).catch(() => {});
          }
        } catch (err) {
          if (mounted) {
            const msg = err instanceof Error ? err.message : String(err);
            setCloudError(`Gagal memverifikasi akses Firestore: ${msg}`);
          }
        }
      }

      if (!mounted) return;
      setCloudUser(null);
      setCloudMembers([]);
      try {
        const localUser = await apiVerifySession();
        if (mounted) {
          setAuthUser(localUser);
        }
      } catch {
        // Ignore session check failure and render login
      } finally {
        if (mounted) setAuthChecking(false);
      }
    });

    return () => {
      mounted = false;
      unsubAuth();
    };
  }, []);

  const loadLocalOrServerState = useCallback(async () => {
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
    if (!authUser) return;

    if (cloudUser) {
      setLoading(true);
      const unsubCloud = subscribeToPkkmCloud(cloudUser.email, {
        onProgress: (map) => {
          setProgressMap(map);
          setLoading(false);
        },
        onNotifications: (list) => {
          setNotifications(list);
        },
        onMembers: (members) => {
          setCloudMembers(members);
        },
        onFatalError: (err) => {
          setFatalError(err);
        },
      });
      return () => {
        unsubCloud();
      };
    }

    loadLocalOrServerState();
  }, [authUser, cloudUser, loadLocalOrServerState]);

  const handleLoginSuccess = (token: string, user: AuthUser) => {
    if (user.authMode !== 'google') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setAuthUser(user);
      setLoading(true);
    } else if (user.email && user.uid) {
      setCloudUser({
        uid: user.uid,
        email: user.email,
        isAdmin: Boolean(user.isCloudAdmin),
      });
      setAuthUser(user);
      setLoading(true);
    }
  };

  const handleConnectCloud = async () => {
    setConnectingCloud(true);
    setCloudError(null);
    setCloudCanRedirect(false);
    try {
      const res = await apiSignInWithGoogle();
      if (!res.ok) {
        setCloudError(res.error);
        setCloudCanRedirect(Boolean(res.canUseRedirect));
        showToast(res.error);
        return;
      }
      if (res.user.email && res.user.uid) {
        await ensureCloudSeeded(res.user.email, res.user.uid);
        setCloudError(null);
        setCloudCanRedirect(false);
        setCloudUser((prev) =>
          prev?.uid === res.user.uid && prev?.email === res.user.email
            ? prev
            : {
                uid: res.user.uid!,
                email: res.user.email!,
                isAdmin: Boolean(res.user.isCloudAdmin),
              }
        );
        setAuthUser(res.user);
        showToast(`Terhubung ke Cloud Firestore (${res.user.email}) · Sinkronisasi real-time aktif!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const errText = `Gagal menghubungkan ke Cloud Firestore: ${msg}`;
      setCloudError(errText);
      showToast(errText);
    } finally {
      setConnectingCloud(false);
    }
  };

  const handleConnectCloudRedirect = async () => {
    setConnectingCloud(true);
    setCloudError(null);
    const errRes = await apiSignInWithGoogleRedirect();
    if (errRes && !errRes.ok) {
      setCloudError(errRes.error);
      setConnectingCloud(false);
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    setCloudUser(null);
    setCloudMembers([]);
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
    const ind = ALL_INDICATORS.find((i) => i.id === indicatorId);
    const targetNames = (ind?.pics ?? [])
      .filter((pid) => pid !== activeUserId)
      .map((pid) => PIC_USERS.find((u) => u.id === pid)?.name)
      .filter(Boolean);

    if (cloudUser) {
      try {
        await fsUpdateIndicator(
          indicatorId,
          { ...payload, actorId: activeUserId },
          progressMap,
          cloudUser.email,
          cloudUser.uid
        );
        showToast(
          targetNames.length > 0
            ? `Tersinkron ke Cloud · Notifikasi terkirim ke ${targetNames.join(', ')} & pimpinan`
            : 'Tersinkron ke Cloud · Notifikasi terkirim ke Kepala Madrasah & Administrator'
        );
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

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

      showToast(
        targetNames.length > 0
          ? `Progres disimpan · Notifikasi otomatis terkirim ke ${targetNames.join(', ')} & pimpinan`
          : 'Progres disimpan · Notifikasi otomatis terkirim ke Kepala Madrasah & Administrator'
      );
    }
  };

  const handleMarkRead = async (notificationId?: string) => {
    if (cloudUser) {
      try {
        await fsMarkNotificationsRead(activeUserId, notifications, notificationId);
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }
    const nextNotifs = await apiMarkNotificationsRead(activeUserId, notificationId);
    if (nextNotifs) {
      setNotifications(nextNotifs);
    }
  };

  const handleArchiveIndicator = async (indicatorId: string, archived: boolean) => {
    if (cloudUser) {
      try {
        await fsArchiveIndicator(
          { indicatorId, archived, actorId: activeUserId },
          progressMap,
          cloudUser.email,
          cloudUser.uid
        );
        showToast(
          archived
            ? 'Indikator diarsipkan ke Cloud · Fokus aktif kini tertuju pada item belum selesai'
            : 'Indikator dikembalikan ke daftar Fokus Pengerjaan Aktif'
        );
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

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
    if (cloudUser) {
      try {
        const res = await fsArchiveIndicator(
          { bulkCompleted: true, actorId: activeUserId },
          progressMap,
          cloudUser.email,
          cloudUser.uid
        );
        const count = res.archivedCount ?? 0;
        showToast(
          count > 0
            ? `${count} indikator selesai berhasil diarsipkan dan disinkronkan ke Cloud`
            : 'Tidak ada indikator selesai yang perlu diarsipkan'
        );
      } catch (err) {
        setFatalError(err instanceof Error ? err : new Error(String(err)));
      }
      return;
    }

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

  const handleUpsertCloudMember = async (params: {
    email: string;
    name: string;
    picId: string;
    active: boolean;
  }) => {
    if (!cloudUser) return;
    try {
      await fsUpsertCollaborator(params, cloudUser.uid);
      showToast(`Akses kolaborator ${params.email} diperbarui dan disinkronkan.`);
    } catch (err) {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleRemoveCloudMember = async (email: string) => {
    if (!cloudUser) return;
    try {
      await fsRemoveCollaborator(email, cloudUser.uid);
      showToast(`Akses kolaborator ${email} dihapus.`);
    } catch (err) {
      setFatalError(err instanceof Error ? err : new Error(String(err)));
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

          <div className="flex items-center gap-2.5 shrink-0 relative">
            {cloudUser ? (
              <div
                title={`Sinkronisasi Cloud Real-Time Aktif (${cloudUser.email})`}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-teal-50 border border-teal-200 text-teal-800 rounded-lg whitespace-nowrap"
              >
                <Cloud className="w-3.5 h-3.5 text-teal-700" />
                <span>Cloud Real-Time</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={connectingCloud}
                onClick={handleConnectCloud}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800 rounded-lg hover:bg-amber-100 disabled:opacity-60 whitespace-nowrap"
              >
                <CloudOff className="w-3.5 h-3.5 text-amber-700" />
                <span>{connectingCloud ? 'Menghubungkan...' : 'Hubungkan Cloud'}</span>
              </button>
            )}

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

        {/* Banner Ajakan Sinkronisasi Cloud Saat Berjalan di Mode Lokal */}
        {!cloudUser && (
          <div className="mx-4 sm:mx-6 mt-4 space-y-2">
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold">Mode Lokal (Hanya 1 Perangkat):</span> Perubahan
                saat ini tersimpan di browser ini saja. Hubungkan akun Google Administrator agar
                data sinkron real-time ke seluruh perangkat tim.
              </div>
              <button
                type="button"
                disabled={connectingCloud}
                onClick={handleConnectCloud}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{connectingCloud ? 'Menghubungkan...' : 'Hubungkan Google Cloud'}</span>
              </button>
            </div>

            {cloudError && (
              <div
                role="alert"
                className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="leading-relaxed space-y-1">
                  <div className="font-semibold text-rose-900">Koneksi Google Cloud Belum Berhasil</div>
                  <div>{cloudError}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cloudCanRedirect && (
                    <button
                      type="button"
                      onClick={handleConnectCloudRedirect}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-semibold hover:bg-rose-800 whitespace-nowrap"
                    >
                      Coba Mode Redirect
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCloudError(null)}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-800 hover:bg-rose-100"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                  cloudConnected={Boolean(cloudUser)}
                  isCloudAdmin={Boolean(cloudUser?.isAdmin)}
                  cloudEmail={cloudUser?.email}
                  cloudMembers={cloudMembers}
                  connectingCloud={connectingCloud}
                  cloudError={cloudError}
                  cloudCanRedirect={cloudCanRedirect}
                  onConnectCloud={handleConnectCloud}
                  onConnectCloudRedirect={handleConnectCloudRedirect}
                  onUpsertCloudMember={handleUpsertCloudMember}
                  onRemoveCloudMember={handleRemoveCloudMember}
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
