import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { E_MENU_ITEM_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Menu as Model } from '@application/model/menu.model';

import type { MenuDeleteParamValidator } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = z.infer<typeof MenuDeleteParamValidator>;

@Service()
export default class MenuDeleteUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      // Buscar menu não deletado
      const menu = await Model.findOne({
        _id: payload._id,
        trashed: false,
      });

      if (!menu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      // Se for SEPARATOR, verificar se tem filhos ativos
      if (menu.type === E_MENU_ITEM_TYPE.SEPARATOR) {
        const childrenCount = await Model.countDocuments({
          parent: menu._id,
          trashed: false,
        });

        if (childrenCount > 0) {
          return left(
            HTTPException.Conflict(
              'Separator has active children',
              'SEPARATOR_HAS_CHILDREN',
            ),
          );
        }
      }

      // Soft delete
      await menu
        .set({
          trashed: true,
          trashedAt: new Date(),
        })
        .save();

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'DELETE_MENU_ERROR',
        ),
      );
    }
  }
}
