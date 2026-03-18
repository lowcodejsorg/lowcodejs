/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuRestorePayload } from './restore.validator';

type Response = Either<HTTPException, null>;
type Payload = MenuRestorePayload;

@Service()
export default class MenuRestoreUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const menu = await this.menuRepository.findBy({
        _id: payload._id,
        trashed: true,
        exact: true,
      });

      if (!menu)
        return left(
          HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'),
        );

      if (!menu.trashed)
        return left(
          HTTPException.Conflict('Menu is not in trash', 'NOT_TRASHED'),
        );

      await this.menuRepository.update({
        _id: menu._id,
        trashed: false,
        trashedAt: null,
      });

      return right(null);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'RESTORE_MENU_ERROR',
        ),
      );
    }
  }
}
