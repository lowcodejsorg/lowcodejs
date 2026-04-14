import z from 'zod';

import { Merge } from '@application/core/entity.core';

import { TableActionValueSchema, TableStyleSchema } from '../table-base.schema';

export const TableCreateBodyValidator = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres')
    .regex(
      /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
      'Nome pode conter apenas letras, números, espaços, hífen, underscore e ç',
    ),
  logo: z.string().trim().nullable().optional(),
  style: TableStyleSchema.optional(),
  viewTable: TableActionValueSchema.optional(),
  viewField: TableActionValueSchema.optional(),
  viewRow: TableActionValueSchema.optional(),
  createRow: TableActionValueSchema.optional(),
  updateRow: TableActionValueSchema.optional(),
  removeRow: TableActionValueSchema.optional(),
  createField: TableActionValueSchema.optional(),
  updateField: TableActionValueSchema.optional(),
  removeField: TableActionValueSchema.optional(),
  updateTable: TableActionValueSchema.optional(),
});

export type TableCreatePayload = Merge<
  z.infer<typeof TableCreateBodyValidator>,
  {
    owner: string;
  }
>;
