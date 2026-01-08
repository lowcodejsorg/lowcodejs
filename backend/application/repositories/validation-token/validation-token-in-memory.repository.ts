import type { IUser, IValidationToken } from '@application/core/entity.core';

import type {
  ValidationTokenContractRepository,
  ValidationTokenCreatePayload,
  ValidationTokenFindByPayload,
  ValidationTokenQueryPayload,
  ValidationTokenUpdatePayload,
} from './validation-token-contract.repository';

export default class ValidationTokenInMemoryRepository implements ValidationTokenContractRepository {
  private items: IValidationToken[] = [];

  async create(
    payload: ValidationTokenCreatePayload,
  ): Promise<IValidationToken> {
    const userId = payload.user;
    const token: IValidationToken = {
      ...payload,
      _id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
      user: { _id: userId, toString: () => userId } as unknown as IUser,
    };
    this.items.push(token);
    return token;
  }

  async findBy({
    _id,
    user,
    code,
    exact = false,
  }: ValidationTokenFindByPayload): Promise<IValidationToken | null> {
    const token = this.items.find((t) => {
      if (exact) {
        return (
          (_id ? t._id === _id : true) &&
          (user ? t.user._id === user : true) &&
          (code ? t.code === code : true)
        );
      }
      return t._id === _id || t.user._id === user || t.code === code;
    });
    return token ?? null;
  }

  async findMany(
    payload?: ValidationTokenQueryPayload,
  ): Promise<IValidationToken[]> {
    let filtered = this.items;

    if (payload?.user) {
      filtered = filtered.filter((t) => t.user._id === payload.user);
    }

    if (payload?.status) {
      filtered = filtered.filter((t) => t.status === payload.status);
    }

    if (payload?.page && payload?.perPage) {
      const start = (payload.page - 1) * payload.perPage;
      const end = start + payload.perPage;
      filtered = filtered.slice(start, end);
    }

    return filtered;
  }

  async update({
    _id,
    ...payload
  }: ValidationTokenUpdatePayload): Promise<IValidationToken> {
    const token = this.items.find((t) => t._id === _id);
    if (!token) throw new Error('ValidationToken not found');
    Object.assign(token, payload, { updatedAt: new Date() });
    return token;
  }

  async delete(_id: string): Promise<void> {
    const token = this.items.find((t) => t._id === _id);
    if (!token) throw new Error('ValidationToken not found');
    Object.assign(token, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: ValidationTokenQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
