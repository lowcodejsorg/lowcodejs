import z from 'zod';

import { E_FIELD_TYPE, Merge } from '@application/core/entity.core';

import { TableFieldConfiguration } from '../table-field-base.schema';

export const TableFieldCreateBodyValidator = z.object({
  name: z.string().trim(),
  type: z.enum(E_FIELD_TYPE),
  configuration: TableFieldConfiguration,
});

export const TableFieldCreateParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableFieldCreatePayload = Merge<
  z.infer<typeof TableFieldCreateParamsValidator>,
  z.infer<typeof TableFieldCreateBodyValidator>
>;
