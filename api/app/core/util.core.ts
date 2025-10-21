/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { RootFilterQuery, SortOrder } from 'mongoose';
import mongoose from 'mongoose';

import { Collection } from '@model/collection.model';

import type {
  CollectionSchema,
  Field,
  Optional,
  Row,
  Schema,
} from './entity.core';
import { FIELD_TYPE } from './entity.core';

const FieldTypeMapper: Record<FIELD_TYPE, Schema['type']> = {
  [FIELD_TYPE.TEXT_SHORT]: 'String',
  [FIELD_TYPE.TEXT_LONG]: 'String',
  [FIELD_TYPE.DROPDOWN]: 'String',
  [FIELD_TYPE.FILE]: 'ObjectId',
  [FIELD_TYPE.DATE]: 'Date',
  [FIELD_TYPE.RELATIONSHIP]: 'ObjectId',
  [FIELD_TYPE.FIELD_GROUP]: 'ObjectId',
  [FIELD_TYPE.EVALUATION]: 'ObjectId',
  [FIELD_TYPE.REACTION]: 'ObjectId',
  [FIELD_TYPE.CATEGORY]: 'String',
};

function mapperSchema(field: Field): CollectionSchema {
  const mapper = {
    [FIELD_TYPE.TEXT_SHORT]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.configuration?.required || false),
      },
    },

    [FIELD_TYPE.TEXT_LONG]: {
      [field.slug]: {
        type: FieldTypeMapper[field.type] || 'String',
        required: Boolean(field.configuration?.required || false),
      },
    },

    [FIELD_TYPE.DROPDOWN]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      ],
    },

    [FIELD_TYPE.FILE]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
          ref: 'Storage',
        },
      ],
    },

    [FIELD_TYPE.RELATIONSHIP]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
          ref:
            field?.configuration?.relationship?.collection?.slug ?? undefined,
        },
      ],
    },

    [FIELD_TYPE.FIELD_GROUP]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
          ref: field?.configuration?.group?.slug ?? undefined,
        },
      ],
    },

    [FIELD_TYPE.CATEGORY]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'String',
          required: Boolean(field.configuration?.required || false),
        },
      ],
    },

    [FIELD_TYPE.EVALUATION]: {
      [field.slug]: [
        {
          type: FieldTypeMapper[field.type] || 'Number',
          required: false,
          ref: 'Evaluation',
        },
      ],
    },

    [FIELD_TYPE.REACTION]: {
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

export function buildSchema(fields: Field[]): CollectionSchema {
  const schema: CollectionSchema = {
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

interface Entity extends Omit<Row, '_id'>, mongoose.Document<Omit<Row, '_id'>> {
  _id: mongoose.Types.ObjectId;
}

export async function buildCollection(
  collection: Optional<
    import('@core/entity.core').Collection,
    '_id' | 'createdAt' | 'updatedAt' | 'trashed' | 'trashedAt'
  >,
): Promise<mongoose.Model<Entity>> {
  if (!collection?.slug) throw new Error('Collection slug not found');

  if (!collection?._schema) throw new Error('Collection schema not found');

  if (mongoose.models[collection.slug]) delete mongoose.models[collection.slug];

  const schema = new mongoose.Schema(
    {
      ...collection?._schema,
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    },
  );

  const model = (mongoose.models[collection?.slug] ||
    mongoose.model<Entity>(
      collection?.slug,
      schema,
      collection?.slug,
    )) as mongoose.Model<Entity>;

  await model?.createCollection();

  return model;
}

export function getRelationship(fields: Field[] = []): Field[] {
  const types = [
    FIELD_TYPE.RELATIONSHIP,
    FIELD_TYPE.FILE,
    FIELD_TYPE.FIELD_GROUP,
    FIELD_TYPE.REACTION,
    FIELD_TYPE.EVALUATION,
  ];

  return fields?.filter((field) => field.type && types.includes(field.type));
}

export async function buildPopulate(
  fields?: Field[],
): Promise<{ path: string }[]> {
  const relacionamentos = getRelationship(fields);
  const populate = [];

  for await (const field of relacionamentos) {
    if (
      ![
        FIELD_TYPE.FIELD_GROUP,
        FIELD_TYPE.REACTION,
        FIELD_TYPE.EVALUATION,
        FIELD_TYPE.RELATIONSHIP,
      ].includes(field.type)
    ) {
      populate.push({
        path: field.slug,
      });
    }

    if (field.type === FIELD_TYPE.REACTION) {
      populate.push({
        path: field.slug,
        populate: {
          path: 'user',
          select: 'name email _id',
        },
      });
    }

    if (field.type === FIELD_TYPE.EVALUATION) {
      populate.push({
        path: field.slug,
        populate: {
          path: 'user',
          select: 'name email _id',
        },
      });
    }

    if (field.type === FIELD_TYPE.RELATIONSHIP) {
      const relationshipCollectionId =
        field?.configuration?.relationship?.collection?._id?.toString();
      const relationshipCollection = await Collection.findOne({
        _id: relationshipCollectionId,
      });

      if (relationshipCollection) {
        await buildCollection({
          ...relationshipCollection.toJSON({
            flattenObjectIds: true,
          }),
          _id: relationshipCollection._id.toString(),
        });

        const relationshipFields = getRelationship(
          relationshipCollection?.fields as Field[],
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

    if (field.type === FIELD_TYPE.FIELD_GROUP) {
      const groupId = field?.configuration?.group?._id?.toString();

      const group = await Collection.findOne({
        _id: groupId,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (group) {
        await buildCollection({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });

        const groupRelationship = getRelationship(group?.fields as Field[]);

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

  return populate;
}

type Query = Record<string, any>;

export async function buildQuery(
  { search, trashed, ...payload }: Partial<Query>,
  fields: Field[] = [],
): Promise<Query> {
  let query: Query = {
    ...(trashed && { trashed: trashed === 'true' }),
  };

  for (const field of fields.filter((f) => f.type !== FIELD_TYPE.FIELD_GROUP)) {
    const slug = String(field.slug?.toString());

    if (
      [FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field.type) &&
      payload[slug]
    ) {
      query[slug] = {
        $regex: normalize(payload[slug]?.toString()),
        $options: 'i',
      };
    }

    if (
      [
        FIELD_TYPE.RELATIONSHIP,
        FIELD_TYPE.DROPDOWN,
        FIELD_TYPE.CATEGORY,
      ].includes(field.type) &&
      payload[slug]
    ) {
      query[slug] = {
        $in: payload[slug]?.toString().split(','),
      };
    }

    if (field.type === FIELD_TYPE.DATE) {
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
    if (f.type !== FIELD_TYPE.FIELD_GROUP) return false;
    const groupPrefix = f.slug.concat('-');
    return Object.keys(payload).some((key) => key.startsWith(groupPrefix));
  });

  if (hasFieldGroupQuery) {
    for (const field of fields.filter(
      (f) => f.type === FIELD_TYPE.FIELD_GROUP,
    )) {
      const slug = String(field.slug?.toString());

      const group = await Collection.findOne({
        slug: field?.configuration?.group?.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!group) continue;

      let groupPayload: Query = {};

      for (const fieldGroup of group?.fields as import('@core/entity.core').Field[]) {
        const fieldGroupSlug = slug.concat('-').concat(String(fieldGroup.slug));
        if (!(fieldGroupSlug in payload)) continue;
        groupPayload[fieldGroup.slug] = payload[fieldGroupSlug];
      }

      const queryGroup = await buildQuery(
        { ...groupPayload },
        group?.fields as import('@core/entity.core').Field[],
      );

      if (Object.keys(queryGroup).length > 0 && group) {
        const c = await buildCollection({
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
      (f) => f.type !== FIELD_TYPE.FIELD_GROUP,
    )) {
      if ([FIELD_TYPE.TEXT_SHORT, FIELD_TYPE.TEXT_LONG].includes(field?.type)) {
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
  | RootFilterQuery<Row>
  | QueryOrder[]
>;

export function buildOrder(
  query: Partial<QueryOrder>,
  fields: Field[] = [],
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
