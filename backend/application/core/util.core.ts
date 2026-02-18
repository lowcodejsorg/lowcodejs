/* eslint-disable no-unused-vars */
import type { RootFilterQuery, SortOrder } from 'mongoose';
import mongoose from 'mongoose';

import { Field } from '@application/model/field.model';
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
import { executeScript } from './table/handler';
import type { FieldDefinition } from './table/types';

/**
 * Maps IField array to FieldDefinition array for sandbox execution
 * Includes all necessary data for each field type
 */
function mapFieldsForSandbox(fields: IField[]): FieldDefinition[] {
  return fields.map((f) => ({
    slug: f.slug,
    type: f.type,
    name: f.name,
    multiple: f.multiple ?? false,
    // Condicionalmente incluir dados extras baseado no tipo
    ...(f.relationship && { relationship: f.relationship }),
    ...(f.group && { group: f.group }),
    ...(f.dropdown?.length && { dropdown: f.dropdown }),
    ...(f.category?.length && { category: f.category }),
  }));
}

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

  // NATIVE
  [E_FIELD_TYPE.IDENTIFIER]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.CREATOR]: E_SCHEMA_TYPE.OBJECT_ID,
  [E_FIELD_TYPE.CREATED_AT]: E_SCHEMA_TYPE.DATE,
  [E_FIELD_TYPE.TRASHED]: E_SCHEMA_TYPE.BOOLEAN,
  [E_FIELD_TYPE.TRASHED_AT]: E_SCHEMA_TYPE.DATE,
};

function mapperSchema(
  field: IField,
  groups?: IGroupConfiguration[],
): ITableSchema {
  const mapper = {
    [E_FIELD_TYPE.TEXT_SHORT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.TEXT_LONG]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.DROPDOWN]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
        },
      ],
    },

    [E_FIELD_TYPE.FILE]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
          ref: 'Storage',
        },
      ],
    },

    [E_FIELD_TYPE.RELATIONSHIP]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
          ref: field?.relationship?.table?.slug ?? undefined,
        },
      ],
    },

    [E_FIELD_TYPE.FIELD_GROUP]: ((): Record<string, IEmbeddedSchema[]> => {
      const groupSlug = field?.group?.slug;
      const group = groups?.find((g) => g.slug === groupSlug);
      return {
        [field.slug]: [
          {
            type: 'Embedded' as const,
            schema: group?._schema || {},
            required: Boolean(field.required || false),
          },
        ],
      };
    })(),

    [E_FIELD_TYPE.DATE]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Date',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.CATEGORY]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
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
          required: Boolean(field.required || false),
          ref: 'User',
        },
      ],
    },

    // NATIVE
    [E_FIELD_TYPE.IDENTIFIER]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.CREATOR]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
        ref: 'User',
      },
    },

    [E_FIELD_TYPE.CREATED_AT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Date',
        required: Boolean(field.required || false),
      },
    },

    [E_FIELD_TYPE.TRASHED]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Boolean',
        required: Boolean(field.required || false),
        default: false,
      },
    },

    [E_FIELD_TYPE.TRASHED_AT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'Date',
        required: Boolean(field.required || false),
        default: null,
      },
    },
  };

  if (!(field.type in mapper) && !field?.multiple) {
    return {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.required || false),
      },
    };
  }

  if (!(field.type in mapper) && field?.multiple) {
    return {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.required || false),
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
  const schema: ITableSchema = {};

  for (const field of fields) {
    if (
      field.type === E_FIELD_TYPE.IDENTIFIER ||
      field.type === E_FIELD_TYPE.CREATED_AT
    ) {
      continue;
    }
    Object.assign(schema, mapperSchema(field, groups));
  }

  return schema;
}

interface Entity
  extends Omit<IRow, '_id'>, mongoose.Document<Omit<IRow, '_id'>> {
  _id: mongoose.Types.ObjectId;
}

interface IReverseRelationship {
  sourceTableSlug: string; // tabela que TEM o campo RELATIONSHIP (ex: "usuarios")
  fieldSlug: string; // slug do campo na tabela source (ex: "contatos")
  virtualName: string; // nome do virtual que sera registrado no schema
}

export async function findReverseRelationships(
  tableSlug: string,
): Promise<IReverseRelationship[]> {
  // Buscar campos RELATIONSHIP que apontam para esta tabela
  const reverseFields = await Field.find({
    type: E_FIELD_TYPE.RELATIONSHIP,
    'relationship.table.slug': tableSlug,
    trashed: { $ne: true },
  }).select('_id slug');

  if (reverseFields.length === 0) return [];

  // Encontrar as tabelas que contem esses campos
  const fieldIds = reverseFields.flatMap((f) => f._id);
  const tables = await Table.find({
    fields: { $in: fieldIds },
    trashed: { $ne: true },
  }).select('slug fields');

  // Mapear: para cada tabela, quais campos dela apontam para nos
  const result: IReverseRelationship[] = [];

  for (const table of tables) {
    const matchingFields = reverseFields.filter((rf) =>
      table.fields.some((fId: any) => fId.toString() === rf._id.toString()),
    );

    for (const field of matchingFields) {
      // Colisao: mesma tabela com 2+ campos apontando -> nome composto

      let virtualName = table.slug;

      if (matchingFields.length > 1) {
        virtualName = table.slug.concat('-').concat(field.slug);
      }

      result.push({
        sourceTableSlug: table.slug,
        fieldSlug: field.slug,
        virtualName,
      });
    }
  }

  return result;
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
  const schemaDefinition: Record<string, any> = {};

  for (const [key, value] of Object.entries(table._schema)) {
    if (Array.isArray(value) && value[0]?.type === 'Embedded') {
      // Cria subdocument schema para campos embedded
      const embeddedSchema = value[0].schema || {};
      const subSchemaDefinition: Record<string, any> = {};

      for (const [subKey, subValue] of Object.entries(embeddedSchema)) {
        subSchemaDefinition[subKey] = subValue;
      }

      const subSchema = new mongoose.Schema(subSchemaDefinition, {
        _id: true,
        timestamps: true,
        id: false,
      });
      schemaDefinition[key] = [subSchema];
    } else {
      schemaDefinition[key] = value;
    }
  }

  delete schemaDefinition['_id'];
  delete schemaDefinition['createdAt'];

  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  });

  // === VIRTUAL POPULATE (Relacionamentos Reversos) ===
  const reverseRelationships = await findReverseRelationships(table.slug);
  for (const rel of reverseRelationships) {
    schema.virtual(rel.virtualName, {
      ref: rel.sourceTableSlug, // modelo de onde vem os dados
      localField: '_id', // campo local (nesta tabela)
      foreignField: rel.fieldSlug, // campo na tabela source que referencia esta
    });
  }

  // ===== ADICIONA OS MIDDLEWARES AQUI =====

  if (table?.methods?.beforeSave?.code) {
    schema.pre('save', async function (next) {
      const result = await executeScript({
        code: table?.methods?.beforeSave?.code!,
        doc: this,
        tableSlug: table.slug,
        fields: mapFieldsForSandbox(table.fields as IField[]),
        context: {
          userAction: this.isNew ? 'novo_registro' : 'editar_registro',
          executionMoment: 'antes_salvar',
          userId: this.creator?.toString(),
          isNew: this.isNew,
          tableInfo: {
            _id: table._id?.toString() ?? '',
            name: table.name,
            slug: table.slug,
          },
        },
      });

      if (!result.success) {
        throw new Error(`Erro no beforeSave: ${result.error?.message}`);
      }

      next();
    });
  }

  if (table?.methods?.afterSave?.code) {
    schema.post('save', async function (doc, next) {
      const result = await executeScript({
        code: table?.methods?.afterSave?.code!,
        doc,
        tableSlug: table.slug,
        fields: mapFieldsForSandbox(table.fields as IField[]),
        context: {
          userAction: doc.isNew ? 'novo_registro' : 'editar_registro',
          executionMoment: 'depois_salvar',
          userId: doc.creator?.toString(),
          isNew: doc.isNew,
          tableInfo: {
            _id: table._id?.toString() ?? '',
            name: table.name,
            slug: table.slug,
          },
        },
      });

      if (!result.success) {
        console.error(
          'Erro no afterSave (não bloqueante):',
          result.error?.message,
        );
      }

      next();
    });
  }

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
    E_FIELD_TYPE.CREATOR,
  ];

  return fields.filter(
    (field) => field.type && types.some((t) => t === field.type),
  );
}

export async function buildPopulate(
  fields?: IField[],
  groups?: IGroupConfiguration[],
  tableSlug?: string,
): Promise<{ path: string; model?: string; select?: string }[]> {
  const relacionamentos = getRelationship(fields);
  const populate = [];

  for await (const field of relacionamentos) {
    if (
      field.type !== E_FIELD_TYPE.FIELD_GROUP &&
      field.type !== E_FIELD_TYPE.REACTION &&
      field.type !== E_FIELD_TYPE.EVALUATION &&
      field.type !== E_FIELD_TYPE.RELATIONSHIP &&
      field.type !== E_FIELD_TYPE.USER &&
      field.type !== E_FIELD_TYPE.CREATOR
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

    if (field.type === E_FIELD_TYPE.CREATOR) {
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
      const relationshipTableId = field?.relationship?.table?._id?.toString();
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
        const relationshipPopulate = await buildPopulate(
          relationshipFields,
          relationshipTable?.groups as IGroupConfiguration[],
        );

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

  if (groups) {
    for (const field of fields ?? []) {
      if (field.type !== E_FIELD_TYPE.FIELD_GROUP) continue;

      const groupSlug = field?.group?.slug;
      const group = groups.find((g) => g.slug === groupSlug);
      if (!group) continue;

      for (const groupField of group.fields || []) {
        if (groupField.type === E_FIELD_TYPE.USER) {
          populate.push({
            path: `${field.slug}.${groupField.slug}`,
            model: 'User',
            select: 'name email _id',
          });
        }

        if (groupField.type === E_FIELD_TYPE.FILE) {
          populate.push({
            path: `${field.slug}.${groupField.slug}`,
            model: 'Storage',
          });
        }

        if (groupField.type === E_FIELD_TYPE.RELATIONSHIP) {
          const relationshipTableId =
            groupField?.relationship?.table?._id?.toString();
          if (relationshipTableId) {
            const relationshipTable = await Table.findOne({
              _id: relationshipTableId,
            });

            if (relationshipTable) {
              await buildTable({
                ...relationshipTable.toJSON({ flattenObjectIds: true }),
                _id: relationshipTable._id.toString(),
              });

              populate.push({
                path: `${field.slug}.${groupField.slug}`,
                model: relationshipTable.slug,
              });
            }
          }
        }
      }
    }
  }

  // === VIRTUAL POPULATE (Relacionamentos Reversos) ===
  if (tableSlug) {
    const reverseRelationships = await findReverseRelationships(tableSlug);

    for (const rel of reverseRelationships) {
      const sourceTable = await Table.findOne({
        slug: rel.sourceTableSlug,
        trashed: { $ne: true },
      }).populate('fields');

      if (sourceTable) {
        // Registrar modelo source no Mongoose (necessario para populate funcionar)
        await buildTable({
          ...sourceTable.toJSON({ flattenObjectIds: true }),
          _id: sourceTable._id.toString(),
        });

        // Excluir campos RELATIONSHIP do select para evitar dados circulares
        const relationshipSlugs = (sourceTable.fields as IField[])
          .filter(
            (f) =>
              f.type === E_FIELD_TYPE.RELATIONSHIP && f.slug !== rel.fieldSlug,
          )
          .map((f) => `-${f.slug}`);

        populate.push({
          path: rel.virtualName,
          ...(relationshipSlugs.length > 0 && {
            select: relationshipSlugs.join(' '),
          }),
          // foreignField precisa estar no select pro match, mas nao deve aparecer no output
          transform: (doc: any) => {
            if (!doc) return doc;
            const obj = doc.toObject ? doc.toObject() : { ...doc };
            delete obj[rel.fieldSlug];
            return obj;
          },
        });
      }
    }
  }

  return [...populate];
}

type Query = Record<string, any>;

export async function buildQuery(
  {
    search,
    trashed,
    page: _page,
    perPage: _perPage,
    slug: _slug,
    public: _public,
    ...payload
  }: Partial<Query>,
  fields: IField[] = [],
  groups?: IGroupConfiguration[],
  tableSlug?: string,
): Promise<Query> {
  let query: Query = {
    trashed: trashed === 'true' ? true : { $ne: true },
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
        field.type === E_FIELD_TYPE.USER ||
        field.type === E_FIELD_TYPE.CREATOR) &&
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
      const groupSlug = field?.group?.slug;
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
          groupField.type === E_FIELD_TYPE.USER ||
          groupField.type === E_FIELD_TYPE.CREATOR
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
      (f) => f.type !== E_FIELD_TYPE.FIELD_GROUP && !f.native,
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
        const groupSlug = field?.group?.slug;
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

  // === FILTRO EM VIRTUAL RELATIONSHIPS (Reverse Lookup) ===
  if (tableSlug) {
    const reverseRelationships = await findReverseRelationships(tableSlug);

    for (const rel of reverseRelationships) {
      if (!payload[rel.virtualName]) continue;

      const filterIds = payload[rel.virtualName].toString().split(',');

      const db = mongoose.connection.db!;
      const sourceCollection = db.collection(rel.sourceTableSlug);

      const sourceRecords = await sourceCollection
        .find(
          {
            _id: {
              $in: filterIds.map(
                (id: string) => new mongoose.Types.ObjectId(id),
              ),
            },
          },
          { projection: { [rel.fieldSlug]: 1 } },
        )
        .toArray();

      const matchingIds = new Set<string>();
      for (const record of sourceRecords) {
        const fieldValue = record[rel.fieldSlug];
        if (Array.isArray(fieldValue)) {
          fieldValue.forEach((id) => matchingIds.add(id.toString()));
        } else if (fieldValue) {
          matchingIds.add(fieldValue.toString());
        }
      }

      const idCondition =
        matchingIds.size > 0
          ? {
              _id: {
                $in: [...matchingIds].map(
                  (id) => new mongoose.Types.ObjectId(id),
                ),
              },
            }
          : { _id: { $in: [] } };

      query = query.$and
        ? { $and: [...query.$and, idCondition] }
        : { $and: [query, idCondition] };
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
