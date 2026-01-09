import type { IReaction, IUser } from '@application/core/entity.core';

import type {
  ReactionContractRepository,
  ReactionCreatePayload,
  ReactionFindByPayload,
  ReactionQueryPayload,
  ReactionUpdatePayload,
} from './reaction-contract.repository';

export default class ReactionInMemoryRepository implements ReactionContractRepository {
  private items: IReaction[] = [];

  async create(payload: ReactionCreatePayload): Promise<IReaction> {
    const reaction: IReaction = {
      ...payload,
      _id: crypto.randomUUID(),
      user: { _id: payload.user } as IUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(reaction);
    return reaction;
  }

  async findBy({
    _id,
    user,
    exact = false,
  }: ReactionFindByPayload): Promise<IReaction | null> {
    const reaction = this.items.find((r) => {
      if (exact) {
        return (
          (_id ? r._id === _id : true) &&
          (user ? (r.user as IUser)?._id === user : true)
        );
      }
      return r._id === _id || (r.user as IUser)?._id === user;
    });
    return reaction ?? null;
  }

  async findMany(payload?: ReactionQueryPayload): Promise<IReaction[]> {
    let filtered = this.items;

    if (payload?.user) {
      filtered = filtered.filter(
        (r) => (r.user as IUser)?._id === payload.user,
      );
    }

    if (payload?.type) {
      filtered = filtered.filter((r) => r.type === payload.type);
    }

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({ _id, ...payload }: ReactionUpdatePayload): Promise<IReaction> {
    const reaction = this.items.find((r) => r._id === _id);
    if (!reaction) throw new Error('Reaction not found');
    Object.assign(reaction, payload, { updatedAt: new Date() });
    return reaction;
  }

  async delete(_id: string): Promise<void> {
    const reaction = this.items.find((r) => r._id === _id);
    if (!reaction) throw new Error('Reaction not found');
    Object.assign(reaction, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: ReactionQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
