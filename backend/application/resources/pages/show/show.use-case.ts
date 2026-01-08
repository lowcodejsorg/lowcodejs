/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IMenu } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { PageShowPayload } from './show.validator';

type Response = Either<HTTPException, IMenu>;
type Payload = PageShowPayload;

@Service()
export default class PageShowUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await this.menuRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!menu)
        return left(HTTPException.NotFound('Page not found', 'PAGE_NOT_FOUND'));

      return right(menu);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'GET_MENU_ERROR',
        ),
      );
    }
  }
}
