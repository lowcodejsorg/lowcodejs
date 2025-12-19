import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  Menu as Entity,
  Meta,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { normalize } from '@application/core/util.core';
import { Menu as Model } from '@application/model/menu.model';

import type { MenuPaginatedQueryValidator } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = z.infer<typeof MenuPaginatedQueryValidator>;

@Service()
export default class MenuPaginatedUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const skip = (payload.page - 1) * payload.perPage;

      const query: Record<string, unknown> = {};

      if (payload.search) {
        query.$or = [
          { name: { $regex: normalize(payload.search), $options: 'i' } },
          { slug: { $regex: normalize(payload.search), $options: 'i' } },
        ];
      }

      query.trashed = false;

      const menus = await Model.find(query)
        .populate([
          {
            path: 'table',
          },
        ])
        .skip(skip)
        .limit(payload.perPage)
        .sort({ name: 'asc', slug: 'asc' });

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
        data: menus?.map((u) => ({
          ...u?.toJSON(),
          _id: u?._id.toString(),
        })),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'LIST_MENU_PAGINATED_ERROR',
        ),
      );
    }
  }
}
