import { Service } from 'fastify-decorators';

import type { IGroup } from '@application/core/entity.core';
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
  async create(payload: UserGroupCreatePayload): Promise<IGroup> {
    const created = await Model.create(payload);

    const populated = await created.populate([{ path: 'permissions' }]);

    return {
      ...populated.toJSON({ flattenObjectIds: true }),
      _id: populated._id.toString(),
    };
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

    const group = await Model.findOne(whereClause).populate([
      { path: 'permissions' },
    ]);

    if (!group) return null;

    return {
      ...group.toJSON({ flattenObjectIds: true }),
      _id: group._id.toString(),
    };
  }

  async findMany(payload?: UserGroupQueryPayload): Promise<IGroup[]> {
    const query: Record<string, unknown> = {};

    if (payload?._id) {
      query._id = { $ne: payload._id };
    }

    if (payload?.search) {
      query.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { description: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    let dbQuery = Model.find(query)
      .populate([{ path: 'permissions' }])
      .sort({ name: 'asc' });

    if (payload?.page && payload?.perPage) {
      const skip = (payload.page - 1) * payload.perPage;
      dbQuery = dbQuery.skip(skip).limit(payload.perPage);
    }

    const groups = await dbQuery;

    return groups.map((g) => ({
      ...g.toJSON({ flattenObjectIds: true }),
      _id: g._id.toString(),
    }));
  }

  async update({
    _id,
    ...payload
  }: UserGroupUpdatePayload): Promise<IGroup> {
    const group = await Model.findOne({ _id });

    if (!group) throw new Error('UserGroup not found');

    group.set(payload);

    await group.save();

    const populated = await group.populate([{ path: 'permissions' }]);

    return {
      ...populated.toJSON({ flattenObjectIds: true }),
      _id: populated._id.toString(),
    };
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: UserGroupQueryPayload): Promise<number> {
    const query: Record<string, unknown> = {};

    if (payload?._id) {
      query._id = { $ne: payload._id };
    }

    if (payload?.search) {
      query.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { description: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return Model.countDocuments(query);
  }
}
