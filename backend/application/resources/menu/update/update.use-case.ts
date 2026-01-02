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

import type {
  MenuUpdateBodyValidator,
  MenuUpdateParamsValidator,
} from './update.validator';

type Response = Either<HTTPException, Entity>;
type Payload = z.infer<typeof MenuUpdateBodyValidator> &
  z.infer<typeof MenuUpdateParamsValidator>;

@Service()
export default class MenuUpdateUseCase {
  async execute(payload: Payload): Promise<Response> {
    try {
      // Verifica se o menu existe
      const existingMenu = await Model.findById(payload._id);

      if (!existingMenu)
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));

      // Gerar slug final considerando parent
      let finalSlug = payload.slug || existingMenu.slug;
      let parent = null;

      // Se o parent está sendo alterado, regenerar slug
      if (payload.parent !== undefined) {
        if (payload.parent) {
          parent = await Model.findById(payload.parent);

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
        // Se parent é null, usar slug original sem sufixo
      } else if (existingMenu.parent) {
        // Se não está alterando parent mas o menu atual tem parent, manter slug com parent
        const currentParent = await Model.findById(existingMenu.parent);
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

      // Verifica se o novo slug final já existe
      if (finalSlug !== existingMenu.slug) {
        const menuWithSameSlug = await Model.findOne({
          slug: finalSlug,
          _id: { $ne: payload._id },
          trashed: false,
        });

        if (menuWithSameSlug)
          return left(
            HTTPException.Conflict(
              'Menu already exists',
              'MENU_ALREADY_EXISTS',
            ),
          );
      }

      // Validação e configuração por tipo
      if (
        payload.type &&
        [MENU_ITEM_TYPE.TABLE, MENU_ITEM_TYPE.FORM].includes(payload.type)
      ) {
        if (!payload.table) {
          return left(
            HTTPException.BadRequest(
              'Table ID is required for table/form types',
              'INVALID_PARAMETERS',
            ),
          );
        }

        const table = await Table.findById(payload.table);

        if (!table)
          return left(
            HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
          );

        if (payload.type === MENU_ITEM_TYPE.TABLE)
          payload.url = '/tables/'.concat(table.slug);

        if (payload.type === MENU_ITEM_TYPE.FORM)
          payload.url = '/tables/'.concat(table.slug).concat('/row/create');
      }

      if (payload.type && [MENU_ITEM_TYPE.PAGE].includes(payload.type)) {
        payload.url = '/pages/'.concat(finalSlug);
      }

      // Validação do parent e conversão para separator se necessário
      if (parent) {
        // Verifica se não está tentando criar loop (menu sendo pai de si mesmo)
        if (payload.parent === payload._id) {
          return left(
            HTTPException.BadRequest(
              'Menu cannot be parent of itself',
              'INVALID_PARAMETERS',
            ),
          );
        }

        // Lógica de conversão para separator (similar ao create)
        if (parent.type !== MENU_ITEM_TYPE.SEPARATOR) {
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
      }

      // Atualiza o menu
      const updated = await Model.findByIdAndUpdate(
        payload._id,
        { ...payload, slug: finalSlug },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updated) {
        return left(HTTPException.NotFound('Menu not found', 'MENU_NOT_FOUND'));
      }

      const populated = await updated.populate([
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
          'UPDATE_MENU_ERROR',
        ),
      );
    }
  }
}
