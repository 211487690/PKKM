import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ALL_INDICATORS,
  COMPONENTS_META,
  PIC_USERS,
  type IndicatorProgress,
  type ProgressNotification,
  type SubmissionStatus,
} from '../data/pkkmData';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export const BOOTSTRAP_ADMIN_EMAIL = 'zaeymar@gmail.com';
const MAX_ALLOWED_EMAILS = 20;
const MAX_LOKASI_LEN = 500;
const MAX_CATATAN_LEN = 1000;
const MAX_TITLE_LEN = 200;
const MAX_MESSAGE_LEN = 600;
const MAX_ACTOR_NAME_LEN = 120;

export interface CloudTeamMember {
  email: string;
  name: string;
  picId: string;
  active: boolean;
  addedByUid: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBootstrapAdminEmail(email?: string | null): boolean {
  return Boolean(email && normalizeEmail(email) === BOOTSTRAP_ADMIN_EMAIL);
}

function clampString(val: string, maxLen: number): string {
  return val.slice(0, maxLen);
}

function buildDefaultProgressMap(): Record<string, IndicatorProgress> {
  const map: Record<string, IndicatorProgress> = {};
  for (const ind of ALL_INDICATORS) {
    map[ind.id] = {
      indicatorId: ind.id,
      status: 'belum',
      checkedSubItems: [],
      lokasiBerkas: '',
      catatan: '',
      updatedBy: '',
      updatedAt: '',
      archived: false,
    };
  }
  return map;
}

export async function checkCloudMembership(email: string): Promise<{
  allowed: boolean;
  isBootstrapAdmin: boolean;
  member: CloudTeamMember | null;
}> {
  const cleanEmail = normalizeEmail(email);
  if (isBootstrapAdminEmail(cleanEmail)) {
    return {
      allowed: true,
      isBootstrapAdmin: true,
      member: {
        email: cleanEmail,
        name: 'Administrator MIS Almaarif 06',
        picId: 'tata-usaha',
        active: true,
        addedByUid: auth.currentUser?.uid || '',
      },
    };
  }

  const memberPath = `members/${cleanEmail}`;
  try {
    const snap = await getDoc(doc(db, 'members', cleanEmail));
    if (!snap.exists()) {
      return { allowed: false, isBootstrapAdmin: false, member: null };
    }
    const data = snap.data() as CloudTeamMember;
    return {
      allowed: Boolean(data.active),
      isBootstrapAdmin: false,
      member: data,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, memberPath);
  }
}

async function getAllowedEmailsList(currentEmail: string): Promise<string[]> {
  const cleanCurrent = normalizeEmail(currentEmail);
  const emails = new Set<string>([BOOTSTRAP_ADMIN_EMAIL]);
  if (cleanCurrent) emails.add(cleanCurrent);

  if (isBootstrapAdminEmail(cleanCurrent)) {
    try {
      const snap = await getDocs(collection(db, 'members'));
      snap.forEach((docSnap) => {
        const d = docSnap.data() as Partial<CloudTeamMember>;
        if (d.active && typeof d.email === 'string') {
          emails.add(normalizeEmail(d.email));
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'members');
    }
  } else {
    // Active members inspect existing doc or fallback to bootstrap + self
    try {
      const sampleSnap = await getDocs(
        query(collection(db, 'indicators'), where('allowedEmails', 'array-contains', cleanCurrent), limit(1))
      );
      if (!sampleSnap.empty) {
        const existingAllowed = sampleSnap.docs[0].data().allowedEmails;
        if (Array.isArray(existingAllowed)) {
          for (const e of existingAllowed) {
            if (typeof e === 'string') emails.add(normalizeEmail(e));
          }
        }
      }
    } catch {
      // Safe fallback to [bootstrap, self]
    }
  }

  return Array.from(emails).slice(0, MAX_ALLOWED_EMAILS);
}

export async function ensureCloudSeeded(userEmail: string, userUid: string): Promise<void> {
  const cleanEmail = normalizeEmail(userEmail);
  if (!isBootstrapAdminEmail(cleanEmail)) return;

  try {
    const checkSnap = await getDocs(query(collection(db, 'indicators'), limit(1)));
    if (!checkSnap.empty) return;

    const allowedEmails = await getAllowedEmailsList(cleanEmail);
    const nowIso = new Date().toISOString();
    const batch = writeBatch(db);

    for (const ind of ALL_INDICATORS) {
      batch.set(doc(db, 'indicators', ind.id), {
        indicatorId: ind.id,
        componentId: ind.componentId,
        no: ind.no,
        status: 'belum',
        checkedSubItems: [],
        lokasiBerkas: '',
        catatan: '',
        updatedBy: 'tata-usaha',
        updatedByUid: userUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
        archived: false,
        allowedEmails,
      });
    }

    batch.set(doc(db, 'notifications', 'notif-init-1'), {
      id: 'notif-init-1',
      actorId: 'tata-usaha',
      actorName: 'Tata Usaha / Administrator',
      actorUid: userUid,
      targetUserIds: PIC_USERS.map((u) => u.id).slice(0, 20),
      indicatorId: 'k1-1',
      componentId: 1,
      indicatorNo: 1,
      type: 'status_change',
      title: 'Instrumen PKKM 2026 Level 4 Siap Diisi (Cloud Real-Time)',
      message:
        '89 butir indikator dalam 4 komponen telah terhubung ke database cloud Firestore. Setiap perubahan otomatis tersinkron ke seluruh perangkat tim.',
      createdAt: nowIso,
      serverCreatedAt: serverTimestamp(),
      readBy: [],
      allowedEmails,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'indicators');
  }
}

export function subscribeToPkkmCloud(
  userEmail: string,
  callbacks: {
    onProgress: (progressMap: Record<string, IndicatorProgress>) => void;
    onNotifications: (notifications: ProgressNotification[]) => void;
    onMembers?: (members: CloudTeamMember[]) => void;
    onFatalError: (err: Error) => void;
  }
): Unsubscribe {
  const cleanEmail = normalizeEmail(userEmail);
  const isAdmin = isBootstrapAdminEmail(cleanEmail);

  const indicatorsSource = isAdmin
    ? collection(db, 'indicators')
    : query(collection(db, 'indicators'), where('allowedEmails', 'array-contains', cleanEmail));

  const unsubIndicators = onSnapshot(
    indicatorsSource,
    (snapshot) => {
      const merged = buildDefaultProgressMap();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const indMeta = ALL_INDICATORS.find((i) => i.id === docSnap.id);
        if (!indMeta) return;
        merged[docSnap.id] = {
          indicatorId: docSnap.id,
          status:
            d.status === 'disetorkan' || d.status === 'proses'
              ? (d.status as SubmissionStatus)
              : 'belum',
          checkedSubItems: Array.isArray(d.checkedSubItems)
            ? d.checkedSubItems.filter(
                (n): n is number => typeof n === 'number' && n >= 0 && n < indMeta.buktiFisik.length
              )
            : [],
          lokasiBerkas: typeof d.lokasiBerkas === 'string' ? d.lokasiBerkas : '',
          catatan: typeof d.catatan === 'string' ? d.catatan : '',
          updatedBy: typeof d.updatedBy === 'string' ? d.updatedBy : '',
          updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : '',
          archived: Boolean(d.archived),
          archivedBy: typeof d.archivedBy === 'string' ? d.archivedBy : undefined,
          archivedAt: typeof d.archivedAt === 'string' ? d.archivedAt : undefined,
        };
      });
      callbacks.onProgress(merged);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'indicators');
      } catch (structuredErr) {
        callbacks.onFatalError(
          structuredErr instanceof Error ? structuredErr : new Error(String(structuredErr))
        );
      }
    }
  );

  const notificationsSource = isAdmin
    ? query(collection(db, 'notifications'), limit(120))
    : query(
        collection(db, 'notifications'),
        where('allowedEmails', 'array-contains', cleanEmail),
        limit(120)
      );

  const unsubNotifications = onSnapshot(
    notificationsSource,
    (snapshot) => {
      const list: ProgressNotification[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          actorId: typeof d.actorId === 'string' ? d.actorId : 'tata-usaha',
          actorName: typeof d.actorName === 'string' ? d.actorName : 'Pengelola',
          targetUserIds: Array.isArray(d.targetUserIds) ? d.targetUserIds : [],
          indicatorId: typeof d.indicatorId === 'string' ? d.indicatorId : 'k1-1',
          componentId: typeof d.componentId === 'number' ? d.componentId : 1,
          indicatorNo: typeof d.indicatorNo === 'number' ? d.indicatorNo : 1,
          type:
            d.type === 'subitem_check' ||
            d.type === 'location_update' ||
            d.type === 'milestone' ||
            d.type === 'archive_update'
              ? d.type
              : 'status_change',
          title: typeof d.title === 'string' ? d.title : '',
          message: typeof d.message === 'string' ? d.message : '',
          createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
          readBy: Array.isArray(d.readBy) ? d.readBy : [],
        });
      });
      // Sort client-side newest first so no Firestore composite index is required
      list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      callbacks.onNotifications(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      } catch (structuredErr) {
        callbacks.onFatalError(
          structuredErr instanceof Error ? structuredErr : new Error(String(structuredErr))
        );
      }
    }
  );

  let unsubMembers: Unsubscribe | null = null;
  if (isAdmin && callbacks.onMembers) {
    unsubMembers = onSnapshot(
      collection(db, 'members'),
      (snapshot) => {
        const members: CloudTeamMember[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          members.push({
            email: typeof d.email === 'string' ? d.email : docSnap.id,
            name: typeof d.name === 'string' ? d.name : docSnap.id,
            picId: typeof d.picId === 'string' ? d.picId : 'tata-usaha',
            active: Boolean(d.active),
            addedByUid: typeof d.addedByUid === 'string' ? d.addedByUid : '',
          });
        });
        members.sort((a, b) => a.email.localeCompare(b.email));
        callbacks.onMembers?.(members);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, 'members');
        } catch (structuredErr) {
          callbacks.onFatalError(
            structuredErr instanceof Error ? structuredErr : new Error(String(structuredErr))
          );
        }
      }
    );
  }

  return () => {
    unsubIndicators();
    unsubNotifications();
    if (unsubMembers) unsubMembers();
  };
}

export async function fsUpdateIndicator(
  indicatorId: string,
  payload: {
    status?: SubmissionStatus;
    checkedSubItems?: number[];
    lokasiBerkas?: string;
    catatan?: string;
    actionType: 'status_change' | 'subitem_check' | 'location_update';
    subItemIndex?: number;
    actorId: string;
  },
  currentProgressMap: Record<string, IndicatorProgress>,
  userEmail: string,
  userUid: string
): Promise<void> {
  const indicator = ALL_INDICATORS.find((i) => i.id === indicatorId);
  if (!indicator) return;

  const prev = currentProgressMap[indicatorId] ?? {
    indicatorId,
    status: 'belum',
    checkedSubItems: [],
    lokasiBerkas: '',
    catatan: '',
    updatedBy: '',
    updatedAt: '',
    archived: false,
  };

  const actor = PIC_USERS.find((u) => u.id === payload.actorId) ?? PIC_USERS[1];
  const nowIso = new Date().toISOString();

  const nextChecked = Array.isArray(payload.checkedSubItems)
    ? [...new Set(payload.checkedSubItems)]
        .filter((n) => n >= 0 && n < indicator.buktiFisik.length)
        .sort((a, b) => a - b)
        .slice(0, 30)
    : prev.checkedSubItems.slice(0, 30);

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

  const nextLokasi = clampString(
    typeof payload.lokasiBerkas === 'string' ? payload.lokasiBerkas : prev.lokasiBerkas,
    MAX_LOKASI_LEN
  );
  const nextCatatan = clampString(
    typeof payload.catatan === 'string' ? payload.catatan : prev.catatan,
    MAX_CATATAN_LEN
  );

  const cleanEmail = normalizeEmail(userEmail);
  const allowedEmails = await getAllowedEmailsList(cleanEmail);
  const indRef = doc(db, 'indicators', indicatorId);

  try {
    const existingSnap = await getDoc(indRef);
    const batch = writeBatch(db);

    if (existingSnap.exists()) {
      batch.update(indRef, {
        status: nextStatus,
        checkedSubItems: nextChecked,
        lokasiBerkas: nextLokasi,
        catatan: nextCatatan,
        updatedBy: clampString(actor.id, 64),
        updatedByUid: userUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });
    } else {
      batch.set(indRef, {
        indicatorId,
        componentId: indicator.componentId,
        no: indicator.no,
        status: nextStatus,
        checkedSubItems: nextChecked,
        lokasiBerkas: nextLokasi,
        catatan: nextCatatan,
        updatedBy: clampString(actor.id, 64),
        updatedByUid: userUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
        archived: false,
        allowedEmails,
      });
    }

    const targetUsers = Array.from(
      new Set([...indicator.pics, 'ahmad-syaikhu', 'tata-usaha'])
    ).slice(0, 20);
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

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      actorId: clampString(actor.id, 64),
      actorName: clampString(actor.name, MAX_ACTOR_NAME_LEN),
      actorUid: userUid,
      targetUserIds: targetUsers,
      indicatorId: indicator.id,
      componentId: indicator.componentId,
      indicatorNo: indicator.no,
      type: payload.actionType,
      title: clampString(notifTitle, MAX_TITLE_LEN),
      message: clampString(notifMessage, MAX_MESSAGE_LEN),
      createdAt: nowIso,
      serverCreatedAt: serverTimestamp(),
      readBy: [actor.id],
      allowedEmails,
    });

    // Check component milestone crossing
    const compIndicators = ALL_INDICATORS.filter((i) => i.componentId === indicator.componentId);
    const prevDone = compIndicators.filter(
      (i) => currentProgressMap[i.id]?.status === 'disetorkan'
    ).length;
    const prevPct = Math.round((prevDone / compIndicators.length) * 100);

    const nextDone = compIndicators.filter((i) => {
      if (i.id === indicatorId) return nextStatus === 'disetorkan';
      return currentProgressMap[i.id]?.status === 'disetorkan';
    }).length;
    const nextPct = Math.round((nextDone / compIndicators.length) * 100);
    const compMeta = COMPONENTS_META.find((c) => c.id === indicator.componentId);

    for (const threshold of [25, 50, 75, 100]) {
      if (prevPct < threshold && nextPct >= threshold) {
        const msId = `notif-ms-k${indicator.componentId}-${threshold}-${Date.now()}`;
        const compPics = Array.from(
          new Set(compIndicators.flatMap((i) => i.pics).concat(['ahmad-syaikhu', 'tata-usaha']))
        ).slice(0, 20);
        batch.set(doc(db, 'notifications', msId), {
          id: msId,
          actorId: clampString(actor.id, 64),
          actorName: clampString(actor.name, MAX_ACTOR_NAME_LEN),
          actorUid: userUid,
          targetUserIds: compPics,
          indicatorId: indicator.id,
          componentId: indicator.componentId,
          indicatorNo: indicator.no,
          type: 'milestone',
          title: clampString(
            `Capaian Komponen ${indicator.componentId} Mencapai ${threshold}%`,
            MAX_TITLE_LEN
          ),
          message: clampString(
            `${compMeta?.title ?? ''} kini telah menyetorkan ${nextDone} dari ${compIndicators.length} indikator (${nextPct}%).`,
            MAX_MESSAGE_LEN
          ),
          createdAt: nowIso,
          serverCreatedAt: serverTimestamp(),
          readBy: [],
          allowedEmails,
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `indicators/${indicatorId}`);
  }
}

export async function fsArchiveIndicator(
  params: {
    indicatorId?: string;
    archived?: boolean;
    bulkCompleted?: boolean;
    actorId: string;
  },
  currentProgressMap: Record<string, IndicatorProgress>,
  userEmail: string,
  userUid: string
): Promise<{ archivedCount?: number }> {
  const actor = PIC_USERS.find((u) => u.id === params.actorId) ?? PIC_USERS[1];
  const nowIso = new Date().toISOString();
  const allowedEmails = await getAllowedEmailsList(userEmail);

  try {
    if (params.bulkCompleted) {
      const targetIds = ALL_INDICATORS.filter(
        (i) =>
          currentProgressMap[i.id]?.status === 'disetorkan' &&
          !currentProgressMap[i.id]?.archived
      ).map((i) => i.id);

      if (targetIds.length === 0) return { archivedCount: 0 };

      const batch = writeBatch(db);
      for (const id of targetIds) {
        batch.update(doc(db, 'indicators', id), {
          archived: true,
          archivedBy: clampString(actor.id, 64),
          archivedAt: nowIso,
          updatedBy: clampString(actor.id, 64),
          updatedByUid: userUid,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        });
      }

      const notifId = `notif-arch-bulk-${Date.now()}`;
      batch.set(doc(db, 'notifications', notifId), {
        id: notifId,
        actorId: clampString(actor.id, 64),
        actorName: clampString(actor.name, MAX_ACTOR_NAME_LEN),
        actorUid: userUid,
        targetUserIds: PIC_USERS.map((u) => u.id).slice(0, 20),
        indicatorId: targetIds[0],
        componentId: 1,
        indicatorNo: 1,
        type: 'archive_update',
        title: clampString(`${targetIds.length} Indikator Selesai Diarsipkan`, MAX_TITLE_LEN),
        message: clampString(
          `${actor.name} memindahkan ${targetIds.length} indikator yang sudah disetorkan ke Area Arsip agar tim fokus pada butir yang belum selesai.`,
          MAX_MESSAGE_LEN
        ),
        createdAt: nowIso,
        serverCreatedAt: serverTimestamp(),
        readBy: [actor.id],
        allowedEmails,
      });

      await batch.commit();
      return { archivedCount: targetIds.length };
    }

    if (!params.indicatorId) return {};
    const ind = ALL_INDICATORS.find((i) => i.id === params.indicatorId);
    if (!ind) return {};

    const nextArchived = Boolean(params.archived);
    const batch = writeBatch(db);
    const indRef = doc(db, 'indicators', ind.id);

    if (nextArchived) {
      batch.update(indRef, {
        archived: true,
        archivedBy: clampString(actor.id, 64),
        archivedAt: nowIso,
        updatedBy: clampString(actor.id, 64),
        updatedByUid: userUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });
    } else {
      batch.update(indRef, {
        archived: false,
        archivedBy: deleteField(),
        archivedAt: deleteField(),
        updatedBy: clampString(actor.id, 64),
        updatedByUid: userUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });
    }

    const targetUsers = Array.from(
      new Set([...ind.pics, 'ahmad-syaikhu', 'tata-usaha'])
    ).slice(0, 20);
    const notifId = `notif-arch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    batch.set(doc(db, 'notifications', notifId), {
      id: notifId,
      actorId: clampString(actor.id, 64),
      actorName: clampString(actor.name, MAX_ACTOR_NAME_LEN),
      actorUid: userUid,
      targetUserIds: targetUsers,
      indicatorId: ind.id,
      componentId: ind.componentId,
      indicatorNo: ind.no,
      type: 'archive_update',
      title: clampString(
        nextArchived
          ? `K${ind.componentId} Butir #${ind.no} Diarsipkan`
          : `K${ind.componentId} Butir #${ind.no} Dikembalikan dari Arsip`,
        MAX_TITLE_LEN
      ),
      message: clampString(
        nextArchived
          ? `${actor.name} memindahkan indikator K${ind.componentId} #${ind.no} ke Area Arsip.`
          : `${actor.name} mengembalikan indikator K${ind.componentId} #${ind.no} ke daftar fokus pengerjaan aktif.`,
        MAX_MESSAGE_LEN
      ),
      createdAt: nowIso,
      serverCreatedAt: serverTimestamp(),
      readBy: [actor.id],
      allowedEmails,
    });

    await batch.commit();
    return {};
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      params.indicatorId ? `indicators/${params.indicatorId}` : 'indicators'
    );
  }
}

export async function fsMarkNotificationsRead(
  userId: string,
  currentNotifications: ProgressNotification[],
  notificationId?: string
): Promise<void> {
  const targets = currentNotifications.filter((n) => {
    if (notificationId && n.id !== notificationId) return false;
    return !n.readBy.includes(userId);
  });
  if (targets.length === 0) return;

  try {
    const batch = writeBatch(db);
    for (const n of targets.slice(0, 120)) {
      const nextReadBy = [...n.readBy, clampString(userId, 64)].slice(0, 25);
      batch.update(doc(db, 'notifications', n.id), {
        readBy: nextReadBy,
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      notificationId ? `notifications/${notificationId}` : 'notifications'
    );
  }
}

async function propagateAllowedEmailsToDocs(
  allowedEmails: string[],
  adminUid: string
): Promise<void> {
  const nowIso = new Date().toISOString();
  try {
    const indSnap = await getDocs(collection(db, 'indicators'));
    const notifSnap = await getDocs(query(collection(db, 'notifications'), limit(120)));

    const batch = writeBatch(db);
    indSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        allowedEmails,
        updatedByUid: adminUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });
    });
    notifSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        allowedEmails,
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'indicators');
  }
}

export async function fsUpsertCollaborator(
  params: { email: string; name: string; picId: string; active: boolean },
  adminUid: string
): Promise<void> {
  const cleanEmail = normalizeEmail(params.email);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Alamat email Google tidak valid.');
  }

  const memberRef = doc(db, 'members', cleanEmail);
  try {
    const existing = await getDoc(memberRef);
    if (existing.exists()) {
      await updateDoc(memberRef, {
        name: clampString(params.name.trim() || cleanEmail, 120),
        picId: clampString(params.picId || 'tata-usaha', 64),
        active: Boolean(params.active),
        addedByUid: adminUid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(memberRef, {
        email: cleanEmail,
        name: clampString(params.name.trim() || cleanEmail, 120),
        picId: clampString(params.picId || 'tata-usaha', 64),
        active: Boolean(params.active),
        addedByUid: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const updatedAllowed = await getAllowedEmailsList(BOOTSTRAP_ADMIN_EMAIL);
    await propagateAllowedEmailsToDocs(updatedAllowed, adminUid);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `members/${cleanEmail}`);
  }
}

export async function fsRemoveCollaborator(email: string, adminUid: string): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  try {
    await deleteDoc(doc(db, 'members', cleanEmail));
    const updatedAllowed = await getAllowedEmailsList(BOOTSTRAP_ADMIN_EMAIL);
    await propagateAllowedEmailsToDocs(updatedAllowed, adminUid);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `members/${cleanEmail}`);
  }
}
