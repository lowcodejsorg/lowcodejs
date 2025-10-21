import { Either, left, right } from '@core/either.core';
import { buildSchema } from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection as Model } from '@model/collection.model';
import { CreateCollectionSchema } from '@validators/collections.validator';
import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import z from 'zod';

type Response = Either<
  ApplicationException,
  import('@core/entity.core').Collection
>;

@Service()
export default class CreateCollectionUseCase {
  async execute(
    payload: z.infer<typeof CreateCollectionSchema>,
  ): Promise<Response> {
    try {
      if (!payload.owner)
        return left(
          ApplicationException.BadRequest('Owner required', 'OWNER_REQUIRED'),
        );

      const slug = slugify(payload.name, { lower: true, trim: true });

      const collection = await Model.findOne({ slug });

      if (collection)
        return left(
          ApplicationException.Conflict(
            'Collection already exists',
            'COLLECTION_ALREADY_EXISTS',
          ),
        );

      const _schema = buildSchema([]);

      const created = await Model.create({
        ...payload,
        _schema,
        slug,
        fields: [],
        type: 'collection',
        configuration: {
          owner: payload.owner,
          administrators: [],
          collaboration: 'restricted',
          style: 'list',
          visibility: 'restricted',
          fields: {
            orderForm: [],
            orderList: [],
          },
        },
      });

      const populated = await created.populate([
        {
          path: 'configuration.administrators',
          select: 'name _id',
          model: 'User',
        },
        {
          path: 'logo',
          model: 'Storage',
        },
        {
          path: 'configuration.owner',
          select: 'name _id',
          model: 'User',
        },
        {
          path: 'fields',
          model: 'Field',
        },
      ]);

      return right({
        ...populated.toJSON(),
        _id: created._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'CREATE_COLLECTION_ERROR',
        ),
      );
    }
  }
}
