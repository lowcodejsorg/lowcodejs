import type { IPermission } from '@application/core/entity.core';

import type {
  PermissionContractRepository,
  PermissionCreatePayload,
  PermissionFindByPayload,
  PermissionQueryPayload,
  PermissionUpdatePayload,
} from './permission-contract.repository';

export default class PermissionInMemoryRepository implements PermissionContractRepository {
  private items: IPermission[] = [];

  async create(payload: PermissionCreatePayload): Promise<IPermission> {
    const permission: IPermission = {
      ...payload,
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(permission);
    return permission;
  }

  async findBy({ _id, slug, exact = false }: PermissionFindByPayload): Promise<IPermission | null> {
    const permission = this.items.find((p) => {
      if (exact) {
        return (_id ? p._id === _id : true) && (slug ? p.slug === slug : true);
      }
      return p._id === _id || p.slug === slug;
    });
    return permission ?? null;
  }

  async findMany(payload?: PermissionQueryPayload): Promise<IPermission[]> {
    let filtered = this.items;

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
    }

    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: PermissionUpdatePayload): Promise<IPermission> {
    const permission = this.items.find((p) => p._id === _id);
    if (!permission) throw new Error('Permission not found');
    Object.assign(permission, payload, { updatedAt: new Date() });
    return permission;
  }

  async delete(_id: string): Promise<void> {
    const permission = this.items.find((p) => p._id === _id);
    if (!permission) throw new Error('Permission not found');
    Object.assign(permission, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: PermissionQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
