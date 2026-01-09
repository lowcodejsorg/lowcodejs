import { Service } from 'fastify-decorators';

import type { IPermission } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { Permission as Model } from '@application/model/permission.model';

import type {
  PermissionContractRepository,
  PermissionCreatePayload,
  PermissionFindByPayload,
  PermissionQueryPayload,
  PermissionUpdatePayload,
} from './permission-contract.repository';

@Service()
export default class PermissionMongooseRepository implements PermissionContractRepository {
  private buildWhereClause(
    payload?: PermissionQueryPayload,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.search) {
      where.name = { $regex: normalize(payload.search), $options: 'i' };
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IPermission {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: PermissionCreatePayload): Promise<IPermission> {
    const created = await Model.create(payload);
    return this.transform(created);
  }

  async findBy({
    exact = false,
    ...payload
  }: PermissionFindByPayload): Promise<IPermission | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.slug) conditions.push({ slug: payload.slug });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const permission = await Model.findOne(whereClause);

    if (!permission) return null;

    return this.transform(permission);
  }

  async findMany(payload?: PermissionQueryPayload): Promise<IPermission[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const permissions = await Model.find(where)
      .sort({ name: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return permissions.map((p) => this.transform(p));
  }

  async update({
    _id,
    ...payload
  }: PermissionUpdatePayload): Promise<IPermission> {
    const permission = await Model.findOne({ _id });

    if (!permission) throw new Error('Permission not found');

    permission.set(payload);

    await permission.save();

    return this.transform(permission);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: PermissionQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
