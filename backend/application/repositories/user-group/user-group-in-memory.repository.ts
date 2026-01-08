import type { IGroup, IPermission } from '@application/core/entity.core';

import type {
  UserGroupContractRepository,
  UserGroupCreatePayload,
  UserGroupFindByPayload,
  UserGroupQueryPayload,
  UserGroupUpdatePayload,
} from './user-group-contract.repository';

export default class UserGroupInMemoryRepository implements UserGroupContractRepository {
  private items: IGroup[] = [];

  async create(payload: UserGroupCreatePayload): Promise<IGroup> {
    const group: IGroup = {
      ...payload,
      _id: crypto.randomUUID(),
      description: payload.description ?? null,
      permissions: payload.permissions.map((p) => ({ _id: p }) as IPermission),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(group);
    return group;
  }

  async findBy({
    _id,
    slug,
    exact = false,
  }: UserGroupFindByPayload): Promise<IGroup | null> {
    const group = this.items.find((g) => {
      if (exact) {
        return (_id ? g._id === _id : true) && (slug ? g.slug === slug : true);
      }
      return g._id === _id || g.slug === slug;
    });

    return group ?? null;
  }

  async findMany(payload?: UserGroupQueryPayload): Promise<IGroup[]> {
    let filtered = this.items;

    if (payload?.search) {
      const search = payload.search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          (g.description?.toLowerCase().includes(search) ?? false),
      );
    }

    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: UserGroupUpdatePayload): Promise<IGroup> {
    const group = this.items.find((g) => g._id === _id);
    if (!group) throw new Error('UserGroup not found');
    Object.assign(group, payload, { updatedAt: new Date() });
    return group;
  }

  async delete(_id: string): Promise<void> {
    const group = this.items.find((g) => g._id === _id);
    if (!group) throw new Error('UserGroup not found');
    Object.assign(group, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: UserGroupQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
