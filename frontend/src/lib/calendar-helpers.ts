import {
  addMinutes,
  compareAsc,
  format,
  isSameDay,
  isValid,
  startOfDay,
} from 'date-fns';

import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, ITable } from '@/lib/interfaces';
import { getFieldBySlug, getFirstFieldByType } from '@/lib/kanban-helpers';

const DEFAULT_EVENT_COLOR = '#2563eb';

export interface CalendarResolvedFields {
  titleField?: IField;
  descriptionField?: IField;
  startField?: IField;
  endField?: IField;
  colorField?: IField;
}

export interface CalendarEventItem {
  row: IRow;
  rowId: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  color: string;
  colorLabel: string | null;
}

function firstValue(value: unknown): unknown {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return String(value[0] ?? '');
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return String(item.label ?? item.name ?? item.value ?? '');
  }
  return String(value);
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resolveCalendarFields(
  fields: Array<IField>,
): CalendarResolvedFields {
  return {
    titleField:
      getFieldBySlug(fields, 'titulo', E_FIELD_TYPE.TEXT_SHORT) ??
      getFirstFieldByType(fields, E_FIELD_TYPE.TEXT_SHORT),
    descriptionField:
      getFieldBySlug(fields, 'descricao', E_FIELD_TYPE.TEXT_LONG) ??
      getFirstFieldByType(fields, E_FIELD_TYPE.TEXT_LONG),
    startField:
      getFieldBySlug(fields, 'data-inicio', E_FIELD_TYPE.DATE) ??
      getFirstFieldByType(fields, E_FIELD_TYPE.DATE),
    endField: getFieldBySlug(fields, 'data-termino', E_FIELD_TYPE.DATE),
    colorField:
      getFieldBySlug(fields, 'cor', E_FIELD_TYPE.DROPDOWN) ??
      getFirstFieldByType(fields, E_FIELD_TYPE.DROPDOWN),
  };
}

export function isCalendarTemplate(table?: ITable | null): boolean {
  if (!table) return false;
  const fields = Array.isArray(table.fields)
    ? table.fields.filter(Boolean)
    : [];
  const resolved = resolveCalendarFields(fields);

  return Boolean(
    resolved.titleField &&
    resolved.descriptionField &&
    resolved.startField &&
    resolved.endField &&
    resolved.colorField &&
    resolved.startField.slug === 'data-inicio' &&
    resolved.endField.slug === 'data-termino',
  );
}

export function parseRowDateValue(value: unknown): Date | null {
  const raw = firstValue(value);

  if (!raw) return null;
  if (raw instanceof Date) return isValid(raw) ? raw : null;

  if (typeof raw === 'object') {
    const item = raw as Record<string, unknown>;
    const nested = item.date ?? item.value ?? item.start ?? item.end;
    if (!nested) return null;
    const parsedNested = new Date(String(nested));
    return isValid(parsedNested) ? parsedNested : null;
  }

  const parsed = new Date(String(raw));
  return isValid(parsed) ? parsed : null;
}

function resolveEventColor(
  row: IRow,
  colorField?: IField,
): { color: string; colorLabel: string | null } {
  if (!colorField) {
    return { color: DEFAULT_EVENT_COLOR, colorLabel: null };
  }

  const raw = firstValue(row[colorField.slug]);
  if (!raw) return { color: DEFAULT_EVENT_COLOR, colorLabel: null };

  if (typeof raw === 'object') {
    const item = raw as Record<string, unknown>;
    const color = String(item.color ?? '').trim();
    const label = String(item.label ?? '').trim() || null;
    if (color) return { color, colorLabel: label };
  }

  const selectedId = String(raw).trim();
  const option = colorField.dropdown.find((item) => item.id === selectedId);
  if (option?.color) {
    return { color: option.color, colorLabel: option.label ?? null };
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(selectedId)) {
    return { color: selectedId, colorLabel: null };
  }

  return { color: DEFAULT_EVENT_COLOR, colorLabel: option?.label ?? null };
}

export function normalizeCalendarEvents(
  rows: Array<IRow>,
  fields: Array<IField>,
): Array<CalendarEventItem> {
  const resolved = resolveCalendarFields(fields);
  if (!resolved.titleField || !resolved.startField) return [];

  return rows
    .map((row) => {
      const start = parseRowDateValue(row[resolved.startField!.slug]);
      if (!start) return null;

      const rawEnd = resolved.endField
        ? parseRowDateValue(row[resolved.endField.slug])
        : null;
      const end =
        rawEnd && rawEnd.getTime() > start.getTime()
          ? rawEnd
          : addMinutes(start, 30);

      const title =
        toText(row[resolved.titleField!.slug]).trim() || 'Sem título';
      const description = resolved.descriptionField
        ? stripHtml(toText(row[resolved.descriptionField.slug]))
        : '';
      const { color, colorLabel } = resolveEventColor(row, resolved.colorField);

      return {
        row,
        rowId: row._id,
        title,
        description,
        start,
        end,
        color,
        colorLabel,
      } satisfies CalendarEventItem;
    })
    .filter((event): event is CalendarEventItem => Boolean(event))
    .sort((a, b) => {
      const byStart = compareAsc(a.start, b.start);
      if (byStart !== 0) return byStart;
      const byEnd = compareAsc(a.end, b.end);
      if (byEnd !== 0) return byEnd;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
}

export function isMultiDayCalendarEvent(event: CalendarEventItem): boolean {
  return (
    !isSameDay(event.start, event.end) ||
    event.end.getTime() - event.start.getTime() >= 24 * 60 * 60 * 1000
  );
}

export function eventOccursOnDay(event: CalendarEventItem, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = startOfDay(addMinutes(day, 24 * 60)).getTime();
  return event.start.getTime() < dayEnd && event.end.getTime() > dayStart;
}

export function formatEventTimeRange(event: CalendarEventItem): string {
  const sameDay = isSameDay(event.start, event.end);
  if (sameDay) {
    return `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`;
  }
  return `${format(event.start, 'dd/MM HH:mm')} - ${format(event.end, 'dd/MM HH:mm')}`;
}

export function toDateTimeLocalInputValue(
  value: Date | null | undefined,
): string {
  if (!value || !isValid(value)) return '';
  return format(value, "yyyy-MM-dd'T'HH:mm");
}

export function parseDateTimeLocalInputValue(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return isValid(parsed) ? parsed : null;
}
