export * from './pkkmMeta';
import { INDICATORS_K1 } from './indicatorsK1';
import { INDICATORS_K2 } from './indicatorsK2';
import { INDICATORS_K3, INDICATORS_K4 } from './indicatorsK34';
import type { IndicatorItem } from './pkkmMeta';

export const ALL_INDICATORS: IndicatorItem[] = [
  ...INDICATORS_K1,
  ...INDICATORS_K2,
  ...INDICATORS_K3,
  ...INDICATORS_K4,
];

export type SubmissionStatus = 'belum' | 'proses' | 'disetorkan';

export interface IndicatorProgress {
  indicatorId: string;
  status: SubmissionStatus;
  checkedSubItems: number[];
  lokasiBerkas: string;
  catatan: string;
  updatedBy: string;
  updatedAt: string;
  archived?: boolean;
  archivedBy?: string;
  archivedAt?: string;
}

export interface ProgressNotification {
  id: string;
  actorId: string;
  actorName: string;
  targetUserIds: string[];
  indicatorId: string;
  componentId: number;
  indicatorNo: number;
  type: 'status_change' | 'subitem_check' | 'location_update' | 'milestone' | 'archive_update';
  title: string;
  message: string;
  createdAt: string;
  readBy: string[];
}
