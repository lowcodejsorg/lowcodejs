import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableFieldAddCategoryParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});

export const TableFieldAddCategoryBodyValidator = z.object({
  label: z.string().trim().min(1),
  parentId: z.string().trim().nullable().optional(),
});

export type TableFieldAddCategoryPayload = Merge<
  z.infer<typeof TableFieldAddCategoryParamsValidator>,
  z.infer<typeof TableFieldAddCategoryBodyValidator>
>;
