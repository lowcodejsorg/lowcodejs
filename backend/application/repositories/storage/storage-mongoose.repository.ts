import { Service } from 'fastify-decorators';

import type { IStorage } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { Storage as Model } from '@application/model/storage.model';

import type {
  StorageContractRepository,
  StorageCreatePayload,
  StorageFindByPayload,
  StorageQueryPayload,
  StorageUpdatePayload,
} from './storage-contract.repository';

@Service()
export default class StorageMongooseRepository implements StorageContractRepository {
  private buildWhereClause(payload?: StorageQueryPayload): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.type) where.type = payload.type;

    if (payload?.search) {
      where.originalName = { $regex: normalize(payload.search), $options: 'i' };
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IStorage {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: StorageCreatePayload): Promise<IStorage> {
    const created = await Model.create(payload);
    return this.transform(created);
  }

  async createMany(payload: StorageCreatePayload[]): Promise<IStorage[]> {
    const storages = await Model.insertMany(payload);
    return storages.map((s) => this.transform(s));
  }

  async findBy({
    exact = false,
    ...payload
  }: StorageFindByPayload): Promise<IStorage | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.filename) conditions.push({ filename: payload.filename });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const storage = await Model.findOne(whereClause);

    if (!storage) return null;

    return this.transform(storage);
  }

  async findMany(payload?: StorageQueryPayload): Promise<IStorage[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const storages = await Model.find(where)
      .sort({ originalName: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return storages.map((s) => this.transform(s));
  }

  async update({ _id, ...payload }: StorageUpdatePayload): Promise<IStorage> {
    const storage = await Model.findOne({ _id });

    if (!storage) throw new Error('Storage not found');

    storage.set(payload);

    await storage.save();

    return this.transform(storage);
  }

  async delete(_id: string): Promise<IStorage | null> {
    const storage = await Model.findByIdAndDelete(_id);
    if (!storage) return null;
    return this.transform(storage);
  }

  async count(payload?: StorageQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
