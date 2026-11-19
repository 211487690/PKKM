import { signInWithPopup, signOut } from 'firebase/auth';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  PIC_USERS,
  type IndicatorProgress,
  type ProgressNotification,
  type SubmissionStatus,
} from '../data/pkkmData';
import { auth, googleProvider } from '../firebase';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  checkCloudMembership,
  normalizeEmail,
} from './pkkmFirestore';

const AUTH_TOKEN_KEY = 'pkkm_auth_token';
const LOCAL_STATE_KEY = 'pkkm_static_state_v1';

// SHA-256 hex digest of the administrator default credential
const ADMIN_USER = 'admin';
const ADMIN_PASS_SHA256 = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

export interface AuthUser {
  username: string;
  name: string;
  authMode?: 'local' | 'google';
  email?: string;
  uid?: string;
  isCloudAdmin?: boolean;
}

interface LocalState {
  progress: Record<string, IndicatorProgress>;
  notifications: ProgressNotification[];
  emittedMilestones: Record<string, boolean>;
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Minimal pure-JS SHA-256 fallback if crypto.subtle is unavailable (non-HTTPS localhost)
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const bytes = Array.from(new TextEncoder().encode(text));
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff);
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < bytes.length; i += 64) {
    const w = new Array<number>(64);
    for (let t = 0; t < 16; t++) {
      w[t] =
        (bytes[i + t * 4] << 24) |
        (bytes[i + t * 4 + 1] << 16) |
        (bytes[i + t * 4 + 2] << 8) |
        bytes[i + t * 4 + 3];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

function createInitialLocalState(): LocalState {
  const progress: Record<string, IndicatorProgress> = {};
  for (const ind of ALL_INDICATORS) {
    progress[ind.id] = {
      indicatorId: ind.id,
      status: 'belum',
      checkedSubItems: [],
      lokasiBerkas: '',
      catatan: '',
      updatedBy: '',
      updatedAt: '',
    };
  }
  const initialNotif: ProgressNotification = {
    id: 'notif-init-1',
    actorId: 'tata-usaha',
    actorName: 'Tata Usaha / Administrator',
    targetUserIds: PIC_USERS.map((u) => u.id),
    indicatorId: 'k1-1',
    componentId: 1,
    indicatorNo: 1,
    type: 'status_change',
    title: 'Instrumen PKKM 2026 Level 4 Siap Diisi',
    message:
      '89 butir indikator dalam 4 komponen telah dimuat. Setiap pembaruan progres akan mengirimkan notifikasi otomatis kepada pelaksana terkait dan pimpinan.',
    createdAt: new Date().toISOString(),
    readBy: [],
  };
  return {
    progress,
    notifications: [initialNotif],
    emittedMilestones: {},
  };
}

function loadLocalState(): LocalState {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) {
      const init = createInitialLocalState();
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw) as Partial<LocalState>;
    const normalizedProgress: Record<string, IndicatorProgress> = {};
    for (const ind of ALL_INDICATORS) {
      const existing = parsed.progress?.[ind.id];
      normalizedProgress[ind.id] = {
        indicatorId: ind.id,
        status:
          existing?.status === 'disetorkan' || existing?.status === 'proses'
            ? existing.status
            : 'belum',
        checkedSubItems: Array.isArray(existing?.checkedSubItems)
          ? existing.checkedSubItems.filter(
              (n): n is number => typeof n === 'number' && n >= 0 && n < ind.buktiFisik.length
            )
          : [],
        lokasiBerkas: typeof existing?.lokasiBerkas === 'string' ? existing.lokasiBerkas : '',
        catatan: typeof existing?.catatan === 'string' ? existing.catatan : '',
        updatedBy: typeof existing?.updatedBy === 'string' ? existing.updatedBy : '',
        updatedAt: typeof existing?.updatedAt === 'string' ? existing.updatedAt : '',
        archived: Boolean(existing?.archived),
        archivedBy: typeof existing?.archivedBy === 'string' ? existing.archivedBy : undefined,
        archivedAt: typeof existing?.archivedAt === 'string' ? existing.archivedAt : undefined,
      };
    }
    return {
      progress: normalizedProgress,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      emittedMilestones:
        parsed.emittedMilestones && typeof parsed.emittedMilestones === 'object'
          ? parsed.emittedMilestones
          : {},
    };
  } catch {
    return createInitialLocalState();
  }
}

function saveLocalState(state: LocalState): void {
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.toLowerCase().includes('application/json');
}

export async function apiLogin(
  username: string,
  password: string
): Promise<{ ok: true; token: string; user: AuthUser } | { ok: false; error: string }> {
  const cleanUser = username.trim().toLowerCase();
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUser, password }),
    });
    if (isJsonResponse(res)) {
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        return { ok: true, token: data.token, user: data.user };
      }
      // Only stop immediately when the real auth endpoint explicitly rejects credentials (401)
      if (res.status === 401) {
        return { ok: false, error: data.error || 'Username atau password tidak sesuai.' };
      }
    }
  } catch {
    // Backend API unavailable (static deployment such as Vercel SPA) -> verify locally
  }

  // Static deployment fallback verification
  const digest = await sha256Hex(password);
  if (cleanUser === ADMIN_USER && digest === ADMIN_PASS_SHA256) {
    const token = `local.${btoa(JSON.stringify({ u: ADMIN_USER, exp: Date.now() + 86400000 * 7 }))}`;
    return {
      ok: true,
      token,
      user: {
        username: ADMIN_USER,
        name: 'Administrator MI Almaarif 06 Toyomarto',
      },
    };
  }
  return { ok: false, error: 'Username atau password tidak sesuai.' };
}

export async function apiVerifySession(): Promise<AuthUser | null> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return null;

  if (token.startsWith('local.')) {
    try {
      const payload = JSON.parse(atob(token.slice(6))) as { u?: string; exp?: number };
      if (payload.u === ADMIN_USER && payload.exp && Date.now() < payload.exp) {
        return {
          username: payload.u,
          name: 'Administrator MI Almaarif 06 Toyomarto',
        };
      }
    } catch {
      // Invalid local token
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (isJsonResponse(res)) {
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) return data.user;
      }
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
  } catch {
    // Fall through
  }
  return null;
}

export async function apiSignInWithGoogle(): Promise<
  { ok: true; token: string; user: AuthUser } | { ok: false; error: string }
> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const fbUser = credential.user;
    const rawEmail = fbUser.email || '';
    if (!rawEmail) {
      await signOut(auth).catch(() => {});
      return { ok: false, error: 'Akun Google tidak memiliki alamat email yang terverifikasi.' };
    }
    const cleanEmail = normalizeEmail(rawEmail);
    const membership = await checkCloudMembership(cleanEmail);
    if (!membership.allowed) {
      await signOut(auth).catch(() => {});
      return {
        ok: false,
        error: `Email ${cleanEmail} belum didaftarkan sebagai kolaborator aktif. Hubungi Administrator (${BOOTSTRAP_ADMIN_EMAIL}) untuk menambahkan akses di menu Tim & PIC Pelaksana.`,
      };
    }

    localStorage.removeItem(AUTH_TOKEN_KEY);
    return {
      ok: true,
      token: 'firebase-google',
      user: {
        username: cleanEmail,
        name: fbUser.displayName || membership.member?.name || cleanEmail,
        authMode: 'google',
        email: cleanEmail,
        uid: fbUser.uid,
        isCloudAdmin: membership.isBootstrapAdmin,
      },
    };
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';
    const msg = err instanceof Error ? err.message : String(err);

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { ok: false, error: 'Proses masuk Google dibatalkan.' };
    }
    if (code === 'auth/popup-blocked') {
      return {
        ok: false,
        error: 'Pop-up login diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.',
      };
    }
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
      return {
        ok: false,
        error: `Domain "${host}" belum diizinkan di Firebase Authentication. Tambahkan "${host}" pada Firebase Console -> Authentication -> Settings -> Authorized domains.`,
      };
    }
    return {
      ok: false,
      error: `Gagal menghubungkan akun Google Cloud: ${msg}`,
    };
  }
}

export async function apiLogout(): Promise<void> {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  try {
    if (auth.currentUser) {
      await signOut(auth);
    }
  } catch {
    // Ignore sign-out errors
  }
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore on static hosting
  }
}

export async function apiLoadState(): Promise<{
  progress: Record<string, IndicatorProgress>;
  notifications: ProgressNotification[];
}> {
  try {
    const res = await fetch('/api/state');
    if (res.ok && isJsonResponse(res)) {
      const data = await res.json();
      return {
        progress: data.progress || {},
        notifications: data.notifications || [],
      };
    }
  } catch {
    // Static mode fallback
  }
  const local = loadLocalState();
  return { progress: local.progress, notifications: local.notifications };
}

export async function apiUpdateIndicator(
  indicatorId: string,
  payload: {
    status?: SubmissionStatus;
    checkedSubItems?: number[];
    lokasiBerkas?: string;
    catatan?: string;
    actionType: 'status_change' | 'subitem_check' | 'location_update';
    subItemIndex?: number;
    actorId: string;
  }
): Promise<{ progress: IndicatorProgress; notifications: ProgressNotification[] } | null> {
  try {
    const res = await fetch(`/api/progress/${encodeURIComponent(indicatorId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok && isJsonResponse(res)) {
      return await res.json();
    }
  } catch {
    // Static mode fallback
  }

  // Local state update + automatic relevant notifications
  const state = loadLocalState();
  const indicator = ALL_INDICATORS.find((i) => i.id === indicatorId);
  if (!indicator) return null;

  const actor = PIC_USERS.find((u) => u.id === payload.actorId) ?? PIC_USERS[1];
  const prev = state.progress[indicatorId];
  const now = new Date().toISOString();

  const nextChecked = Array.isArray(payload.checkedSubItems)
    ? [...new Set(payload.checkedSubItems)]
        .filter((n) => n >= 0 && n < indicator.buktiFisik.length)
        .sort((a, b) => a - b)
    : prev.checkedSubItems;

  let nextStatus: SubmissionStatus = payload.status ?? prev.status;
  if (payload.actionType === 'subitem_check' && !payload.status) {
    if (nextChecked.length >= indicator.buktiFisik.length && indicator.buktiFisik.length > 0) {
      nextStatus = 'disetorkan';
    } else if (nextChecked.length > 0) {
      nextStatus = 'proses';
    } else {
      nextStatus = 'belum';
    }
  }

  const nextLokasi =
    typeof payload.lokasiBerkas === 'string' ? payload.lokasiBerkas : prev.lokasiBerkas;
  const nextCatatan = typeof payload.catatan === 'string' ? payload.catatan : prev.catatan;

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
    archivedAt: prev.archivedAt,
  };

  const targetUsers = Array.from(
    new Set([...indicator.pics, 'ahmad-syaikhu', 'tata-usaha'])
  );
  const statusLabel =
    nextStatus === 'disetorkan'
      ? 'Sudah Disetorkan (Lengkap)'
      : nextStatus === 'proses'
      ? 'Dalam Proses'
      : 'Belum Disetor';

  let notifTitle = `Update K${indicator.componentId} Butir #${indicator.no}`;
  let notifMessage = `${actor.name} memperbarui progres indikator "${indicator.indikatorKinerja.slice(0, 72)}..." → Status: ${statusLabel}.`;

  if (payload.actionType === 'subitem_check' && typeof payload.subItemIndex === 'number') {
    const wasChecked = nextChecked.includes(payload.subItemIndex);
    notifTitle = `Bukti Fisik K${indicator.componentId} #${indicator.no} (${nextChecked.length}/${indicator.buktiFisik.length})`;
    notifMessage = `${actor.name} ${wasChecked ? 'mencentang/menyetor' : 'membatalkan'} berkas #${payload.subItemIndex + 1} · Status saat ini: ${statusLabel}.`;
  } else if (payload.actionType === 'location_update') {
    notifTitle = `Lokasi Berkas K${indicator.componentId} #${indicator.no} Diperbarui`;
    notifMessage = `${actor.name} menyimpan lokasi arsip/tautan berkas: "${nextLokasi || '-'}".`;
  }

  state.notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor.id,
    actorName: actor.name,
    targetUserIds: targetUsers,
    indicatorId: indicator.id,
    componentId: indicator.componentId,
    indicatorNo: indicator.no,
    type: payload.actionType,
    title: notifTitle,
    message: notifMessage,
    createdAt: now,
    readBy: [actor.id],
  });

  const compIndicators = ALL_INDICATORS.filter((i) => i.componentId === indicator.componentId);
  const doneCount = compIndicators.filter(
    (i) => state.progress[i.id]?.status === 'disetorkan'
  ).length;
  const pct = Math.round((doneCount / compIndicators.length) * 100);
  const compMeta = COMPONENTS_META.find((c) => c.id === indicator.componentId);

  for (const threshold of [25, 50, 75, 100]) {
    const mKey = `k${indicator.componentId}-${threshold}`;
    if (pct >= threshold && !state.emittedMilestones[mKey]) {
      state.emittedMilestones[mKey] = true;
      const compPics = Array.from(
        new Set(compIndicators.flatMap((i) => i.pics).concat(['ahmad-syaikhu', 'tata-usaha']))
      );
      state.notifications.unshift({
        id: `notif-ms-${mKey}-${Date.now()}`,
        actorId: actor.id,
        actorName: actor.name,
        targetUserIds: compPics,
        indicatorId: indicator.id,
        componentId: indicator.componentId,
        indicatorNo: indicator.no,
        type: 'milestone',
        title: `Capaian Komponen ${indicator.componentId} Mencapai ${threshold}%`,
        message: `${compMeta?.title ?? ''} kini telah menyetorkan ${doneCount} dari ${compIndicators.length} indikator (${pct}%).`,
        createdAt: now,
        readBy: [],
      });
    }
  }

  state.notifications = state.notifications.slice(0, 120);
  saveLocalState(state);

  return {
    progress: state.progress[indicatorId],
    notifications: state.notifications,
  };
}

export async function apiArchiveIndicator(params: {
  indicatorId?: string;
  archived?: boolean;
  bulkCompleted?: boolean;
  actorId: string;
}): Promise<{
  progress: Record<string, IndicatorProgress>;
  notifications: ProgressNotification[];
  archivedCount?: number;
} | null> {
  try {
    const res = await fetch('/api/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok && isJsonResponse(res)) {
      return await res.json();
    }
  } catch {
    // Static mode fallback
  }

  const state = loadLocalState();
  const actor = PIC_USERS.find((u) => u.id === params.actorId) ?? PIC_USERS[1];
  const now = new Date().toISOString();

  if (params.bulkCompleted) {
    const targetIds = ALL_INDICATORS.filter(
      (i) => state.progress[i.id]?.status === 'disetorkan' && !state.progress[i.id]?.archived
    ).map((i) => i.id);

    for (const id of targetIds) {
      state.progress[id] = {
        ...state.progress[id],
        archived: true,
        archivedBy: actor.id,
        archivedAt: now,
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
        type: 'archive_update',
        title: `${targetIds.length} Indikator Selesai Diarsipkan`,
        message: `${actor.name} memindahkan ${targetIds.length} indikator yang sudah disetorkan ke Area Arsip agar tim fokus pada butir yang belum selesai.`,
        createdAt: now,
        readBy: [actor.id],
      });
    }

    state.notifications = state.notifications.slice(0, 120);
    saveLocalState(state);
    return {
      archivedCount: targetIds.length,
      progress: state.progress,
      notifications: state.notifications,
    };
  }

  if (!params.indicatorId || !state.progress[params.indicatorId]) return null;
  const ind = ALL_INDICATORS.find((i) => i.id === params.indicatorId)!;
  const nextArchived = Boolean(params.archived);

  state.progress[params.indicatorId] = {
    ...state.progress[params.indicatorId],
    archived: nextArchived,
    archivedBy: nextArchived ? actor.id : undefined,
    archivedAt: nextArchived ? now : undefined,
  };

  const targetUsers = Array.from(new Set([...ind.pics, 'ahmad-syaikhu', 'tata-usaha']));
  state.notifications.unshift({
    id: `notif-arch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor.id,
    actorName: actor.name,
    targetUserIds: targetUsers,
    indicatorId: ind.id,
    componentId: ind.componentId,
    indicatorNo: ind.no,
    type: 'archive_update',
    title: nextArchived
      ? `K${ind.componentId} Butir #${ind.no} Diarsipkan`
      : `K${ind.componentId} Butir #${ind.no} Dikembalikan dari Arsip`,
    message: nextArchived
      ? `${actor.name} memindahkan indikator K${ind.componentId} #${ind.no} ke Area Arsip.`
      : `${actor.name} mengembalikan indikator K${ind.componentId} #${ind.no} ke daftar fokus pengerjaan aktif.`,
    createdAt: now,
    readBy: [actor.id],
  });

  state.notifications = state.notifications.slice(0, 120);
  saveLocalState(state);
  return {
    progress: state.progress,
    notifications: state.notifications,
  };
}

export async function apiMarkNotificationsRead(
  userId: string,
  notificationId?: string
): Promise<ProgressNotification[] | null> {
  try {
    const res = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, notificationId }),
    });
    if (res.ok && isJsonResponse(res)) {
      const data = await res.json();
      return data.notifications || [];
    }
  } catch {
    // Static mode fallback
  }

  const state = loadLocalState();
  state.notifications = state.notifications.map((n) => {
    if (notificationId && n.id !== notificationId) return n;
    if (!n.readBy.includes(userId)) {
      return { ...n, readBy: [...n.readBy, userId] };
    }
    return n;
  });
  saveLocalState(state);
  return state.notifications;
}
