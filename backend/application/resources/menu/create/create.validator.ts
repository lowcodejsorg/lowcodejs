import slugify from 'slugify';
import z from 'zod';

import { E_MENU_ITEM_TYPE } from '@application/core/entity.core';

const menuItemTypeValues = Object.values(E_MENU_ITEM_TYPE) as [string, ...string[]];

export const MenuCreateBodyValidator = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório'),
    type: z.enum(menuItemTypeValues),
    table: z.string().nullable().optional(),
    parent: z.string().nullable().optional(),
    html: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .transform((payload) => {
    return {
      ...payload,
      slug: slugify(payload.name, { lower: true, trim: true }),
      parent: payload.parent ?? null,
    };
  })
  .refine(
    (data) => {
      if (data.type === E_MENU_ITEM_TYPE.EXTERNAL) {
        return !!data.url;
      }
      return true;
    },
    {
      message: 'URL é obrigatória para links externos',
      path: ['url'],
    },
  )
  .refine(
    (data) => {
      if (data.type === E_MENU_ITEM_TYPE.PAGE) {
        return !!data.html;
      }
      return true;
    },
    {
      message: 'Conteúdo HTML não é permitido para páginas',
      path: ['html'],
    },
  );
