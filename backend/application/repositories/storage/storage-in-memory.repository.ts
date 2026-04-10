import type { FindOptions, IStorage } from '@application/core/entity.core';

import type {
  StorageContractRepository,
  StorageCreatePayload,
  StorageQueryPayload,
  StorageUpdatePayload,
} from './storage-contract.repository';

export default class StorageInMemoryRepository implements StorageContractRepository {
  items: IStorage[] = [];
  private _forcedErrors = new Map<string, Error>();

  simulateError(method: string, error: Error): void {
    this._forcedErrors.set(method, error);
  }

  private _checkError(method: string): void {
    const err = this._forcedErrors.get(method);
    if (err) {
      this._forcedErrors.delete(method);
      throw err;
    }
  }

  async create(payload: StorageCreatePayload): Promise<IStorage> {
    const storage: IStorage = {
      ...payload,
      _id: crypto.randomUUID(),
      url: `/storage/${payload.filename}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(storage);
    return storage;
  }

  async createMany(payload: StorageCreatePayload[]): Promise<IStorage[]> {
    const storages: IStorage[] = payload.map((p) => ({
      ...p,
      _id: crypto.randomUUID(),
      url: `/storage/${p.filename}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    }));
    this.items.push(...storages);
    return storages;
  }

  async findById(_id: string, options?: FindOptions): Promise<IStorage | null> {
    this._checkError('findById');
    const item = this.items.find((i) => {
      if (i._id !== _id) return false;
      if (options?.trashed !== undefined) return i.trashed === options.trashed;
      return true;
    });
    return item ?? null;
  }

  async findByFilename(
    filename: string,
    options?: FindOptions,
  ): Promise<IStorage | null> {
    const item = this.items.find((i) => {
      if (i.filename !== filename) return false;
      if (options?.trashed !== undefined) return i.trashed === options.trashed;
      return true;
    });
    return item ?? null;
  }

  async findMany(payload?: StorageQueryPayload): Promise<IStorage[]> {
    let filtered = this.items;

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter((s) =>
        s.originalName.toLowerCase().includes(search),
      );
    }

    if (payload?.mimetype) {
      filtered = filtered.filter((s) => s.mimetype === payload.mimetype);
    }

    filtered = filtered.sort((a, b) =>
      a.originalName.localeCompare(b.originalName),
    );

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: StorageUpdatePayload): Promise<IStorage> {
    const storage = this.items.find((s) => s._id === _id);
    if (!storage) throw new Error('Storage not found');
    Object.assign(storage, payload, { updatedAt: new Date() });
    return storage;
  }

  async delete(_id: string): Promise<void> {
    const index = this.items.findIndex((s) => s._id === _id);
    if (index === -1) throw new Error('Storage not found');
    this.items.splice(index, 1);
  }

  async count(payload?: StorageQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
