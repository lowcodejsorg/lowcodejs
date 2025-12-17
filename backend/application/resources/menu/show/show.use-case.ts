import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { Menu as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Menu as Model } from '@application/model/menu.model';

import type { MenuShowParamValidator } from './show.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof MenuShowParamValidator>;

@Service()
export default class MenuShowUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await Model.findOne({ _id: payload._id }).populate([
        {
          path: 'table',
        },
        {
          path: 'parent',
        },
      ]);

      if (!menu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      // Buscar filhos ativos para qualquer tipo de menu
      const children = await Model.find({
        parent: payload._id,
        trashed: false,
      });

      return right({
        ...menu?.toJSON({
          flattenObjectIds: true,
        }),
        _id: menu?._id.toString(),
        children: children.map((child) => ({
          _id: child._id.toString(),
          name: child.name,
          type: child.type,
          slug: child.slug,
        })),
      });
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_MENU_BY_ID_ERROR',
        ),
      );
    }
  }
}
