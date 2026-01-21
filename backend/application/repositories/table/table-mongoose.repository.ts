import { Service } from 'fastify-decorators';

import {
  E_FIELD_TYPE,
  type IField,
  type ITable,
  type ITableSchema,
} from '@application/core/entity.core';
import { FieldTypeMapper, normalize } from '@application/core/util.core';
import { Table as Model } from '@application/model/table.model';

import type {
  TableContractRepository,
  TableCreatePayload,
  TableFindByPayload,
  TableQueryPayload,
  TableUpdateManyPayload,
  TableUpdatePayload,
} from './table-contract.repository';

@Service()
export default class TableMongooseRepository implements TableContractRepository {
  private readonly populateOptions = [
    { path: 'logo' },
    { path: 'fields' },
    { path: 'configuration.owner' },
    { path: 'configuration.administrators' },
  ];

  private buildWhereClause(
    payload?: TableQueryPayload,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?._ids && payload._ids.length > 0) {
      where._id = { $in: payload._ids };
    }

    if (payload?.type) where.type = payload.type;
    if (payload?.owner) where['configuration.owner'] = payload.owner;

    if (payload?.search) {
      where.name = { $regex: normalize(payload.search), $options: 'i' };
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): ITable {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: TableCreatePayload): Promise<ITable> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findBy({
    exact = false,
    ...payload
  }: TableFindByPayload): Promise<ITable | null> {
    const conditions: Record<string, unknown>[] = [];

    if (payload._id) conditions.push({ _id: payload._id });
    if (payload.slug) conditions.push({ slug: payload.slug });

    if (conditions.length === 0) {
      throw new Error('At least one query is required');
    }

    const whereClause = exact ? { $and: conditions } : { $or: conditions };

    const table = await Model.findOne(whereClause).populate(
      this.populateOptions,
    );

    if (!table) return null;

    return this.transform(table);
  }

  async findMany(payload?: TableQueryPayload): Promise<ITable[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const tables = await Model.find(where)
      .populate(this.populateOptions)
      .sort({ name: 'asc' })
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return tables.map((t) => this.transform(t));
  }

  async update({ _id, ...payload }: TableUpdatePayload): Promise<ITable> {
    const table = await Model.findOne({ _id });

    if (!table) throw new Error('Table not found');

    table.set(payload);

    await table.save();

    const populated = await table.populate(this.populateOptions);

    return this.transform(populated);
  }

  async updateMany({
    _ids,
    type,
    data,
  }: TableUpdateManyPayload): Promise<void> {
    const where: Record<string, unknown> = { _id: { $in: _ids } };
    if (type) where.type = type;

    const updateData: Record<string, unknown> = {};
    if (data.visibility)
      updateData['configuration.visibility'] = data.visibility;
    if (data.style) updateData['configuration.style'] = data.style;
    if (data.collaboration)
      updateData['configuration.collaboration'] = data.collaboration;

    await Model.updateMany(where, { $set: updateData });
  }

  async delete(_id: string): Promise<void> {
    await Model.updateOne(
      { _id },
      { $set: { trashed: true, trashedAt: new Date() } },
    );
  }

  async count(payload?: TableQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }

  //

  mapperSchemaField(field: IField): ITableSchema {
    const mapper = {
      [E_FIELD_TYPE.TEXT_SHORT]: {
        [field.slug]: {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      },

      [E_FIELD_TYPE.TEXT_LONG]: {
        [field.slug]: {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      },

      [E_FIELD_TYPE.DROPDOWN]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
          },
        ],
      },

      [E_FIELD_TYPE.FILE]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
            ref: 'Storage',
          },
        ],
      },

      [E_FIELD_TYPE.RELATIONSHIP]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
            ref: field?.configuration?.relationship?.table?.slug ?? undefined,
          },
        ],
      },

      [E_FIELD_TYPE.FIELD_GROUP]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
            ref: field?.configuration?.group?.slug ?? undefined,
          },
        ],
      },

      [E_FIELD_TYPE.CATEGORY]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
          },
        ],
      },

      [E_FIELD_TYPE.EVALUATION]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'Number',
            required: false,
            ref: 'Evaluation',
          },
        ],
      },

      [E_FIELD_TYPE.REACTION]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: false,
            ref: 'Reaction',
          },
        ],
      },

      [E_FIELD_TYPE.USER]: {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
            ref: 'User',
          },
        ],
      },
    };

    if (!(field.type in mapper) && !field?.configuration?.multiple) {
      return {
        [field.slug]: {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      };
    }

    if (!(field.type in mapper) && field?.configuration?.multiple) {
      return {
        [field.slug]: [
          {
            type: FieldTypeMapper[field.type] || 'String',
            required: Boolean(field.configuration?.required || false),
          },
        ],
      };
    }

    return mapper[field.type as keyof typeof mapper];
  }

  buildSchema(fields: IField[]): ITableSchema {
    const schema: ITableSchema = {
      trashedAt: {
        type: 'Date',
        default: null,
      },
      trashed: {
        type: 'Boolean',
        default: false,
      },
    };

    for (const field of fields) {
      Object.assign(schema, this.mapperSchemaField(field));
    }

    return schema;
  }
}
