import slugify from 'slugify';
import z from 'zod';

import { E_MENU_ITEM_TYPE } from '@application/core/entity.core';

export const MenuCreateBodyValidator = z
  .object({
    name: z
      .string({ message: 'O nome é obrigatório' })
      .trim()
      .min(1, 'O nome é obrigatório'),
    type: z.enum(E_MENU_ITEM_TYPE, { message: 'Tipo inválido' }),
    table: z
      .string({ message: 'A tabela deve ser um texto' })
      .nullable()
      .optional(),
    parent: z
      .string({ message: 'O menu pai deve ser um texto' })
      .nullable()
      .optional(),
    html: z
      .string({ message: 'O HTML deve ser um texto' })
      .nullable()
      .optional(),
    url: z.string({ message: 'A URL deve ser um texto' }).nullable().optional(),
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
      message: 'Conteúdo HTML é obrigatório para páginas',
      path: ['html'],
    },
  );

export type MenuCreatePayload = z.infer<typeof MenuCreateBodyValidator>;
