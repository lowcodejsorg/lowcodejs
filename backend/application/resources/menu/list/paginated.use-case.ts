import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { Menu as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Menu as Model } from '@application/model/menu.model';

type Response = Either<HTTPException, Entity[]>;

@Service()
export default class MenuPaginatedUseCase {
  async execute(): Promise<Response> {
    try {
      const menus = await Model.find({ trashed: false }).sort({ name: 'asc' });

      return right(
        menus?.map((u) => ({
          ...u?.toJSON(),
          _id: u?._id.toString(),
        })),
      );
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
