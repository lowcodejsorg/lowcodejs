import type { IStorage } from '@application/core/entity.core';

import type {
  StorageContractRepository,
  StorageCreatePayload,
  StorageFindByPayload,
  StorageQueryPayload,
  StorageUpdatePayload,
} from './storage-contract.repository';

export default class StorageInMemoryRepository implements StorageContractRepository {
  private items: IStorage[] = [];

  async create(payload: StorageCreatePayload): Promise<IStorage> {
    const storage: IStorage = {
      ...payload,
      _id: crypto.randomUUID(),
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
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    }));
    this.items.push(...storages);
    return storages;
  }

  async findBy({
    _id,
    filename,
    exact = false,
  }: StorageFindByPayload): Promise<IStorage | null> {
    const storage = this.items.find((s) => {
      if (exact) {
        return (
          (_id ? s._id === _id : true) &&
          (filename ? s.filename === filename : true)
        );
      }
      return s._id === _id || s.filename === filename;
    });
    return storage ?? null;
  }

  async findMany(payload?: StorageQueryPayload): Promise<IStorage[]> {
    let filtered = this.items;

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter((s) =>
        s.originalName.toLowerCase().includes(search),
      );
    }

    if (payload?.type) {
      filtered = filtered.filter((s) => s.type === payload.type);
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

  async delete(_id: string): Promise<IStorage | null> {
    const index = this.items.findIndex((s) => s._id === _id);
    if (index === -1) return null;
    const [storage] = this.items.splice(index, 1);
    return storage;
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
