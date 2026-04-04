/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import HTTPException from '@application/core/exception.core';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';

import type { MenuReorderPayload } from './reorder.validator';

type Response = Either<HTTPException, null>;

@Service()
export default class MenuReorderUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: MenuReorderPayload): Promise<Response> {
    try {
      if (payload.items.length === 0) {
        return left(
          HTTPException.BadRequest(
            'Lista de itens está vazia',
            'INVALID_PARAMETERS',
          ),
        );
      }

      // Validate all items exist and share the same parent
      let commonParent: string | null | undefined;

      for (const item of payload.items) {
        const menu = await this.menuRepository.findById(item._id, {
          trashed: false,
        });

        if (!menu) {
          return left(
            HTTPException.NotFound(
              `Menu ${item._id} não encontrado`,
              'MENU_NOT_FOUND',
            ),
          );
        }

        if (commonParent === undefined) {
          commonParent = menu.parent;
        } else if (menu.parent !== commonParent) {
          return left(
            HTTPException.BadRequest(
              'Todos os itens devem compartilhar o mesmo pai',
              'INVALID_PARAMETERS',
            ),
          );
        }
      }

      // Update order for each item
      for (const item of payload.items) {
        await this.menuRepository.update({
          _id: item._id,
          order: item.order,
        });
      }

      return right(null);
    } catch (error) {
      console.error('[menu > reorder][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'REORDER_MENU_ERROR',
        ),
      );
    }
  }
}
