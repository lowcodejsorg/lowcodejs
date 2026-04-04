/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type {
  IMenu as Entity,
  IMeta,
  Paginated,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuPaginatedPayload } from './paginated.validator';

type Response = Either<HTTPException, Paginated<Entity>>;
type Payload = MenuPaginatedPayload;

@Service()
export default class MenuPaginatedUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const sort: Record<string, 'asc' | 'desc'> = {};
      if (payload['order-name']) sort.name = payload['order-name'];
      if (payload['order-slug']) sort.slug = payload['order-slug'];
      if (payload['order-type']) sort.type = payload['order-type'];
      if (payload['order-created-at'])
        sort.createdAt = payload['order-created-at'];
      if (payload['order-owner']) sort['owner.name'] = payload['order-owner'];

      const menus = await this.menuRepository.findMany({
        page: payload.page,
        perPage: payload.perPage,
        search: payload.search,
        trashed: payload.trashed ?? false,
        sort,
      });

      const total = await this.menuRepository.count({
        search: payload.search,
        trashed: payload.trashed ?? false,
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
      console.error('[menu > paginated][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_MENU_PAGINATED_ERROR',
        ),
      );
    }
  }
}
