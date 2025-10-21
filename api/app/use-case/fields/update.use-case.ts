/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import type z from 'zod';

import type { Either } from '@core/either.core';
import { left, right } from '@core/either.core';
import { FIELD_TYPE } from '@core/entity.core';
import { buildCollection, buildSchema } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Field } from '@model/field.model';
import type { GetCollectionBySlugSchema } from '@validators/collections.validator';
import type {
  GetFieldCollectionByIdSchema,
  UpdateFieldCollectionSchema,
} from '@validators/field-collection.validator';

type Response = Either<ApplicationException, import('@core/entity.core').Field>;

@Service()
export default class UpdateFieldCollectionUseCase {
  async execute(
    payload: z.infer<typeof UpdateFieldCollectionSchema> &
      z.infer<typeof GetFieldCollectionByIdSchema> &
      z.infer<typeof GetCollectionBySlugSchema>,
  ): Promise<Response> {
    try {
      const collection = await Collection.findOne({
        slug: payload.slug,
      }).populate([
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      if (!collection)
        return left(
          ApplicationException.NotFound(
            'Collection not found',
            'COLLECTION_NOT_FOUND',
          ),
        );

      const field = await Field.findOne({ _id: payload._id });

      if (!field)
        return left(
          ApplicationException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (
        collection?.fields?.filter(
          (f) => !(f as import('@core/entity.core').Field).trashed,
        ).length === 1 &&
        payload.trashed
      ) {
        return left(
          ApplicationException.Conflict(
            'Last active field, should not be sent to trash',
            'LAST_ACTIVE_FIELD',
          ),
        );
      }

      const oldSlug = field.slug;

      const slug = slugify(payload.name, { lower: true, trim: true });

      await field
        .set({
          ...field.toJSON({
            flattenObjectIds: true,
          }),
          ...payload,
          slug,
          ...(payload.trashed && { trashed: payload.trashed }),
          ...(payload.trashedAt && {
            trashedAt: payload.trashedAt,
          }),
        })
        .save();

      if (field.type === FIELD_TYPE.FIELD_GROUP) {
        let group;

        // Se já tem grupo, busca existente
        if (field.configuration?.group?._id) {
          group = await Collection.findOne({
            _id: field.configuration.group._id,
          });
        }

        // Se não tem grupo, cria novo
        if (!group) {
          const _schema = buildSchema([]);
          group = await Collection.create({
            _schema,
            fields: [],
            slug,
            configuration: {
              administrators: [],
              fields: {
                orderForm: [],
                orderList: [],
              },
              collaboration: 'restricted',
              style: 'list',
              visibility: 'restricted',
              owner: collection?.configuration?.owner?.toString(),
            },
            description: null,
            name: field.name,
            type: 'field-group',
          });

          // Atualiza field com referência ao grupo
          await field
            .set({
              ...field.toJSON({
                flattenObjectIds: true,
              }),
              configuration: {
                ...field.toJSON({
                  flattenObjectIds: true,
                }).configuration,
                group: {
                  _id: group._id,
                  slug: group.slug,
                },
              },
            })
            .save();
        }

        // Sempre registra o modelo do grupo
        await buildCollection({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });
      }

      const fields = (
        collection.fields as import('@core/entity.core').Field[]
      ).map((f) => {
        if (f._id?.toString() === field._id?.toString()) {
          return {
            ...field?.toJSON({
              flattenObjectIds: true,
            }),
            _id: field?._id?.toString(),
          };
        }

        return f;
      });

      const _schema = buildSchema(fields);

      await collection
        .set({
          ...collection.toJSON({
            flattenObjectIds: true,
          }),
          _schema,
          fields: fields.flatMap((f) => f._id?.toString()),
        })
        .save();

      if (oldSlug !== slug) {
        const c = await buildCollection({
          ...collection.toJSON({
            flattenObjectIds: true,
          }),
          _id: collection._id.toString(),
        });
        await c.updateMany(
          {},
          {
            $rename: {
              [oldSlug]: slug,
            },
          },
        );
      }

      return right({
        ...field.toJSON({
          flattenObjectIds: true,
        }),
        _id: field._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'UPDATE_FIELD_COLLECTION_ERROR',
        ),
      );
    }
  }
}
