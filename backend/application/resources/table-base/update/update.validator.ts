import z from 'zod';

import { Merge } from '@application/core/entity.core';

import {
  TableAdministratorsSchema,
  TableCollaborationSchema,
  TableFieldOrderDetailSchema,
  TableFieldOrderFilterSchema,
  TableFieldOrderFormSchema,
  TableFieldOrderListSchema,
  TableLayoutFieldsSchema,
  TableMethodSchema,
  TableOrderSchema,
  TableStyleSchema,
  TableVisibilitySchema,
} from '../table-base.schema';

export const TableUpdateBodyValidator = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Name must be at most 40 characters')
    .regex(
      /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
      'Name can only contain letters, numbers, spaces, hyphen, underscore and ç',
    ),
  description: z.string().trim().nullable(),
  logo: z.string().trim().nullable(),
  style: TableStyleSchema,
  visibility: TableVisibilitySchema,
  collaboration: TableCollaborationSchema,
  administrators: TableAdministratorsSchema,
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
