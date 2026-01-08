import { Service } from 'fastify-decorators';

import { E_ROLE, type IUser } from '@application/core/entity.core';
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
  private readonly populateOptions = [
    { path: 'group', populate: { path: 'permissions' } },
  ];

  private async buildWhereClause(
    payload?: UserQueryPayload,
  ): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = {};

    // Filtro por trashed
    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    // Filtro por múltiplos IDs
    if (payload?._ids && payload._ids.length > 0) {
      where._id = { $in: payload._ids };
    }

    // Filtro por status
    if (payload?.status) {
      where.status = payload.status;
    }

    if (payload?.user?._id) {
      where._id = { $ne: payload.user._id };
    }

    if (payload?.user?.role === E_ROLE.ADMINISTRATOR) {
      const UserGroupModel = Model.db.model('UserGroup');
      const masterGroup = await UserGroupModel.findOne({ slug: E_ROLE.MASTER });

      if (masterGroup) {
        where.group = { $ne: masterGroup._id.toString() };
      }
    }

    if (payload?.search) {
      where.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { email: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IUser {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: UserCreatePayload): Promise<IUser> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({
    exact = false,
    ...payload
  }: UserFindByPayload): Promise<IUser | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.email) conditions.push({ email: payload.email });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const user = await Model.findOne(whereClause).populate(this.populateOptions);

    if (!user) return null;

    return this.transform(user);
  }

  async findMany(payload?: UserQueryPayload): Promise<IUser[]> {
    const where = await this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const users = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ name: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return users.map((u) => this.transform(u));
  }

  async update({ _id, ...payload }: UserUpdatePayload): Promise<IUser> {
    const user = await Model.findOne({ _id });

    if (!user) throw new Error('User not found');

    user.set(payload);

    await user.save();

    const populated = await user.populate(this.populateOptions);

    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: UserQueryPayload): Promise<number> {
    const where = await this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
