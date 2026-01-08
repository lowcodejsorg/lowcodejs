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
  private readonly populateOptions = [{ path: 'table' }, { path: 'parent' }];

  private buildWhereClause(
    payload?: MenuQueryPayload,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.parent !== undefined) {
      where.parent = payload.parent;
    }

    if (payload?.search) {
      where.$or = [
        { name: { $regex: normalize(payload.search), $options: 'i' } },
        { slug: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IMenu {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: MenuCreatePayload): Promise<IMenu> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
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

    const menu = await Model.findOne(whereClause).populate(
      this.populateOptions,
    );

    if (!menu) return null;

    return this.transform(menu);
  }

  async findMany(payload?: MenuQueryPayload): Promise<IMenu[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const menus = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ name: 'asc', slug: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return menus.map((m) => this.transform(m));
  }

  async update({ _id, ...payload }: MenuUpdatePayload): Promise<IMenu> {
    const menu = await Model.findOne({ _id });

    if (!menu) throw new Error('Menu not found');

    menu.set(payload);

    await menu.save();

    const populated = await menu.populate(this.populateOptions);

    return this.transform(populated);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: MenuQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
