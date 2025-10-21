/* eslint-disable no-unused-vars */

import { Either, left, right } from '@core/either.core';
import { FIELD_TYPE } from '@core/entity.core';
import { buildCollection, buildSchema } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import { Field } from '@model/field.model';
import { GetCollectionBySlugSchema } from '@validators/collections.validator';
import { CreateFieldCollectionSchema } from '@validators/field-collection.validator';
import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import z from 'zod';

type Response = Either<ApplicationException, import('@core/entity.core').Field>;

@Service()
export default class CreateFieldCollectionUseCase {
  async execute(
    payload: z.infer<typeof CreateFieldCollectionSchema> &
      z.infer<typeof GetCollectionBySlugSchema>,
  ): Promise<Response> {
    try {
      const collection = await Collection.findOne({
        slug: payload.slug,
      });

      if (!collection)
        return left(
          ApplicationException.NotFound(
            'Collection not found',
            'COLLECTION_NOT_FOUND',
          ),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const existFieldOnCollection = (
        collection.fields as import('@core/entity.core').Field[]
      )?.find((field) => field.slug === slug);

      if (existFieldOnCollection)
        return left(
          ApplicationException.Conflict(
            'Field already exist',
            'FIELD_ALREADY_EXIST',
          ),
        );

      const field = await Field.create({
        ...payload,
        slug,
        configuration: {
          ...payload.configuration,
          group: null,
        },
      });

      if (field.type === FIELD_TYPE.FIELD_GROUP) {
        const _schema = buildSchema([]);

        const group = await Collection.create({
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

        await buildCollection({
          ...group.toJSON({
            flattenObjectIds: true,
          }),
          _id: group._id.toString(),
        });
      }

      const fields = [
        ...((collection.fields as import('@core/entity.core').Field[]) ?? []),
        {
          ...field.toJSON({
            flattenObjectIds: true,
          }),
          _id: field._id.toString(),
        },
      ];
      const _schema = buildSchema(fields);

      await collection
        .set({
          ...collection.toJSON({
            flattenObjectIds: true,
          }),
          fields,
          _schema: {
            ...collection?.toJSON({
              flattenObjectIds: true,
            })._schema,
            ..._schema,
          },
        })
        .save();

      await buildCollection({
        ...collection.toJSON({
          flattenObjectIds: true,
        }),
        _id: collection._id.toString(),
      });

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
          'CREATE_FIELD_ERROR',
        ),
      );
    }
  }
}
