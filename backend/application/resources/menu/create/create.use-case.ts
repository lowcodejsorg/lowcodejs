/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  E_MENU_ITEM_TYPE,
  type IMenu as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Table } from '@application/model/table.model';
import {
  MenuContractRepository,
  type MenuCreatePayload,
} from '@application/repositories/menu/menu-contract.repository';

import type { MenuCreateBodyValidator } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof MenuCreateBodyValidator>;

@Service()
export default class MenuCreateUseCase {
  constructor(private readonly menuRepository: MenuContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      let slug = payload.slug;
      let parent = null;

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

        const table = await Table.findById(payload.table);

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

      if (parent && parent.type !== E_MENU_ITEM_TYPE.SEPARATOR) {
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

      const created = await this.menuRepository.create({
        ...payload,
        slug,
      } as MenuCreatePayload);

      return right(created);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_MENU_ERROR',
        ),
      );
    }
  }
}
