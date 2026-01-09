import z from 'zod';

export const TableConfigurationSchema = z.object({
  style: z.enum(['gallery', 'list', 'document']).default('list'),
  visibility: z
    .enum(['public', 'restricted', 'open', 'form', 'private'])
    .default('public'),
  collaboration: z.enum(['open', 'restricted']).default('open'),
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
