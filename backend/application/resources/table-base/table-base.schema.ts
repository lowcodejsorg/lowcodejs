import z from 'zod';

import {
  E_TABLE_COLLABORATION,
  E_TABLE_STYLE,
  E_TABLE_VISIBILITY,
} from '@application/core/entity.core';

export const TableConfigurationSchema = z.object({
  style: z
    .enum([E_TABLE_STYLE.GALLERY, E_TABLE_STYLE.LIST])
    .default(E_TABLE_STYLE.LIST),
  visibility: z
    .enum([
      E_TABLE_VISIBILITY.PUBLIC,
      E_TABLE_VISIBILITY.RESTRICTED,
      E_TABLE_VISIBILITY.OPEN,
      E_TABLE_VISIBILITY.FORM,
      E_TABLE_VISIBILITY.PRIVATE,
    ])
    .default(E_TABLE_VISIBILITY.PUBLIC),
  collaboration: z
    .enum([E_TABLE_COLLABORATION.OPEN, E_TABLE_COLLABORATION.RESTRICTED])
    .default(E_TABLE_COLLABORATION.OPEN),
  administrators: z.array(z.string()).default([]),
  fields: z.object({
    orderList: z.array(z.string().trim()).default([]),
    orderForm: z.array(z.string().trim()).default([]),
  }),
});

export const TableMethodSchema = z.object({
  beforeSave: z.object({
    code: z.string().trim().nullable(),
  }),
  afterSave: z.object({
    code: z.string().trim().nullable(),
  }),
  onLoad: z.object({
    code: z.string().trim().nullable(),
  }),
});
