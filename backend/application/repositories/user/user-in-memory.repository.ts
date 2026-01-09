import { E_USER_STATUS, type IUser } from '@application/core/entity.core';

import type {
  UserContractRepository,
  UserCreatePayload,
  UserFindByPayload,
  UserQueryPayload,
  UserUpdatePayload,
} from './user-contract.repository';

export default class UserInMemoryRepository implements UserContractRepository {
  private items: IUser[] = [];

  async create(payload: UserCreatePayload): Promise<IUser> {
    const user: IUser = {
      ...payload,
      _id: crypto.randomUUID(),
      status: E_USER_STATUS.ACTIVE,
      group: { _id: payload.group } as IUser['group'],
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(user);
    return user;
  }

  async findBy({
    _id,
    email,
    exact,
  }: UserFindByPayload): Promise<IUser | null> {
    const user = this.items.find((_user) => {
      if (exact) {
        return (
          (_id ? _user._id === _id : true) &&
          (email ? _user.email === email : true)
        );
      }
      return _user._id === _id || _user.email === email;
    });

    return user ?? null;
  }

  async findMany(payload?: UserQueryPayload): Promise<IUser[]> {
    let filtered = this.items;

    // Filtro por trashed
    if (payload?.trashed !== undefined) {
      filtered = filtered.filter((user) => user.trashed === payload.trashed);
    } else {
      filtered = filtered.filter((user) => !user.trashed);
    }

    // Filtro por múltiplos IDs
    if (payload?._ids && payload._ids.length > 0) {
      filtered = filtered.filter((user) => payload._ids!.includes(user._id));
    }

    // Filtro por status
    if (payload?.status) {
      filtered = filtered.filter((user) => user.status === payload.status);
    }

    if (payload?.user?._id) {
      filtered = filtered.filter((user) => user._id !== payload.user?._id);
    }

    if (payload?.search) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(payload.search!.toLowerCase()) ||
          user.email.toLowerCase().includes(payload.search!.toLowerCase()),
      );
    }

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: UserUpdatePayload): Promise<IUser> {
    const updated = this.items.find((user) => user._id === _id);
    if (!updated) throw new Error('User not found');
    Object.assign(updated, payload, { updatedAt: new Date() });
    return updated;
  }

  async delete(_id: string): Promise<void> {
    const user = this.items.find((u) => u._id === _id);
    if (!user) throw new Error('User not found');
    Object.assign(user, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: UserQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });

    return filtered.length;
  }
}
