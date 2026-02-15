import type { CSSProperties } from 'react';

import { hexToRgb } from '@/components/common/table-row-badge-list';
import { E_FIELD_TYPE } from '@/lib/constant';
import type { IField, IRow, IUser } from '@/lib/interfaces';

export const ORDER_FIELD_SLUG = 'ordem-kanban';
export const ORDER_FIELD_NAME = 'Ordem Kanban';

export const TEMPLATE_FIELD_SLUGS = new Set([
  'titulo',
  'descricao',
  'membros',
  'membros-notificados',
  'data-de-inicio',
  'data-de-vencimento',
  'anexo',
  'porcentagem-concluida',
  'concluido-notificado',
  'lista',
  'etiquetas',
  'tarefas',
  'comentarios',
]);

export function getFieldBySlug(
  fields: Array<IField>,
  slug: string,
  type?: IField['type'],
): IField | undefined {
  return fields.find(
    (f) => !f.trashed && f.slug === slug && (type ? f.type === type : true),
  );
}

export function getFirstFieldByType(
  fields: Array<IField>,
  type: IField['type'],
): IField | undefined {
  return fields.find((f) => !f.trashed && f.type === type);
}

export function normalizeRowValue(value: unknown): Array<string> {
  if (Array.isArray(value)) return value.map(String);
  if (value === null || value === undefined) return [];
  return [String(value)];
}

export function normalizeIdList(value: unknown): Array<string> {
  if (Array.isArray(value)) {
    return value
      .map((item: any) =>
        typeof item === 'object' && item !== null
          ? (item._id ?? item.value ?? String(item))
          : String(item),
      )
      .filter(Boolean);
  }

  if (typeof value === 'object' && value !== null) {
    const item = value as any;
    return [item._id ?? item.value ?? String(item)].filter(Boolean);
  }

  if (value === null || value === undefined || value === '') return [];
  return [String(value)];
}

export function getUserInitials(user: Partial<IUser> | string): string {
  if (typeof user === 'string') return user.slice(0, 2).toUpperCase();
  const name = user.name || user.email || '';
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((p) => (p[0] ? p[0].toUpperCase() : ''));
  return initials.join('') || 'U';
}

export function getMembersFromRow(
  row: IRow,
  field?: IField,
): Array<IUser | string> {
  if (!field) return [];
  const raw = row[field.slug];
  if (Array.isArray(raw)) return raw as Array<IUser | string>;
  if (raw) return [raw as IUser | string];
  return [];
}

export function getProgressValue(row: IRow, field?: IField): number | null {
  if (!field) return null;
  const raw = row[field.slug];
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

export function getTaskCompletionPercent(
  tasks: Array<Record<string, any>>,
): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) =>
    normalizeRowValue(task.realizado).includes('sim'),
  ).length;
  return Math.round((completed / tasks.length) * 100);
}

export function getTitleValue(row: IRow, field?: IField): string {
  if (!field) return 'Sem titulo';
  const raw = row[field.slug];
  if (raw === null || raw === undefined || raw === '') return 'Sem titulo';
  return String(raw);
}

export function parseOrderValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export function columnStyleFromColor(
  color?: string | null,
): CSSProperties | undefined {
  if (!color) return undefined;
  const rgb = hexToRgb(color);
  if (!rgb) return undefined;
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)`,
  };
}

export function columnHeaderStyleFromColor(
  color?: string | null,
): CSSProperties | undefined {
  if (!color) return undefined;
  const rgb = hexToRgb(color);
  if (!rgb) return undefined;
  return {
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
  };
}

export function buildPayloadFromRow(
  row: IRow,
  fields: Array<IField>,
): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const field of fields) {
    if (field.trashed || field.native) continue;
    const value = row[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.DROPDOWN:
      case E_FIELD_TYPE.CATEGORY:
        payload[field.slug] = normalizeRowValue(value);
        break;
      case E_FIELD_TYPE.USER:
      case E_FIELD_TYPE.RELATIONSHIP:
      case E_FIELD_TYPE.FILE:
        payload[field.slug] = normalizeIdList(value);
        break;
      case E_FIELD_TYPE.FIELD_GROUP:
        payload[field.slug] = Array.isArray(value) ? value : [];
        break;
      default:
        payload[field.slug] = value ?? null;
    }
  }

  return payload;
}

export function buildDefaultValuesFromRow(
  row: IRow,
  fields: Array<IField>,
): Record<string, any> {
  const defaults: Record<string, any> = {};

  for (const field of fields) {
    const value = row[field.slug];

    switch (field.type) {
      case E_FIELD_TYPE.USER: {
        const users = Array.isArray(value) ? value : value ? [value] : [];
        defaults[field.slug] = users.map((user: any) => ({
          value: user._id ?? user.value ?? user,
          label: user.name || user.email || user.label || String(user),
        }));
        break;
      }
      case E_FIELD_TYPE.DROPDOWN: {
        if (field.multiple) {
          defaults[field.slug] = Array.isArray(value)
            ? value
            : value
              ? [value]
              : [];
        } else {
          defaults[field.slug] = Array.isArray(value)
            ? (value[0] ?? null)
            : (value ?? null);
        }
        break;
      }
      case E_FIELD_TYPE.DATE:
        defaults[field.slug] = value ?? '';
        break;
      default:
        defaults[field.slug] = value ?? '';
    }
  }

  return defaults;
}
