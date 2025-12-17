import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { Menu } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Menu as Model } from '@application/model/menu.model';

import type { PageShowParamValidator } from './show.validator';

type Response = Either<HTTPException, Menu>;
type Payload = z.infer<typeof PageShowParamValidator>;
@Service()
export default class PageShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await Model.findOne({ slug: payload.slug });

      if (!menu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      return right({
        ...menu?.toJSON({
          flattenObjectIds: true,
        }),
        _id: menu?._id.toString(),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_MENU_ERROR',
        ),
      );
    }
  }
}
