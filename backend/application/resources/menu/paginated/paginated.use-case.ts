/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IMenu as Entity,
  IMeta,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuPaginatedQueryValidator } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = z.infer<typeof MenuPaginatedQueryValidator>;

@Service()
export default class MenuPaginatedUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const menus = await this.menuRepository.findMany({
        page: payload.page,
        perPage: payload.perPage,
        search: payload.search,
        trashed: false,
      });

      const total = await this.menuRepository.count({
        search: payload.search,
        trashed: false,
      });

      const lastPage = Math.ceil(total / payload.perPage);

      const meta: IMeta = {
        total,
        perPage: payload.perPage,
        page: payload.page,
        lastPage,
        firstPage: total > 0 ? 1 : 0,
      };

      return right({
        meta,
        data: menus,
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
