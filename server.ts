import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  PIC_USERS,
  type IndicatorProgress,
  type ProgressNotification,
  type SubmissionStatus,
} from './src/data/pkkmData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'pkkm_state.json');
const AUTH_SECRET_FILE = path.join(DATA_DIR, '.auth-secret');
const PHP_DEPLOY_DIR = path.resolve(__dirname, 'php-vercel-deploy');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASS_HASH = crypto.createHash('sha256').update('admin123').digest();

function getAuthSecret(): string {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(AUTH_SECRET_FILE)) {
    const existing = fs.readFileSync(AUTH_SECRET_FILE, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(AUTH_SECRET_FILE, secret, 'utf8');
  return secret;
}

function signSessionToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      u: username,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 hari
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): { username: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      u?: string;
      exp?: number;
    };
    if (!decoded.u || !decoded.exp || Date.now() > decoded.exp) return null;
    return { username: decoded.u };
  } catch {
    return null;
  }
}

interface ServerState {
  progress: Record<string, IndicatorProgress>;
  notifications: ProgressNotification[];
  emittedMilestones: Record<string, boolean>;
}

function sqlEscape(str: string): string {
  return "'" + str.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function ensurePhpSeedSql(): void {
  const seedPath = path.join(PHP_DEPLOY_DIR, 'database', 'seed.sql');
  const lines: string[] = [
    '-- Data Seed Lengkap SIP-PKKM 2026 MIS ALMAARIF 06 TOYOMARTO',
    '-- Berisi 12 PIC, 4 Komponen, 89 Butir Indikator, dan seluruh sub-item Bukti Fisik Level 4',
    'USE `pkkm_almaarif06`;',
    '',
    'SET FOREIGN_KEY_CHECKS = 0;',
    'TRUNCATE TABLE `notification_reads`;',
    'TRUNCATE TABLE `notifications`;',
    'TRUNCATE TABLE `indicator_pics`;',
    'TRUNCATE TABLE `bukti_fisik_items`;',
    'TRUNCATE TABLE `indicators`;',
    'TRUNCATE TABLE `components`;',
    'TRUNCATE TABLE `users`;',
    'SET FOREIGN_KEY_CHECKS = 1;',
    '',
  ];

  // Users
  for (const u of PIC_USERS) {
    lines.push(
      `INSERT INTO \`users\` (\`id\`, \`name\`, \`role\`, \`initials\`, \`is_admin\`) VALUES (${sqlEscape(u.id)}, ${sqlEscape(u.name)}, ${sqlEscape(u.role)}, ${sqlEscape(u.initials)}, ${u.isAdmin ? 1 : 0});`
    );
  }
  lines.push('');

  // Components
  for (const c of COMPONENTS_META) {
    lines.push(
      `INSERT INTO \`components\` (\`id\`, \`code\`, \`title\`, \`short_title\`, \`category\`, \`total_indicators\`, \`max_score\`, \`description\`) VALUES (${c.id}, ${sqlEscape(c.code)}, ${sqlEscape(c.title)}, ${sqlEscape(c.shortTitle)}, ${sqlEscape(c.category)}, ${c.totalIndicators}, ${c.maxScore}, ${sqlEscape(c.description)});`
    );
  }
  lines.push('');

  // Indicators, Bukti Fisik Items, and Indicator PICs
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
  fs.writeFileSync(seedPath, lines.join('\n') + '\n', 'utf8');
}

function createInitialState(): ServerState {
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

  const now = new Date().toISOString();
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
    createdAt: now,
    readBy: [],
  };

  return {
    progress,
    notifications: [initialNotif],
    emittedMilestones: {},
  };
}

function loadState(): ServerState {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    const initial = createInitialState();
    fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as ServerState;
    for (const ind of ALL_INDICATORS) {
      if (!parsed.progress[ind.id]) {
        parsed.progress[ind.id] = {
          indicatorId: ind.id,
          status: 'belum',
          checkedSubItems: [],
          lokasiBerkas: '',
          catatan: '',
          updatedBy: '',
          updatedAt: '',
        };
      }
    }
    if (!parsed.emittedMilestones) parsed.emittedMilestones = {};
    if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
    return parsed;
  } catch {
    const initial = createInitialState();
    fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

function saveState(state: ServerState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, STATE_FILE);
}

function collectFilesRecursively(
  dirPath: string,
  baseDir: string
): { path: string; content: string | Buffer; isBinary: boolean }[] {
  const results: { path: string; content: string | Buffer; isBinary: boolean }[] = [];
  if (!fs.existsSync(dirPath)) return results;

  const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ico', '.pdf']);
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursively(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const isBinary = binaryExts.has(ext);
      results.push({
        path: relPath,
        content: isBinary ? fs.readFileSync(fullPath) : fs.readFileSync(fullPath, 'utf8'),
        isBinary,
      });
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

async function startServer() {
  ensurePhpSeedSql();
  let state = loadState();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 0. Authentication endpoints
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const cleanUser = String(username ?? '').trim();
    const passHash = crypto.createHash('sha256').update(String(password ?? '')).digest();

    const userValid = cleanUser === ADMIN_USERNAME;
    const passValid =
      passHash.length === ADMIN_PASS_HASH.length &&
      crypto.timingSafeEqual(passHash, ADMIN_PASS_HASH);

    if (!userValid || !passValid) {
      res.status(401).json({ error: 'Username atau password tidak sesuai.' });
      return;
    }

    const token = signSessionToken(cleanUser);
    res.json({
      token,
      user: {
        username: cleanUser,
        name: 'Administrator MI Almaarif 06 Toyomarto',
      },
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const verified = verifySessionToken(token);
    if (!verified) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      user: {
        username: verified.username,
        name: 'Administrator MI Almaarif 06 Toyomarto',
      },
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

  // 1. State endpoint
  app.get('/api/state', (_req, res) => {
    res.json({
      progress: state.progress,
      notifications: state.notifications,
    });
  });

  // 2. Update indicator progress & emit automatic relevant notifications
  app.post('/api/progress/:indicatorId', (req, res) => {
    const { indicatorId } = req.params;
    const indicator = ALL_INDICATORS.find((i) => i.id === indicatorId);
    if (!indicator) {
      res.status(404).json({ error: 'Indikator tidak ditemukan' });
      return;
    }

    const {
      status,
      checkedSubItems,
      lokasiBerkas,
      catatan,
      actorId,
      actionType,
      subItemIndex,
    } = req.body as {
      status?: SubmissionStatus;
      checkedSubItems?: number[];
      lokasiBerkas?: string;
      catatan?: string;
      actorId?: string;
      actionType?: 'status_change' | 'subitem_check' | 'location_update';
      subItemIndex?: number;
    };

    const actor = PIC_USERS.find((u) => u.id === actorId) ?? PIC_USERS[1];
    const prev = state.progress[indicatorId];
    const now = new Date().toISOString();

    const nextChecked = Array.isArray(checkedSubItems)
      ? [...new Set(checkedSubItems)].filter((n) => n >= 0 && n < indicator.buktiFisik.length).sort((a, b) => a - b)
      : prev.checkedSubItems;

    let nextStatus: SubmissionStatus = status ?? prev.status;
    if (actionType === 'subitem_check' && !status) {
      if (nextChecked.length >= indicator.buktiFisik.length && indicator.buktiFisik.length > 0) {
        nextStatus = 'disetorkan';
      } else if (nextChecked.length > 0) {
        nextStatus = 'proses';
      } else {
        nextStatus = 'belum';
      }
    }

    const nextLokasi = typeof lokasiBerkas === 'string' ? lokasiBerkas : prev.lokasiBerkas;
    const nextCatatan = typeof catatan === 'string' ? catatan : prev.catatan;

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

    // Relevant target users: co-PICs assigned to this indicator + Kepala Madrasah + Tata Usaha/Admin
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

    if (actionType === 'subitem_check' && typeof subItemIndex === 'number') {
      const wasChecked = nextChecked.includes(subItemIndex);
      notifTitle = `Bukti Fisik K${indicator.componentId} #${indicator.no} (${nextChecked.length}/${indicator.buktiFisik.length})`;
      notifMessage = `${actor.name} ${wasChecked ? 'mencentang/menyetor' : 'membatalkan'} berkas #${subItemIndex + 1} · Status saat ini: ${statusLabel}.`;
    } else if (actionType === 'location_update') {
      notifTitle = `Lokasi Berkas K${indicator.componentId} #${indicator.no} Diperbarui`;
      notifMessage = `${actor.name} menyimpan lokasi arsip/tautan berkas: "${nextLokasi || '-'}".`;
    }

    const newNotif: ProgressNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId: actor.id,
      actorName: actor.name,
      targetUserIds: targetUsers,
      indicatorId: indicator.id,
      componentId: indicator.componentId,
      indicatorNo: indicator.no,
      type: actionType ?? 'status_change',
      title: notifTitle,
      message: notifMessage,
      createdAt: now,
      readBy: [actor.id],
    };

    state.notifications.unshift(newNotif);

    // Check component milestone (25%, 50%, 75%, 100%)
    const compIndicators = ALL_INDICATORS.filter((i) => i.componentId === indicator.componentId);
    const doneCount = compIndicators.filter((i) => state.progress[i.id]?.status === 'disetorkan').length;
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
    saveState(state);

    res.json({
      progress: state.progress[indicatorId],
      notifications: state.notifications,
    });
  });

  // 2b. Archive / unarchive indicators (single or bulk completed)
  app.post('/api/archive', (req, res) => {
    const { indicatorId, archived, bulkCompleted, actorId } = req.body as {
      indicatorId?: string;
      archived?: boolean;
      bulkCompleted?: boolean;
      actorId?: string;
    };

    const actor = PIC_USERS.find((u) => u.id === actorId) ?? PIC_USERS[1];
    const now = new Date().toISOString();

    if (bulkCompleted) {
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
      saveState(state);
      res.json({
        archivedCount: targetIds.length,
        progress: state.progress,
        notifications: state.notifications,
      });
      return;
    }

    if (!indicatorId || !state.progress[indicatorId]) {
      res.status(404).json({ error: 'Indikator tidak ditemukan' });
      return;
    }

    const ind = ALL_INDICATORS.find((i) => i.id === indicatorId)!;
    const nextArchived = Boolean(archived);
    state.progress[indicatorId] = {
      ...state.progress[indicatorId],
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
    saveState(state);

    res.json({
      progress: state.progress,
      notifications: state.notifications,
    });
  });

  // 3. Mark notifications read for a specific user
  app.post('/api/notifications/read', (req, res) => {
    const { userId, notificationId } = req.body as { userId: string; notificationId?: string };
    if (!userId) {
      res.status(400).json({ error: 'userId wajib diisi' });
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

  // 4. Reset demo progress if requested
  app.post('/api/reset', (_req, res) => {
    state = createInitialState();
    saveState(state);
    res.json({
      progress: state.progress,
      notifications: state.notifications,
    });
  });

  // 5. Inspectable PHP Native PDO + MySQL + Tailwind CSS files
  app.get('/api/php-files', (_req, res) => {
    const files = collectFilesRecursively(PHP_DEPLOY_DIR, PHP_DEPLOY_DIR)
      .filter((f) => !f.isBinary)
      .map((f) => ({ path: f.path, content: String(f.content) }));
    res.json({ files });
  });

  // 6. Download ready-to-deploy ZIP for GitHub & Vercel
  app.get('/api/download-php-zip', async (_req, res) => {
    try {
      const files = collectFilesRecursively(PHP_DEPLOY_DIR, PHP_DEPLOY_DIR);
      const zip = new JSZip();
      for (const f of files) {
        zip.file(f.path, f.content);
      }
      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="sip-pkkm-2026-php-pdo-vercel.zip"');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: 'Gagal membuat arsip ZIP PHP' });
    }
  });

  // Vite or Static Hosting
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`SIP-PKKM 2026 server running on http://0.0.0.0:${port}`);
  });
}

startServer();
