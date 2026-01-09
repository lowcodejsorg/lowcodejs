import slugify from 'slugify';
import z from 'zod';

import { E_MENU_ITEM_TYPE, Merge } from '@application/core/entity.core';

export const MenuUpdateParamsValidator = z.object({
  _id: z.string().min(1, 'ID é obrigatório'),
});

export const MenuUpdateBodyValidator = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório').optional(),
    type: z.enum(E_MENU_ITEM_TYPE).optional(),
    table: z.string().nullable().optional(),
    parent: z.string().nullable().optional(),
    html: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
  })
  .transform((payload) => {
    return {
      ...payload,
      ...(payload.name && {
        slug: slugify(payload.name, { lower: true, trim: true }),
      }),
      parent: payload.parent ?? null,
    };
  })
  .refine(
    (data) => {
      if (data.type === E_MENU_ITEM_TYPE.EXTERNAL && data.type !== undefined) {
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
      if (data.type === E_MENU_ITEM_TYPE.PAGE && data.type !== undefined) {
        return !!data.html;
      }
      return true;
    },
    {
      message: 'Conteúdo HTML é obrigatório para páginas',
      path: ['html'],
    },
  );

export type MenuUpdatePayload = Merge<
  z.infer<typeof MenuUpdateParamsValidator>,
  z.infer<typeof MenuUpdateBodyValidator>
>;
