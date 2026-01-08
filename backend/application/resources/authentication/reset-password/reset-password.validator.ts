import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const ResetPasswordBodyValidator = z.object({
  password: z.string().trim().min(8),
});

export const ResetPasswordParamsValidator = z.object({
  _id: z.string().trim(),
});

export type ResetPasswordPayload = Merge<
  z.infer<typeof ResetPasswordBodyValidator>,
  z.infer<typeof ResetPasswordParamsValidator>
>;
