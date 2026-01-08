import { Service } from 'fastify-decorators';

import type { IValidationToken } from '@application/core/entity.core';
import { ValidationToken as Model } from '@application/model/validation-token.model';

import type {
  ValidationTokenContractRepository,
  ValidationTokenCreatePayload,
  ValidationTokenFindByPayload,
  ValidationTokenQueryPayload,
  ValidationTokenUpdatePayload,
} from './validation-token-contract.repository';

@Service()
export default class ValidationTokenMongooseRepository implements ValidationTokenContractRepository {
  private readonly populateOptions = [
    {
      path: 'user',
      populate: { path: 'group', populate: { path: 'permissions' } },
    },
  ];

  private buildWhereClause(
    payload?: ValidationTokenQueryPayload,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.user) where.user = payload.user;
    if (payload?.status) where.status = payload.status;

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IValidationToken {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: ValidationTokenCreatePayload): Promise<IValidationToken> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({
    exact = false,
    ...payload
  }: ValidationTokenFindByPayload): Promise<IValidationToken | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.user) conditions.push({ user: payload.user });
    if (payload.code) conditions.push({ code: payload.code });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const token = await Model.findOne(whereClause).populate(this.populateOptions);

    if (!token) return null;

    return this.transform(token);
  }

  async findMany(payload?: ValidationTokenQueryPayload): Promise<IValidationToken[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const tokens = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ createdAt: 'desc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return tokens.map((t) => this.transform(t));
  }

  async update({
    _id,
    ...payload
  }: ValidationTokenUpdatePayload): Promise<IValidationToken> {
    const token = await Model.findOne({ _id });

    if (!token) throw new Error('ValidationToken not found');

    token.set(payload);

    await token.save();

    const populated = await token.populate(this.populateOptions);

    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: ValidationTokenQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
