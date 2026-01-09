import { Service } from 'fastify-decorators';

import { E_ROLE, type IGroup } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { UserGroup as Model } from '@application/model/user-group.model';

import type {
  UserGroupContractRepository,
  UserGroupCreatePayload,
  UserGroupFindByPayload,
  UserGroupQueryPayload,
  UserGroupUpdatePayload,
} from './user-group-contract.repository';

@Service()
export default class UserGroupMongooseRepository implements UserGroupContractRepository {
  private readonly populateOptions = [{ path: 'permissions' }];

  private async buildWhereClause(
    payload?: UserGroupQueryPayload,
  ): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = {};

    if (payload?.user?.role === E_ROLE.ADMINISTRATOR) {
      where.slug = { $ne: E_ROLE.MASTER };
    }

    if (payload?.search) {
      where.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { description: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IGroup {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: UserGroupCreatePayload): Promise<IGroup> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({
    exact = false,
    ...payload
  }: UserGroupFindByPayload): Promise<IGroup | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.slug) conditions.push({ slug: payload.slug });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const group = await Model.findOne(whereClause).populate(
      this.populateOptions,
    );

    if (!group) return null;

    return this.transform(group);
  }

  async findMany(payload?: UserGroupQueryPayload): Promise<IGroup[]> {
    const where = await this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const groups = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ name: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return groups.map((g) => this.transform(g));
  }

  async update({ _id, ...payload }: UserGroupUpdatePayload): Promise<IGroup> {
    const group = await Model.findOne({ _id });

    if (!group) throw new Error('UserGroup not found');

    group.set(payload);

    await group.save();

    const populated = await group.populate(this.populateOptions);

    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: UserGroupQueryPayload): Promise<number> {
    const where = await this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
