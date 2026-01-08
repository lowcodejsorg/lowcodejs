import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const TableRowEvaluationBodyValidator = z.object({
  value: z.number(),
  field: z.string().trim(),
});

export const TableRowEvaluationParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});

export type TableRowEvaluationPayload = Merge<
  Merge<
    z.infer<typeof TableRowEvaluationParamsValidator>,
    z.infer<typeof TableRowEvaluationBodyValidator>
  >,
  {
    user: string;
  }
>;
