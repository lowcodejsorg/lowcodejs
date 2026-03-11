import type { IDropdown, IRow } from '@/lib/interfaces';
import type { getMembersFromRow } from '@/lib/kanban-helpers';

export type ZoomLevel = 'day' | 'week' | 'month';

export const DAY_WIDTH: Record<ZoomLevel, number> = {
  day: 40,
  week: 18,
  month: 6,
};

export interface GanttRow {
  row: IRow;
  title: string;
  start: Date | null;
  end: Date | null;
  status: { id: string; label: string; color: string | null } | null;
  members: ReturnType<typeof getMembersFromRow>;
  progress: number | null;
  dependencyIds: Array<string>;
  isOverdue: boolean;
}

export type DragMode = 'move' | 'resize-left' | 'resize-right';

export interface DragState {
  rowId: string;
  mode: DragMode;
  startX: number;
  startY: number;
  originalStart: Date;
  originalEnd: Date;
  originalGroupId: string | null;
}

export interface CreateDragState {
  groupOptionId: string;
  startX: number;
  currentX: number;
  timelineLeft: number;
  rowTop: number;
  rowHeight: number;
}

export interface GanttGroup {
  option: IDropdown;
  rows: Array<GanttRow>;
}

export interface GroupYRange {
  optionId: string;
  yStart: number;
  yEnd: number;
}

export const ROW_HEIGHT = 36;
