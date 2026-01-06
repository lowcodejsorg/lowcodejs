import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { E_MENU_ITEM_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuDeleteParamValidator } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = z.infer<typeof MenuDeleteParamValidator>;

@Service()
export default class MenuDeleteUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await this.menuRepository.findBy({
        _id: payload._id,
        trashed: false,
        exact: true,
      });

      if (!menu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      if (menu.type === E_MENU_ITEM_TYPE.SEPARATOR) {
        const childrenCount = await this.menuRepository.count({
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

      await this.menuRepository.delete(menu._id);

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
