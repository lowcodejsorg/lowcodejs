import { E_FIELD_TYPE } from './constant';
import type { IField, IStorage, IUser } from './interfaces';

export type ReactionEntry = {
  emoji: string;
  users: Array<string>;
};

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function normalizeId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const item = value as { _id?: string; id?: string; value?: string };
    return item._id ?? item.id ?? item.value ?? null;
  }
  return null;
}

export function normalizeIdList(value: unknown): Array<string> {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeId(item))
      .filter(Boolean) as Array<string>;
  }
  const id = normalizeId(value);
  return id ? [id] : [];
}

export function normalizeUserList(value: unknown): Array<IUser | string> {
  if (Array.isArray(value)) return value as Array<IUser | string>;
  if (!value) return [];
  return [value as IUser | string];
}

export function normalizeStorageList(value: unknown): Array<IStorage> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is IStorage =>
      typeof item === 'object' &&
      item !== null &&
      'url' in item &&
      'originalName' in item,
  );
}

export function parseReactions(value: unknown): Array<ReactionEntry> {
  if (!value) return [];
  if (Array.isArray(value)) return value as Array<ReactionEntry>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

export function serializeReactions(entries: Array<ReactionEntry>): string {
  return JSON.stringify(entries);
}

export function normalizeGroupFieldValue(
  field: IField,
  value: unknown,
): unknown {
  switch (field.type) {
    case E_FIELD_TYPE.TEXT_SHORT:
    case E_FIELD_TYPE.TEXT_LONG: {
      if (value === null || value === undefined) return '';
      return String(value);
    }
    case E_FIELD_TYPE.DATE: {
      if (!value) return null;
      if (value instanceof Date) return value.toISOString();
      return String(value);
    }
    case E_FIELD_TYPE.DROPDOWN:
    case E_FIELD_TYPE.CATEGORY: {
      const items = Array.isArray(value) ? value : value ? [value] : [];
      const values = items.map((item) => String(item));
      return field.multiple ? values : values.slice(0, 1);
    }
    case E_FIELD_TYPE.USER:
    case E_FIELD_TYPE.FILE:
    case E_FIELD_TYPE.RELATIONSHIP: {
      const ids = normalizeIdList(value);
      return field.multiple ? ids : ids.slice(0, 1);
    }
    default:
      return value ?? null;
  }
}
