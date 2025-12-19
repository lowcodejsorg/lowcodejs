import z from 'zod';

import { FIELD_TYPE } from '@application/core/entity.core';

import { TableFieldConfiguration } from '../table-field-base.schema';

export const TableFieldCreateBodyValidator = z.object({
  name: z.string().trim(),
  type: z.enum(FIELD_TYPE),
  configuration: TableFieldConfiguration,
});

export const TableFieldCreateParamValidator = z.object({
  slug: z.string().trim(),
});
