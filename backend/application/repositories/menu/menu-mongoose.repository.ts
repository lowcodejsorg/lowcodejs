import { Service } from 'fastify-decorators';

import type { IMenu } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { Menu as Model } from '@application/model/menu.model';

import type {
  MenuContractRepository,
  MenuCreatePayload,
  MenuFindByPayload,
  MenuQueryPayload,
  MenuUpdatePayload,
} from './menu-contract.repository';

@Service()
export default class MenuMongooseRepository implements MenuContractRepository {
  async create(payload: MenuCreatePayload): Promise<IMenu> {
    const created = await Model.create(payload);

    const populated = await created.populate([{ path: 'table' }]);

    return {
      ...populated.toJSON({ flattenObjectIds: true }),
      _id: populated._id.toString(),
    };
  }

  async findBy({
    exact = false,
    trashed = false,
    ...payload
  }: MenuFindByPayload): Promise<IMenu | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.slug) conditions.push({ slug: payload.slug });
    if (payload.parent !== undefined)
      conditions.push({ parent: payload.parent });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact
      ? { $and: [...conditions, { trashed }] }
      : { $or: conditions, trashed };

    const menu = await Model.findOne(whereClause).populate([
      { path: 'table' },
      { path: 'parent' },
    ]);

    if (!menu) return null;

    return {
      ...menu.toJSON({ flattenObjectIds: true }),
      _id: menu._id.toString(),
    };
  }

  async findMany(payload?: MenuQueryPayload): Promise<IMenu[]> {
    const query: Record<string, unknown> = {};

    if (payload?._id) {
      query._id = { $ne: payload._id };
    }

    if (payload?.trashed !== undefined) {
      query.trashed = payload.trashed;
    } else {
      query.trashed = false;
    }

    if (payload?.parent !== undefined) {
      query.parent = payload.parent;
    }

    if (payload?.search) {
      query.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { slug: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    let dbQuery = Model.find(query)
      .populate([{ path: 'table' }])
      .sort({ name: 'asc', slug: 'asc' });

    if (payload?.page && payload?.perPage) {
      const skip = (payload.page - 1) * payload.perPage;
      dbQuery = dbQuery.skip(skip).limit(payload.perPage);
    }

    const menus = await dbQuery;

    return menus.map((m) => ({
      ...m.toJSON({ flattenObjectIds: true }),
      _id: m._id.toString(),
    }));
  }

  async update({ _id, ...payload }: MenuUpdatePayload): Promise<IMenu> {
    const menu = await Model.findOne({ _id });

    if (!menu) throw new Error('Menu not found');

    menu.set(payload);

    await menu.save();

    const populated = await menu.populate([{ path: 'table' }]);

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

  async count(payload?: MenuQueryPayload): Promise<number> {
    const query: Record<string, unknown> = {};

    if (payload?._id) {
      query._id = { $ne: payload._id };
    }

    if (payload?.trashed !== undefined) {
      query.trashed = payload.trashed;
    } else {
      query.trashed = false;
    }

    if (payload?.parent !== undefined) {
      query.parent = payload.parent;
    }

    if (payload?.search) {
      query.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { slug: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return Model.countDocuments(query);
  }
}
