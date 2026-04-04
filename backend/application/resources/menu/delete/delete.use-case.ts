/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuDeletePayload } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = MenuDeletePayload;

@Service()
export default class MenuDeleteUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await this.menuRepository.findById(payload._id, {
        trashed: false,
      });

      if (!menu)
        return left(
          HTTPException.NotFound('Menu não encontrado', 'MENU_NOT_FOUND'),
        );

      const childrenCount = await this.menuRepository.count({
        parent: menu._id,
        trashed: false,
      });

      if (childrenCount > 0) {
        return left(
          HTTPException.Conflict(
            'Menu possui filhos ativos',
            'MENU_HAS_CHILDREN',
          ),
        );
      }

      await this.menuRepository.update({
        _id: menu._id,
        trashed: true,
        trashedAt: new Date(),
      });

      return right(null);
    } catch (error) {
      console.error('[menu > delete][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'DELETE_MENU_ERROR',
        ),
      );
    }
  }
}
