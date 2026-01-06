import { Service } from 'fastify-decorators';

import { E_ROLE, type User } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { User as Model } from '@application/model/user.model';

import type {
  UserContractRepository,
  UserCreatePayload,
  UserFindByPayload,
  UserQueryPayload,
  UserUpdatePayload,
} from './user-contract.repository';

@Service()
export default class UserMongooseRepository implements UserContractRepository {
  async create(payload: UserCreatePayload): Promise<User> {
    const created = await Model.create(payload);

    const populated = await created.populate([{ path: 'group' }]);

    return {
      ...populated.toJSON({ flattenObjectIds: true }),
      _id: populated._id.toString(),
    };
  }

  async findBy({
    exact = false,
    ...payload
  }: UserFindByPayload): Promise<User | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.email) conditions.push({ email: payload.email });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const user = await Model.findOne(whereClause).populate([{ path: 'group' }]);

    if (!user) return null;

    return {
      ...user.toJSON({ flattenObjectIds: true }),
      _id: user._id.toString(),
    };
  }

  async findMany(payload?: UserQueryPayload): Promise<User[]> {
    const query: Record<string, unknown> = {};

    if (payload?.user?._id) {
      query._id = { $ne: payload.user._id };
    }

    if (payload?.user?.role === 'ADMINISTRATOR') {
      const UserGroupModel = Model.db.model('UserGroup');
      const masterGroup = await UserGroupModel.findOne({ slug: E_ROLE.MASTER });

      if (masterGroup) {
        query.group = { $ne: masterGroup._id.toString() };
      }
    }

    if (payload?.search) {
      query.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { email: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    console.log({ query });

    let dbQuery = Model.find(query)
      .populate([{ path: 'group' }])
      .sort({ name: 'asc' });

    if (payload?.page && payload?.perPage) {
      const skip = (payload.page - 1) * payload.perPage;
      dbQuery = dbQuery.skip(skip).limit(payload.perPage);
    }

    const users = await dbQuery;

    return users.map((u) => ({
      ...u.toJSON({ flattenObjectIds: true }),
      _id: u._id.toString(),
    }));
  }

  async update({ _id, ...payload }: UserUpdatePayload): Promise<User> {
    const user = await Model.findOne({ _id });

    if (!user) throw new Error('User not found');

    user.set(payload);

    await user.save();

    const populated = await user.populate([{ path: 'group' }]);

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

  async count(payload?: UserQueryPayload): Promise<number> {
    const query: Record<string, unknown> = {};

    if (payload?.user?._id) {
      query._id = { $ne: payload.user._id };
    }

    if (payload?.user?.role === 'ADMINISTRATOR') {
      const UserGroupModel = Model.db.model('UserGroup');
      const masterGroup = await UserGroupModel.findOne({ slug: 'master' });
      if (masterGroup) {
        query.group = { $ne: masterGroup._id };
      }
    }

    if (payload?.search) {
      query.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { email: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return Model.countDocuments(query);
  }
}
