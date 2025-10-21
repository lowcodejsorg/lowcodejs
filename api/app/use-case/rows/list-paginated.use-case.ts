/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@core/either.core';
import { left, right } from '@core/either.core';
import type { Meta, Paginated } from '@core/entity.core';
import {
  buildCollection,
  buildOrder,
  buildPopulate,
  buildQuery,
} from '@core/util.core';
import ApplicationException from '@exceptions/application.exception';
import { Collection } from '@model/collection.model';
import type {
  GetRowCollectionQuerySchema,
  GetRowCollectionSlugSchema,
  ListRowCollectionPaginatedSchema,
} from '@validators/row-collection.validator';

type Response = Either<
  ApplicationException,
  Paginated<import('@core/entity.core').Row[]>
>;

@Service()
export default class ListRowCollectionPaginatedUseCase {
  async execute(
    payload: z.infer<typeof ListRowCollectionPaginatedSchema> &
      z.infer<typeof GetRowCollectionSlugSchema> &
      z.infer<typeof GetRowCollectionQuerySchema>,
  ): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

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

      if (
        payload.public &&
        payload.public === 'true' &&
        collection?.configuration?.visibility !== 'public'
      ) {
        return left(
          ApplicationException.BadRequest(
            'Collection is not public',
            'COLLECTION_NOT_PUBLIC',
          ),
        );
      }

      const c = await buildCollection({
        ...collection?.toJSON({
          flattenObjectIds: true,
        }),
        _id: collection?._id.toString(),
      });

      console.info(
        'initial query on list-paginated.use-case.ts',
        JSON.stringify(payload, null, 2),
      );

      const query = await buildQuery(
        payload,
        collection?.fields as import('@core/entity.core').Field[],
      );

      console.info(
        'final query on list-paginated.use-case.ts',
        JSON.stringify(query, null, 2),
      );

      const order = buildOrder(
        payload,
        collection?.fields as import('@core/entity.core').Field[],
      );

      const populate = await buildPopulate(
        collection?.fields as import('@core/entity.core').Field[],
      );

      const rows = await c
        .find(query)
        .populate(populate)
        .skip(skip)
        .limit(payload.perPage)
        .sort(order);

      const total = await c.countDocuments(query);

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: Meta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      // @ts-ignore
      return right({
        meta,
        data: rows?.map((u) => ({
          ...u?.toJSON({
            flattenObjectIds: true,
          }),
          _id: u?._id.toString(),
        })),
      });
    } catch (error) {
      console.error(error);
      return left(
        ApplicationException.InternalServerError(
          'Internal server error',
          'LIST_ROW_COLLECTION_PAGINATED_ERROR',
        ),
      );
    }
  }
}
