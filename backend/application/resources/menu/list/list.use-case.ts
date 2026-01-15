/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IMenu as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

type Response = Either<HTTPException, Entity[]>;

@Service()
export default class MenuListUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(): Promise<Response> {
    try {
      const menus = await this.menuRepository.findMany({ trashed: false });

      return right(menus);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_MENU_ERROR',
        ),
      );
    }
  }
}
