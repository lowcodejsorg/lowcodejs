import type { RootFilterQuery, SortOrder } from 'mongoose';
import mongoose from 'mongoose';

import { Table } from '@application/model/table.model';

import type { IField, Optional, IRow, ISchema, ITableSchema } from './entity.core';
import { E_FIELD_TYPE } from './entity.core';
import { HandlerFunction } from './table/method.core';

const FieldTypeMapper: Record<keyof typeof E_FIELD_TYPE, ISchema['type']> = {
  [E_FIELD_TYPE.TEXT_SHORT]: 'String',
  [E_FIELD_TYPE.TEXT_LONG]: 'String',
  [E_FIELD_TYPE.DROPDOWN]: 'String',
  [E_FIELD_TYPE.FILE]: 'ObjectId',
  [E_FIELD_TYPE.DATE]: 'Date',
  [E_FIELD_TYPE.RELATIONSHIP]: 'ObjectId',
  [E_FIELD_TYPE.FIELD_GROUP]: 'ObjectId',
  [E_FIELD_TYPE.EVALUATION]: 'ObjectId',
  [E_FIELD_TYPE.REACTION]: 'ObjectId',
  [E_FIELD_TYPE.CATEGORY]: 'String',
};

function mapperSchema(field: IField): ITableSchema {
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

export function buildSchema(fields: IField[]): ITableSchema {
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
    Object.assign(schema, mapperSchema(field));
  }

  return schema;
}

interface Entity extends Omit<IRow, '_id'>, mongoose.Document<Omit<IRow, '_id'>> {
  _id: mongoose.Types.ObjectId;
}

export async function buildTable(
  table: Optional<
    import('@application/core/entity.core').ITable,
    '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
  >,
): Promise<mongoose.Model<Entity>> {
  if (!table?.slug) throw new Error('Table slug not found');

  if (!table?._schema) throw new Error('Table schema not found');

  if (mongoose.models[table.slug]) delete mongoose.models[table.slug];

  const schema = new mongoose.Schema(
    {
      ...table?._schema,
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    },
  );

  // ===== ADICIONA OS MIDDLEWARES AQUI =====

  if (table?.methods?.beforeSave?.code) {
    schema.pre('save', async function (next) {
      console.log('BEFORE SAVE');
      const result = HandlerFunction(
        table?.methods?.beforeSave?.code!,
        this,
        table.slug.toLowerCase(),
        table.fields.map((f: any) => f.slug),
        {
          ...(this.isNew && { userAction: 'novo_registro' }),
          ...(!this.isNew && { userAction: 'editar_registro' }),
          executionMoment: 'antes_salvar',
          tableId: table._id?.toString(),
          userId: this.creator?.toString(),
        },
      );

      if (!result.success) {
        throw new Error(`Erro no beforeSave: ${result.error}`);
      }

      next();
    });
  }

  if (table?.methods?.afterSave?.code) {
    schema.post('save', async function (doc, next) {
      console.log('AFTER SAVE');

      const result = HandlerFunction(
        table?.methods?.afterSave?.code!,
        doc,
        table.slug.toLowerCase(),
        table.fields.map((f: any) => f.slug),
        {
          ...(doc.isNew && { userAction: 'novo_registro' }),
          ...(!doc.isNew && { userAction: 'editar_registro' }),
          executionMoment: 'depois_salvar',
          tableId: table._id?.toString(),
          userId: doc.creator?.toString(),
        },
      );

      if (!result.success) {
        console.error('Erro no afterSave (não bloqueante):', result.error);
      }

      next();
    });
  }

  if (table?.methods?.onLoad?.code) {
    // Para consultas individuais (findOne)
    schema.post('findOne', async function (doc, next) {
      if (doc) {
        console.log('ON LOAD - findOne');
        const result = HandlerFunction(
          table?.methods?.onLoad?.code!,
          doc,
          table.slug.toLowerCase(),
          table.fields.map((f: any) => f.slug),
          {
            userAction: 'carregamento_formulario',
            executionMoment: 'carregamento_formulario',
            tableId: table._id?.toString(),
            userId: doc.creator?.toString(),
          },
        );

        if (!result.success) {
          console.error('Erro no onLoad (não bloqueante):', result.error);
        }
      }
      next();
    });

    // Para consultas múltiplas (find)
    schema.post('find', async function (docs, next) {
      if (docs && Array.isArray(docs)) {
        console.log('ON LOAD - find');
        for (const doc of docs) {
          const result = HandlerFunction(
            table?.methods?.onLoad?.code!,
            doc,
            table.slug.toLowerCase(),
            table.fields.map((f: any) => f.slug),
            {
              userAction: 'carregamento_formulario',
              executionMoment: 'carregamento_formulario',
              tableId: table._id?.toString(),
              userId: doc.creator?.toString(),
            },
          );

          if (!result.success) {
            console.error('Erro no onLoad (não bloqueante):', result.error);
          }
        }
      }
      next();
    });
  }

  // ===== FIM DOS MIDDLEWARES =====

  const model = (mongoose.models[table?.slug] ||
    mongoose.model<Entity>(
      table?.slug,
      schema,
      table?.slug,
    )) as mongoose.Model<Entity>;

  await model?.createCollection();

  return model;
}

export function getRelationship(fields: IField[] = []): IField[] {
  const types = [
    E_FIELD_TYPE.RELATIONSHIP,
    E_FIELD_TYPE.FILE,
    E_FIELD_TYPE.FIELD_GROUP,
    E_FIELD_TYPE.REACTION,
    E_FIELD_TYPE.EVALUATION,
  ];

  return fields.filter(
    (field) => field.type && types.some((t) => t === field.type),
  );
}

export async function buildPopulate(
  fields?: IField[],
): Promise<{ path: string; model?: string; select?: string }[]> {
  const relacionamentos = getRelationship(fields);
  const populate = [];

  for await (const field of relacionamentos) {
    if (
      field.type !== E_FIELD_TYPE.FIELD_GROUP &&
      field.type !== E_FIELD_TYPE.REACTION &&
      field.type !== E_FIELD_TYPE.EVALUATION &&
      field.type !== E_FIELD_TYPE.RELATIONSHIP
    ) {
      populate.push({
        path: field.slug,
      });
    }

    if (field.type === E_FIELD_TYPE.REACTION) {
      populate.push({
        path: field.slug,
        populate: {
          path: 'user',
          select: 'name email _id',
        },
      });
    }

    if (field.type === E_FIELD_TYPE.EVALUATION) {
      populate.push({
        path: field.slug,
        populate: {
          path: 'user',
          select: 'name email _id',
        },
      });
    }

    if (field.type === E_FIELD_TYPE.RELATIONSHIP) {
      const relationshipTableId =
        field?.configuration?.relationship?.table?._id?.toString();
      const relationshipTable = await Table.findOne({
        _id: relationshipTableId,
      });

      if (relationshipTable) {
        await buildTable({
          ...relationshipTable.toJSON({
            flattenObjectIds: true,
          }),
          _id: relationshipTable._id.toString(),
        });

        const relationshipFields = getRelationship(
          relationshipTable?.fields as IField[],
        );
        const relationshipPopulate = await buildPopulate(relationshipFields);

        populate.push({
          path: field.slug,
          ...(relationshipPopulate.length > 0 && {
            populate: relationshipPopulate,
          }),
        });
      }
    }

    if (field.type === E_FIELD_TYPE.FIELD_GROUP) {
      const groupId = field?.configuration?.group?._id?.toString();

      const group = await Table.findOne({
        _id: groupId,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (group) {
        await buildTable({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });

        const groupRelationship = getRelationship(group?.fields as IField[]);

        const groupFields = await buildPopulate(groupRelationship);

        populate.push({
          path: field.slug,
          ...(groupFields.length > 0 && {
            populate: groupFields,
          }),
        });
      }
    }
  }

  return [
    ...populate,
    {
      path: 'creator',
      model: 'User',
      select: 'name email _id',
    },
  ];
}

type Query = Record<string, any>;

export async function buildQuery(
  { search, trashed, ...payload }: Partial<Query>,
  fields: IField[] = [],
): Promise<Query> {
  let query: Query = {
    ...(trashed && { trashed: trashed === 'true' }),
  };

  for (const field of fields.filter(
    (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP,
  )) {
    const slug = String(field.slug?.toString());

    if (
      (field.type === E_FIELD_TYPE.TEXT_SHORT ||
        field.type === E_FIELD_TYPE.TEXT_LONG) &&
      payload[slug]
    ) {
      query[slug] = {
        $regex: normalize(payload[slug]?.toString()),
        $options: 'i',
      };
    }

    if (
      (field.type === E_FIELD_TYPE.RELATIONSHIP ||
        field.type === E_FIELD_TYPE.DROPDOWN ||
        field.type === E_FIELD_TYPE.CATEGORY) &&
      payload[slug]
    ) {
      query[slug] = {
        $in: payload[slug]?.toString().split(','),
      };
    }

    if (field.type === E_FIELD_TYPE.DATE) {
      const initialKey = `${slug}-initial`;
      const finalKey = `${slug}-final`;

      if (payload[initialKey]) {
        const initial = new Date(String(payload[initialKey]));
        query[field.slug].$gte = new Date(initial.setUTCHours(0, 0, 0, 0));
      }

      if (payload[finalKey]) {
        const final = new Date(String(payload[finalKey]));
        query[field.slug].$lte = new Date(final.setUTCHours(23, 59, 59, 999));
      }
    }
  }

  const hasFieldGroupQuery = fields.some((f) => {
    if (f.type !== E_FIELD_TYPE.FIELD_GROUP) return false;
    const groupPrefix = f.slug.concat('-');
    return Object.keys(payload).some((key) => key.startsWith(groupPrefix));
  });

  if (hasFieldGroupQuery) {
    for (const field of fields.filter(
      (f) => f.type === E_FIELD_TYPE.FIELD_GROUP,
    )) {
      const slug = String(field.slug?.toString());

      const group = await Table.findOne({
        slug: field?.configuration?.group?.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!group) continue;

      let groupPayload: Query = {};

      for (const fieldGroup of group?.fields as import('@application/core/entity.core').IField[]) {
        const fieldGroupSlug = slug.concat('-').concat(String(fieldGroup.slug));
        if (!(fieldGroupSlug in payload)) continue;
        groupPayload[fieldGroup.slug] = payload[fieldGroupSlug];
      }

      const queryGroup = await buildQuery(
        { ...groupPayload },
        group?.fields as import('@application/core/entity.core').IField[],
      );

      if (Object.keys(queryGroup).length > 0 && group) {
        const c = await buildTable({
          ...group?.toJSON({
            flattenObjectIds: true,
          }),
          _id: group?._id.toString(),
        });

        const ids: string[] = await c?.find(queryGroup).distinct('_id');

        if (ids.length === 0) continue;

        query[slug] = {
          $in: ids,
        };
      }
    }
  }

  if (search) {
    const searchQuery: Query[] = [];

    for (const field of fields.filter(
      (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP,
    )) {
      if (
        field?.type === E_FIELD_TYPE.TEXT_LONG ||
        field?.type === E_FIELD_TYPE.TEXT_SHORT
      ) {
        const slug = String(field.slug?.toString());
        searchQuery.push({
          [slug]: {
            $regex: normalize(search),
            $options: 'i',
          },
        });
      }
    }

    if (searchQuery.length > 0) {
      query = {
        $and: [{ ...query }, { $or: searchQuery }],
      };
    }
  }

  return query;
}

export type QueryOrder = Record<
  string,
  | number
  | string
  | boolean
  | null
  | unknown
  | RootFilterQuery<IRow>
  | QueryOrder[]
>;

export function buildOrder(
  query: Partial<QueryOrder>,
  fields: IField[] = [],
): {
  [key: string]: SortOrder;
} {
  if (Object.keys(query).length === 0) return {};

  const order = fields?.reduce(
    (acc, col) => {
      if (!col?.type || !col.slug || !('order-'.concat(col.slug) in query))
        return acc;

      const slug = String(col.slug?.toString());

      acc[slug] = query['order-'.concat(slug)]?.toString() as SortOrder;

      return acc;
    },
    {} as {
      [key: string]: SortOrder;
    },
  );

  return order;
}

export function normalize(search: string): string {
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapedSearch
    .replace(/a/gi, '[aáàâãä]')
    .replace(/e/gi, '[eéèêë]')
    .replace(/i/gi, '[iíìîï]')
    .replace(/o/gi, '[oóòôõö]')
    .replace(/u/gi, '[uúùûü]')
    .replace(/c/gi, '[cç]')
    .replace(/n/gi, '[nñ]');
}
