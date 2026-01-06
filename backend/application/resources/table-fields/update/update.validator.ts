import z from 'zod';

import { E_FIELD_TYPE } from '@application/core/entity.core';

import { TableFieldConfiguration } from '../table-field-base.schema';

export const TableFieldUpdateBodyValidator = z.object({
  name: z.string().trim(),
  type: z.enum(E_FIELD_TYPE),
  configuration: TableFieldConfiguration,
  trashed: z.boolean().default(false),
  trashedAt: z.string().nullable().default(null),
});

export const TableFieldUpdateParamValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});
