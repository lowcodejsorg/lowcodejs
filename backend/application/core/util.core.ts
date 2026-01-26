import type { RootFilterQuery, SortOrder } from 'mongoose';
import mongoose from 'mongoose';

import { Table } from '@application/model/table.model';

import type {
  IEmbeddedSchema,
  IField,
  IGroupConfiguration,
  IRow,
  ITableSchema,
  Optional,
  ValueOf,
} from './entity.core';
import { E_FIELD_TYPE, E_SCHEMA_TYPE } from './entity.core';
import { HandlerFunction } from './table/method.core';

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;

const FieldTypeMapper: Record<
  keyof typeof E_FIELD_TYPE,
  ValueOf<typeof E_SCHEMA_TYPE>
> = {
  [E_FIELD_TYPE.TEXT_SHORT]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.TEXT_LONG]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.DROPDOWN]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.FILE]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.DATE]: E_SCHEMA_TYPE.DATE,
  [E_FIELD_TYPE.RELATIONSHIP]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.FIELD_GROUP]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.EVALUATION]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.REACTION]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.CATEGORY]: E_SCHEMA_TYPE.STRING,
  [E_FIELD_TYPE.USER]: E_SCHEMA_TYPE.OBJECT_ID,
};

function mapperSchema(
  field: IField,
  groups?: IGroupConfiguration[],
): ITableSchema {
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

    [E_FIELD_TYPE.FIELD_GROUP]: ((): Record<string, IEmbeddedSchema[]> => {
      const groupSlug = field?.configuration?.group?.slug;
      const group = groups?.find((g) => g.slug === groupSlug);
      return {
        [field.slug]: [
          {
            type: 'Embedded' as const,
            schema: group?._schema || {},
            required: Boolean(field.configuration?.required || false),
          },
        ],
      };
    })(),

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

export function buildSchema(
  fields: IField[],
  groups?: IGroupConfiguration[],
): ITableSchema {
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
    Object.assign(schema, mapperSchema(field, groups));
  }

  return schema;
}

interface Entity
  extends Omit<IRow, '_id'>, mongoose.Document<Omit<IRow, '_id'>> {
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

  // Processa _schema para converter campos Embedded em subdocument schemas
  const schemaDefinition: Record<string, any> = {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  };

  for (const [key, value] of Object.entries(table._schema)) {
    if (Array.isArray(value) && value[0]?.type === 'Embedded') {
      // Cria subdocument schema para campos embedded
      const embeddedSchema = value[0].schema || {};
      const subSchemaDefinition: Record<string, any> = {};

      for (const [subKey, subValue] of Object.entries(embeddedSchema)) {
        subSchemaDefinition[subKey] = subValue;
      }

      const subSchema = new mongoose.Schema(subSchemaDefinition, {
        _id: false,
      });
      schemaDefinition[key] = [subSchema];
    } else {
      schemaDefinition[key] = value;
    }
  }

  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  });

  // ===== ADICIONA OS MIDDLEWARES AQUI =====

  if (table?.methods?.beforeSave?.code) {
    schema.pre('save', async function (next) {
      const result = HandlerFunction(
        table?.methods?.beforeSave?.code!,
        this,
        table.slug,
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
      const result = HandlerFunction(
        table?.methods?.afterSave?.code!,
        doc,
        table.slug,
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
        const result = HandlerFunction(
          table?.methods?.onLoad?.code!,
          doc,
          table.slug,
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
  // FIELD_GROUP removido - agora são embedded documents, não precisam de populate
  const types = [
    E_FIELD_TYPE.RELATIONSHIP,
    E_FIELD_TYPE.FILE,
    E_FIELD_TYPE.REACTION,
    E_FIELD_TYPE.EVALUATION,
    E_FIELD_TYPE.USER,
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
      field.type !== E_FIELD_TYPE.RELATIONSHIP &&
      field.type !== E_FIELD_TYPE.USER
    ) {
      populate.push({
        path: field.slug,
      });
    }

    if (field.type === E_FIELD_TYPE.USER) {
      populate.push({
        path: field.slug,
        model: 'User',
        select: 'name email _id',
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

    // FIELD_GROUP não precisa de populate - dados são embedded
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
  groups?: IGroupConfiguration[],
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
        field.type === E_FIELD_TYPE.CATEGORY ||
        field.type === E_FIELD_TYPE.USER) &&
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
        query[field.slug] = query[field.slug] || {};
        query[field.slug].$gte = new Date(initial.setUTCHours(0, 0, 0, 0));
      }

      if (payload[finalKey]) {
        const final = new Date(String(payload[finalKey]));
        query[field.slug] = query[field.slug] || {};
        query[field.slug].$lte = new Date(final.setUTCHours(23, 59, 59, 999));
      }
    }
  }

  // Query em campos FIELD_GROUP usando dot notation (embedded documents)
  const hasFieldGroupQuery = fields.some((f) => {
    if (f.type !== E_FIELD_TYPE.FIELD_GROUP) return false;
    const groupPrefix = f.slug.concat('-');
    return Object.keys(payload).some((key) => key.startsWith(groupPrefix));
  });

  if (hasFieldGroupQuery && groups) {
    for (const field of fields.filter(
      (f) => f.type === E_FIELD_TYPE.FIELD_GROUP,
    )) {
      const groupSlug = field?.configuration?.group?.slug;
      const group = groups.find((g) => g.slug === groupSlug);

      if (!group) continue;

      const groupFields = group.fields || [];

      for (const groupField of groupFields) {
        const payloadKey = `${field.slug}-${groupField.slug}`;
        const embeddedPath = `${field.slug}.${groupField.slug}`;

        if (!(payloadKey in payload)) continue;

        if (
          groupField.type === E_FIELD_TYPE.TEXT_SHORT ||
          groupField.type === E_FIELD_TYPE.TEXT_LONG
        ) {
          query[embeddedPath] = {
            $regex: normalize(payload[payloadKey]?.toString()),
            $options: 'i',
          };
        }

        if (
          groupField.type === E_FIELD_TYPE.RELATIONSHIP ||
          groupField.type === E_FIELD_TYPE.DROPDOWN ||
          groupField.type === E_FIELD_TYPE.CATEGORY ||
          groupField.type === E_FIELD_TYPE.USER
        ) {
          query[embeddedPath] = {
            $in: payload[payloadKey]?.toString().split(','),
          };
        }

        if (groupField.type === E_FIELD_TYPE.DATE) {
          const initialKey = `${payloadKey}-initial`;
          const finalKey = `${payloadKey}-final`;

          if (payload[initialKey]) {
            const initial = new Date(String(payload[initialKey]));
            query[embeddedPath] = query[embeddedPath] || {};
            query[embeddedPath].$gte = new Date(
              initial.setUTCHours(0, 0, 0, 0),
            );
          }

          if (payload[finalKey]) {
            const final = new Date(String(payload[finalKey]));
            query[embeddedPath] = query[embeddedPath] || {};
            query[embeddedPath].$lte = new Date(
              final.setUTCHours(23, 59, 59, 999),
            );
          }
        }
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

    // Também busca em campos embedded (grupos)
    if (groups) {
      for (const field of fields.filter(
        (f) => f.type === E_FIELD_TYPE.FIELD_GROUP,
      )) {
        const groupSlug = field?.configuration?.group?.slug;
        const group = groups.find((g) => g.slug === groupSlug);

        if (!group) continue;

        for (const groupField of group.fields || []) {
          if (
            groupField.type === E_FIELD_TYPE.TEXT_LONG ||
            groupField.type === E_FIELD_TYPE.TEXT_SHORT
          ) {
            const embeddedPath = `${field.slug}.${groupField.slug}`;
            searchQuery.push({
              [embeddedPath]: {
                $regex: normalize(search),
                $options: 'i',
              },
            });
          }
        }
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
