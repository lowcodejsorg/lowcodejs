import z from 'zod';

import { Merge } from '@application/core/entity.core';

import {
  TableActionValueSchema,
  TableCollaboratorsSchema,
  TableFieldOrderDetailSchema,
  TableFieldOrderFilterSchema,
  TableFieldOrderFormSchema,
  TableFieldOrderListSchema,
  TableLayoutFieldsSchema,
  TableMethodSchema,
  TableOrderSchema,
  TableStyleSchema,
} from '../table-base.schema';

export const TableUpdateBodyValidator = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(40, 'Nome deve ter no máximo 40 caracteres')
    .regex(
      /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
      'Nome pode conter apenas letras, números, espaços, hífen, underscore e ç',
    ),
  description: z.string().trim().nullable(),
  logo: z.string().trim().nullable(),
  style: TableStyleSchema,
  viewTable: TableActionValueSchema,
  updateTable: TableActionValueSchema,
  createField: TableActionValueSchema,
  updateField: TableActionValueSchema,
  removeField: TableActionValueSchema,
  viewField: TableActionValueSchema,
  createRow: TableActionValueSchema,
  updateRow: TableActionValueSchema,
  removeRow: TableActionValueSchema,
  viewRow: TableActionValueSchema,
  collaborators: TableCollaboratorsSchema,
  owner: z.string().trim().optional(),
  fieldOrderList: TableFieldOrderListSchema,
  fieldOrderForm: TableFieldOrderFormSchema,
  fieldOrderFilter: TableFieldOrderFilterSchema,
  fieldOrderDetail: TableFieldOrderDetailSchema,
  methods: TableMethodSchema,
  order: TableOrderSchema,
  layoutFields: TableLayoutFieldsSchema.optional(),
});

export const TableUpdateParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableUpdatePayload = Merge<
  z.infer<typeof TableUpdateParamsValidator>,
  z.infer<typeof TableUpdateBodyValidator>
>;
