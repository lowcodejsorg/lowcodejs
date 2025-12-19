import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { Meta, Paginated } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { normalize } from '@application/core/util.core';
import { Table as Model } from '@application/model/table.model';

import type { TablePaginatedQueryValidator } from './paginated.validator';

type Response = Either<
  HTTPException,
  Paginated<import('@application/core/entity.core').Table>
>;

type Payload = z.infer<typeof TablePaginatedQueryValidator>;

@Service()
export default class TablePaginatedUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

      const query: Record<string, unknown> = {
        type: 'table',
      };

      if (payload.search) {
        query.$or = [
          { name: { $regex: normalize(payload.search), $options: 'i' } },
          { description: { $regex: normalize(payload.search), $options: 'i' } },
        ];
      }

      if (payload.name)
        query.name = { $regex: normalize(payload.name), $options: 'i' };

      if (payload.trashed && payload.trashed === 'true') query.trashed = true;
      else query.trashed = false;

      console.log(JSON.stringify(payload, null, 2));

      const tables = await Model.find(query)
        .populate([
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
        ])
        .skip(skip)
        .limit(payload.perPage)
        .sort({
          name: payload['order-name'] ?? 'asc',
          slug: payload['order-link'] ?? 'asc',
          createdAt: payload['order-created-at'] ?? 'asc',
        });

      const total = await Model.countDocuments(query);

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: Meta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      return right({
        meta,
        data: tables?.map((u) => {
          return {
            ...u?.toJSON(),
            _id: u?._id.toString(),
          };
        }),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'TABLE_LIST_PAGINATED_ERROR',
        ),
      );
    }
  }
}
