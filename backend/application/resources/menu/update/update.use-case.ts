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
      const existingMenu = await this.menuRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!existingMenu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      let finalSlug = payload.slug || existingMenu.slug;
      let parent = null;

      if (payload.parent !== undefined) {
        if (payload.parent) {
          parent = await this.menuRepository.findBy({
            _id: payload.parent,
            exact: true,
          });

          if (!parent)
            return left(
              HTTPException.NotFound(
                'Parent menu not found',
                'PARENT_MENU_NOT_FOUND',
              ),
            );

          finalSlug = slugify(finalSlug.concat('-').concat(parent.slug), {
            lower: true,
            trim: true,
          });
        }
      } else if (existingMenu.parent) {
        const currentParent = await this.menuRepository.findBy({
          _id: existingMenu.parent,
          exact: true,
        });
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
        const menuWithSameSlug = await this.menuRepository.findBy({
          slug: finalSlug,
          trashed: false,
          exact: true,
        });

        if (menuWithSameSlug && menuWithSameSlug._id !== payload._id)
          return left(
            HTTPException.Conflict(
              'Menu already exists',
              'MENU_ALREADY_EXISTS',
            ),
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
              'Table ID is required for table/form types',
              'INVALID_PARAMETERS',
            ),
          );
        }

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

      if (payload.type && payload.type === E_MENU_ITEM_TYPE.PAGE) {
        payload.url = '/pages/'.concat(finalSlug);
      }

      if (parent) {
        if (payload.parent === payload._id) {
          return left(
            HTTPException.BadRequest(
              'Menu cannot be parent of itself',
              'INVALID_PARAMETERS',
            ),
          );
        }

        if (parent.type !== E_MENU_ITEM_TYPE.SEPARATOR) {
          await this.menuRepository.create({
            name: parent.name,
            slug: slugify(parent.name, {
              lower: true,
              trim: true,
            }),
            type: parent.type,
            table: parent.table,
            parent: parent._id,
            url: parent.url,
            html: parent.html,
          });

          await this.menuRepository.update({
            _id: parent._id,
            type: E_MENU_ITEM_TYPE.SEPARATOR,
            slug: slugify(parent.name.concat('-separator'), {
              lower: true,
              trim: true,
            }),
          });
        }
      }

      const updated = await this.menuRepository.update({
        ...payload,
        slug: finalSlug,
      } as RepositoryMenuUpdatePayload);

      return right(updated);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'UPDATE_MENU_ERROR',
        ),
      );
    }
  }
}
