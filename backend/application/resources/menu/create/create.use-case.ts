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
  type MenuCreatePayload as RepositoryMenuCreatePayload,
} from '@application/repositories/menu/menu-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { MenuCreatePayload } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = MenuCreatePayload & { owner: string };

@Service()
export default class MenuCreateUseCase {
  constructor(
    private readonly menuRepository: MenuContractRepository,
    private readonly tableRepository: TableContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      let slug = payload.slug;
      let parent = null;

      if (payload.parent) {
        parent = await this.menuRepository.findBy({
          _id: payload.parent,
          trashed: false,
          exact: true,
        });

        if (!parent)
          return left(
            HTTPException.NotFound(
              'Parent menu not found',
              'PARENT_MENU_NOT_FOUND',
            ),
          );

        slug = slugify(slug.concat('-').concat(parent.slug), {
          lower: true,
          trim: true,
        });
      }

      const menu = await this.menuRepository.findBy({
        slug,
        trashed: false,
        exact: true,
      });

      if (menu)
        return left(
          HTTPException.Conflict('Menu already exists', 'MENU_ALREADY_EXISTS'),
        );

      if (
        payload.type === E_MENU_ITEM_TYPE.TABLE ||
        payload.type === E_MENU_ITEM_TYPE.FORM
      ) {
        if (!payload.table)
          return left(
            HTTPException.BadRequest(
              'Table ID is required for table/form types',
              'INVALID_PARAMETERS',
            ),
          );

        const table = await this.tableRepository.findBy({
          _id: payload.table,
          exact: true,
        });

        if (!table)
          return left(
            HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
          );

        if (payload.type === E_MENU_ITEM_TYPE.TABLE)
          payload.url = '/tables/'.concat(table.slug);

        if (payload.type === E_MENU_ITEM_TYPE.FORM)
          payload.url = '/tables/'.concat(table.slug).concat('/row/create');
      }

      if (payload.type === E_MENU_ITEM_TYPE.PAGE) {
        payload.url = '/pages/'.concat(slug);
      }

      // Auto-assign order: count siblings and place at end
      const siblingCount = await this.menuRepository.count({
        parent: payload.parent ?? undefined,
        trashed: false,
      });

      const created = await this.menuRepository.create({
        ...payload,
        slug,
        owner: payload.owner,
        order: siblingCount,
      } as RepositoryMenuCreatePayload);

      return right(created);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_MENU_ERROR',
        ),
      );
    }
  }
}
