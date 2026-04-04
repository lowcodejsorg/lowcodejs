import { randomUUID } from 'node:crypto';

import type { IRow } from '@application/core/entity.core';

import type {
  RowBulkDeletePayload,
  RowBulkUpdatePayload,
  RowCreatePayload,
  RowFindManyPayload,
  RowFindOnePayload,
  RowGroupItemPayload,
  RowSetFieldPayload,
  RowTableContext,
  RowUpdatePayload,
} from './row-contract.repository';
import { RowContractRepository } from './row-contract.repository';

export default class RowInMemoryRepository extends RowContractRepository {
  private collections = new Map<string, IRow[]>();

  private getCollection(slug: string): IRow[] {
    if (!this.collections.has(slug)) {
      this.collections.set(slug, []);
    }
    return this.collections.get(slug)!;
  }

  reset(): void {
    this.collections.clear();
  }

  // ── Core CRUD ─────────────────────────────────────────────

  async create(payload: RowCreatePayload): Promise<IRow> {
    const collection = this.getCollection(payload.table.slug);

    const row: IRow = {
      _id: randomUUID(),
      ...payload.data,
      trashed: false,
      trashedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IRow;

    collection.push(row);
    return row;
  }

  async findOne(payload: RowFindOnePayload): Promise<IRow | null> {
    const collection = this.getCollection(payload.table.slug);

    const row = collection.find((item) => {
      for (const [key, value] of Object.entries(payload.query)) {
        if ((item as Record<string, unknown>)[key] !== value) return false;
      }
      return true;
    });

    if (!row) return null;
    return { ...row };
  }

  async findMany(payload: RowFindManyPayload): Promise<IRow[]> {
    const collection = this.getCollection(payload.table.slug);

    let result = collection.filter((item) => {
      for (const [key, value] of Object.entries(payload.query)) {
        if ((item as Record<string, unknown>)[key] !== value) return false;
      }
      return true;
    });

    if (payload.sort) {
      const entries = Object.entries(payload.sort);
      if (entries.length > 0) {
        const [sortKey, sortDir] = entries[0];
        result.sort((a, b) => {
          const aVal = String((a as Record<string, unknown>)[sortKey] || '');
          const bVal = String((b as Record<string, unknown>)[sortKey] || '');
          if (sortDir === 1) return aVal.localeCompare(bVal);
          return bVal.localeCompare(aVal);
        });
      }
    }

    return result
      .slice(payload.skip, payload.skip + payload.limit)
      .map((r) => ({ ...r }));
  }

  async count(
    table: RowTableContext,
    query: Record<string, unknown>,
  ): Promise<number> {
    const collection = this.getCollection(table.slug);

    return collection.filter((item) => {
      for (const [key, value] of Object.entries(query)) {
        if ((item as Record<string, unknown>)[key] !== value) return false;
      }
      return true;
    }).length;
  }

  async update(payload: RowUpdatePayload): Promise<IRow | null> {
    const collection = this.getCollection(payload.table.slug);
    const index = collection.findIndex((item) => item._id === payload._id);

    if (index === -1) return null;

    collection[index] = {
      ...collection[index],
      ...payload.data,
      updatedAt: new Date(),
    } as IRow;

    return { ...collection[index] };
  }

  async deleteOne(table: RowTableContext, _id: string): Promise<boolean> {
    const collection = this.getCollection(table.slug);
    const index = collection.findIndex((item) => item._id === _id);

    if (index === -1) return false;

    collection.splice(index, 1);
    return true;
  }

  // ── Trash ─────────────────────────────────────────────────

  async sendToTrash(table: RowTableContext, _id: string): Promise<IRow | null> {
    const collection = this.getCollection(table.slug);
    const row = collection.find((item) => item._id === _id);

    if (!row) return null;

    row.trashed = true;
    row.trashedAt = new Date();

    return { ...row };
  }

  async restoreFromTrash(
    table: RowTableContext,
    _id: string,
  ): Promise<IRow | null> {
    const collection = this.getCollection(table.slug);
    const row = collection.find((item) => item._id === _id);

    if (!row) return null;

    row.trashed = false;
    row.trashedAt = null;

    return { ...row };
  }

  async bulkTrash(payload: RowBulkUpdatePayload): Promise<number> {
    const collection = this.getCollection(payload.table.slug);
    let count = 0;

    for (const row of collection) {
      if (payload.ids.includes(row._id) && !row.trashed) {
        row.trashed = true;
        row.trashedAt = new Date();
        count++;
      }
    }

    return count;
  }

  async bulkRestore(payload: RowBulkUpdatePayload): Promise<number> {
    const collection = this.getCollection(payload.table.slug);
    let count = 0;

    for (const row of collection) {
      if (payload.ids.includes(row._id) && row.trashed) {
        row.trashed = false;
        row.trashedAt = null;
        count++;
      }
    }

    return count;
  }

  async bulkDelete(payload: RowBulkDeletePayload): Promise<number> {
    const collection = this.getCollection(payload.table.slug);
    let count = 0;
    const remaining: IRow[] = [];

    for (const row of collection) {
      if (payload.ids.includes(row._id) && row.trashed) {
        count++;
      } else {
        remaining.push(row);
      }
    }

    this.collections.set(payload.table.slug, remaining);
    return count;
  }

  async emptyTrash(table: RowTableContext): Promise<number> {
    const collection = this.getCollection(table.slug);
    const remaining = collection.filter((item) => !item.trashed);
    const count = collection.length - remaining.length;

    this.collections.set(table.slug, remaining);
    return count;
  }

  // ── Field-level (reaction / evaluation) ───────────────────

  async setFieldAndSave(payload: RowSetFieldPayload): Promise<IRow> {
    const collection = this.getCollection(payload.table.slug);
    const row = collection.find((item) => item._id === payload._id);

    if (!row) throw new Error('Row not found');

    (row as Record<string, unknown>)[payload.field] = payload.value;
    row.updatedAt = new Date();

    return { ...row };
  }

  // ── Group rows (subdocumentos) ────────────────────────────

  async addGroupItem(
    payload: RowGroupItemPayload & { data: Record<string, unknown> },
  ): Promise<IRow> {
    const collection = this.getCollection(payload.table.slug);
    const row = collection.find((item) => item._id === payload.rowId);

    if (!row) throw new Error('Row not found');

    const currentItems = (row as Record<string, unknown>)[
      payload.groupFieldSlug
    ];
    const groupData: Record<string, unknown>[] = Array.isArray(currentItems)
      ? [...currentItems]
      : [];

    groupData.push({ _id: randomUUID(), ...payload.data });
    (row as Record<string, unknown>)[payload.groupFieldSlug] = groupData;
    row.updatedAt = new Date();

    return { ...row };
  }

  async updateGroupItem(
    payload: RowGroupItemPayload & {
      itemId: string;
      data: Record<string, unknown>;
    },
  ): Promise<IRow> {
    const collection = this.getCollection(payload.table.slug);
    const row = collection.find((item) => item._id === payload.rowId);

    if (!row) throw new Error('Row not found');

    const items = (row as Record<string, unknown>)[payload.groupFieldSlug];
    if (!Array.isArray(items)) throw new Error('Group field not found');

    const item = items.find(
      (i: Record<string, unknown>) => String(i._id) === payload.itemId,
    );
    if (!item) throw new Error('Item not found');

    Object.assign(item, payload.data);
    row.updatedAt = new Date();

    return { ...row };
  }

  async deleteGroupItem(
    payload: RowGroupItemPayload & { itemId: string },
  ): Promise<boolean> {
    const collection = this.getCollection(payload.table.slug);
    const row = collection.find((item) => item._id === payload.rowId);

    if (!row) return false;

    const items = (row as Record<string, unknown>)[payload.groupFieldSlug];
    if (!Array.isArray(items)) return false;

    const index = items.findIndex(
      (i: Record<string, unknown>) => String(i._id) === payload.itemId,
    );
    if (index === -1) return false;

    items.splice(index, 1);
    row.updatedAt = new Date();

    return true;
  }

  // ── Atomic update (forum-message) ─────────────────────────

  async findOneAndUpdate(
    table: RowTableContext,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<IRow | null> {
    const collection = this.getCollection(table.slug);

    const row = collection.find((item) => {
      for (const [key, value] of Object.entries(filter)) {
        if ((item as Record<string, unknown>)[key] !== value) return false;
      }
      return true;
    });

    if (!row) return null;

    const setData = (update as { $set?: Record<string, unknown> }).$set;
    if (setData) {
      for (const [key, value] of Object.entries(setData)) {
        (row as Record<string, unknown>)[key] = value;
      }
    }

    row.updatedAt = new Date();
    return { ...row };
  }
}
