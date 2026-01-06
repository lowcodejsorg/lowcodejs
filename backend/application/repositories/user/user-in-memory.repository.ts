import type { User } from '@application/core/entity.core';

import type {
  UserContractRepository,
  UserCreatePayload,
  UserFindByPayload,
  UserQueryPayload,
  UserUpdatePayload,
} from './user-contract.repository';

export default class UserInMemoryRepository implements UserContractRepository {
  private items: User[] = [];

  async create(payload: UserCreatePayload): Promise<User> {
    const user: User = {
      ...payload,
      _id: crypto.randomUUID(),
      status: 'inactive',
      group: { _id: payload.group } as User['group'],
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(user);
    return user;
  }

  async findBy({ _id, email, exact }: UserFindByPayload): Promise<User | null> {
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

  async findMany(payload?: UserQueryPayload): Promise<User[]> {
    let filtered = this.items;

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

  async update({ _id, ...payload }: UserUpdatePayload): Promise<User> {
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
