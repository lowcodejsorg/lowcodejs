import { Service } from 'fastify-decorators';

import type { IField } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { Field as Model } from '@application/model/field.model';

import type {
  FieldContractRepository,
  FieldCreatePayload,
  FieldFindByPayload,
  FieldQueryPayload,
  FieldUpdatePayload,
} from './field-contract.repository';

@Service()
export default class FieldMongooseRepository implements FieldContractRepository {
  private buildWhereClause(payload?: FieldQueryPayload): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.type) where.type = payload.type;

    if (payload?._ids && payload._ids.length > 0) {
      where._id = { $in: payload._ids };
    }

    if (payload?.search) {
      where.name = { $regex: normalize(payload.search), $options: 'i' };
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): IField {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: FieldCreatePayload): Promise<IField> {
    const created = await Model.create(payload);
    return this.transform(created);
  }

  async findBy({
    exact = false,
    ...payload
  }: FieldFindByPayload): Promise<IField | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.slug) conditions.push({ slug: payload.slug });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const field = await Model.findOne(whereClause);

    if (!field) return null;

    return this.transform(field);
  }

  async findMany(payload?: FieldQueryPayload): Promise<IField[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const fields = await Model.find(where)
      .sort({ name: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return fields.map((f) => this.transform(f));
  }

  async update({ _id, ...payload }: FieldUpdatePayload): Promise<IField> {
    const field = await Model.findOne({ _id });

    if (!field) throw new Error('Field not found');

    field.set(payload);

    await field.save();

    return this.transform(field);
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: FieldQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
