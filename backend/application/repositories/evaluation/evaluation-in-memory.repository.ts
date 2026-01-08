import type { IEvaluation, IUser } from '@application/core/entity.core';

import type {
  EvaluationContractRepository,
  EvaluationCreatePayload,
  EvaluationFindByPayload,
  EvaluationQueryPayload,
  EvaluationUpdatePayload,
} from './evaluation-contract.repository';

export default class EvaluationInMemoryRepository implements EvaluationContractRepository {
  private items: IEvaluation[] = [];

  async create(payload: EvaluationCreatePayload): Promise<IEvaluation> {
    const evaluation: IEvaluation = {
      ...payload,
      _id: crypto.randomUUID(),
      user: { _id: payload.user } as IUser,
      createdAt: new Date(),
      updatedAt: new Date(),
      trashedAt: null,
      trashed: false,
    };
    this.items.push(evaluation);
    return evaluation;
  }

  async findBy({
    _id,
    user,
    exact = false,
  }: EvaluationFindByPayload): Promise<IEvaluation | null> {
    const evaluation = this.items.find((e) => {
      if (exact) {
        return (
          (_id ? e._id === _id : true) &&
          (user ? (e.user as IUser)?._id === user : true)
        );
      }
      return e._id === _id || (e.user as IUser)?._id === user;
    });
    return evaluation ?? null;
  }

  async findMany(payload?: EvaluationQueryPayload): Promise<IEvaluation[]> {
    let filtered = this.items;

    if (payload?.user) {
      filtered = filtered.filter(
        (e) => (e.user as IUser)?._id === payload.user,
      );
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
  }: EvaluationUpdatePayload): Promise<IEvaluation> {
    const evaluation = this.items.find((e) => e._id === _id);
    if (!evaluation) throw new Error('Evaluation not found');
    Object.assign(evaluation, payload, { updatedAt: new Date() });
    return evaluation;
  }

  async delete(_id: string): Promise<void> {
    const evaluation = this.items.find((e) => e._id === _id);
    if (!evaluation) throw new Error('Evaluation not found');
    Object.assign(evaluation, {
      trashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async count(payload?: EvaluationQueryPayload): Promise<number> {
    const filtered = await this.findMany({
      ...payload,
      page: undefined,
      perPage: undefined,
    });
    return filtered.length;
  }
}
