import { Service } from 'fastify-decorators';
import mongoose from 'mongoose';
import slugify from 'slugify';
import type z from 'zod';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import {
  MENU_ITEM_TYPE,
  type Menu as Entity,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { Menu as Model } from '@application/model/menu.model';
import { Table } from '@application/model/table.model';

import type { MenuCreateBodyValidator } from './create.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof MenuCreateBodyValidator>;

@Service()
export default class MenuCreateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      let slug = payload.slug;
      let parent = null;

      if (payload.parent) {
        parent = await Model.findById(payload.parent);

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

      const menu = await Model.findOne({ slug, trashed: false });

      if (menu)
        return left(
          HTTPException.Conflict('Menu already exists', 'MENU_ALREADY_EXISTS'),
        );

      if ([MENU_ITEM_TYPE.TABLE, MENU_ITEM_TYPE.FORM].includes(payload.type)) {
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

        payload.url = '/tables/'.concat(table.slug);
      }

      if ([MENU_ITEM_TYPE.PAGE].includes(payload.type)) {
        payload.url = '/pages/'.concat(slug);
      }

      if (parent && parent.type !== MENU_ITEM_TYPE.SEPARATOR) {
        await Model.create({
          ...parent.toJSON({
            flattenObjectIds: true,
          }),
          parent: parent._id,
          _id: new mongoose.Types.ObjectId(),
          slug: slugify(parent.name, {
            lower: true,
            trim: true,
          }),
        });

        await parent
          .set({
            type: MENU_ITEM_TYPE.SEPARATOR,
            slug: slugify(parent.name.concat('-separator'), {
              lower: true,
              trim: true,
            }),
          })
          .save();
      }

      const created = await Model.create({
        ...payload,
        slug,
      });

      const populated = await created.populate([
        {
          path: 'table',
        },
      ]);

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id.toString(),
      });
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
