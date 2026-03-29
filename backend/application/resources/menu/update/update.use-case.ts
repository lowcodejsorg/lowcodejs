/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_MENU_ITEM_TYPE,
  type IMenu as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  MenuContractRepository,
  type MenuUpdatePayload as RepositoryMenuUpdatePayload,
} from '@application/repositories/menu/menu-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { MenuUpdatePayload } from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = MenuUpdatePayload;

@Service()
export default class MenuUpdateUseCase {
  constructor(
    private readonly menuRepository: MenuContractRepository,
    private readonly tableRepository: TableContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const existingMenu = await this.menuRepository.findById(payload._id, {
        trashed: false,
      });

      if (!existingMenu)
        return left(
          HTTPException.NotFound('Menu não encontrado', 'MENU_NOT_FOUND'),
        );

      let finalSlug = payload.slug || existingMenu.slug;
      let parent = null;

      if (payload.parent !== undefined) {
        if (payload.parent) {
          // Check self-reference
          if (payload.parent === payload._id) {
            return left(
              HTTPException.BadRequest(
                'Menu não pode ser pai de si mesmo',
                'CIRCULAR_REFERENCE',
                { parent: 'Menu não pode ser pai de si mesmo' },
              ),
            );
          }

          // Check circular reference: ensure the new parent is not a descendant
          const descendantIds = await this.menuRepository.findDescendantIds(
            payload._id,
          );

          if (descendantIds.includes(payload.parent)) {
            return left(
              HTTPException.BadRequest(
                'Referência circular detectada',
                'CIRCULAR_REFERENCE',
                { parent: 'Referência circular detectada' },
              ),
            );
          }

          parent = await this.menuRepository.findById(payload.parent, {
            trashed: false,
          });

          if (!parent)
            return left(
              HTTPException.NotFound(
                'Menu pai não encontrado',
                'PARENT_MENU_NOT_FOUND',
                { parent: 'Menu pai não encontrado' },
              ),
            );

          finalSlug = slugify(finalSlug.concat('-').concat(parent.slug), {
            lower: true,
            trim: true,
          });
        }
      } else if (existingMenu.parent) {
        const currentParent = await this.menuRepository.findById(
          existingMenu.parent,
          { trashed: false },
        );
        if (currentParent) {
          finalSlug = slugify(
            finalSlug.concat('-').concat(currentParent.slug),
            {
              lower: true,
              trim: true,
            },
          );
        }
      }

      if (finalSlug !== existingMenu.slug) {
        const menuWithSameSlug = await this.menuRepository.findBySlug(
          finalSlug,
          { trashed: false },
        );

        if (menuWithSameSlug && menuWithSameSlug._id !== payload._id)
          return left(
            HTTPException.Conflict('Menu já existe', 'MENU_ALREADY_EXISTS', {
              name: 'Menu já existe',
            }),
          );
      }

      if (
        payload.type &&
        (payload.type === E_MENU_ITEM_TYPE.TABLE ||
          payload.type === E_MENU_ITEM_TYPE.FORM)
      ) {
        if (!payload.table) {
          return left(
            HTTPException.BadRequest(
              'ID da tabela é obrigatório para tipos tabela/formulário',
              'INVALID_PARAMETERS',
              {
                table:
                  'ID da tabela é obrigatório para tipos tabela/formulário',
              },
            ),
          );
        }

        const table = await this.tableRepository.findById(payload.table);

        if (!table)
          return left(
            HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND', {
              table: 'Tabela não encontrada',
            }),
          );

        if (payload.type === E_MENU_ITEM_TYPE.TABLE)
          payload.url = '/tables/'.concat(table.slug);

        if (payload.type === E_MENU_ITEM_TYPE.FORM)
          payload.url = '/tables/'.concat(table.slug).concat('/row/create');
      }

      if (payload.type && payload.type === E_MENU_ITEM_TYPE.PAGE) {
        payload.url = '/pages/'.concat(finalSlug);
      }

      // If parent changed, recalculate order
      const updatePayload: Record<string, unknown> = {
        ...payload,
        slug: finalSlug,
      };

      const parentChanged =
        payload.parent !== undefined && payload.parent !== existingMenu.parent;

      if (parentChanged && payload.order === undefined) {
        const siblingCount = await this.menuRepository.count({
          parent: payload.parent ?? undefined,
          trashed: false,
        });
        updatePayload.order = siblingCount;
      }

      const updated = await this.menuRepository.update(
        updatePayload as RepositoryMenuUpdatePayload,
      );

      return right(updated);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_MENU_ERROR',
        ),
      );
    }
  }
}
