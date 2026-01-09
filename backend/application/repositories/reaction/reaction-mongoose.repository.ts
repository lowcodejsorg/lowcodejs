import { Service } from 'fastify-decorators';

import type { IReaction } from '@application/core/entity.core';
import { Reaction as Model } from '@application/model/reaction.model';

import type {
  ReactionContractRepository,
  ReactionCreatePayload,
  ReactionFindByPayload,
  ReactionQueryPayload,
  ReactionUpdatePayload,
} from './reaction-contract.repository';

@Service()
export default class ReactionMongooseRepository implements ReactionContractRepository {
  private readonly populateOptions = [{ path: 'user' }];

  private buildWhereClause(
    payload?: ReactionQueryPayload,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.user) where.user = payload.user;
    if (payload?.type) where.type = payload.type;

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IReaction {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: ReactionCreatePayload): Promise<IReaction> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({
    exact = false,
    ...payload
  }: ReactionFindByPayload): Promise<IReaction | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.user) conditions.push({ user: payload.user });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const reaction = await Model.findOne(whereClause).populate(
      this.populateOptions,
    );

    if (!reaction) return null;

    return this.transform(reaction);
  }

  async findMany(payload?: ReactionQueryPayload): Promise<IReaction[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const reactions = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ createdAt: 'desc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return reactions.map((r) => this.transform(r));
  }

  async update({ _id, ...payload }: ReactionUpdatePayload): Promise<IReaction> {
    const reaction = await Model.findOne({ _id });

    if (!reaction) throw new Error('Reaction not found');

    reaction.set(payload);

    await reaction.save();

    const populated = await reaction.populate(this.populateOptions);

    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: ReactionQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
