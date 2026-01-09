import z from 'zod';

import { E_FIELD_TYPE, Merge } from '@application/core/entity.core';

import { TableFieldConfiguration } from '../table-field-base.schema';

export const TableFieldUpdateBodyValidator = z.object({
  name: z.string().trim(),
  type: z.enum(E_FIELD_TYPE),
  configuration: TableFieldConfiguration,
  trashed: z.boolean().default(false),
  trashedAt: z
    .string()
    .nullable()
    .default(null)
    .transform((value) => {
      return value ? new Date(value) : null;
    }),
});

export const TableFieldUpdateParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export type TableFieldUpdatePayload = Merge<
  z.infer<typeof TableFieldUpdateParamsValidator>,
  z.infer<typeof TableFieldUpdateBodyValidator>
>;
