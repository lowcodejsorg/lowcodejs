import z from 'zod';

import { Merge } from '@application/core/entity.core';
import { PASSWORD_REGEX } from '@application/core/util.core';

export const ResetPasswordBodyValidator = z.object({
  password: z
    .string({ message: 'A senha é obrigatória' })
    .min(6, 'A senha deve ter no mínimo 6 caracteres')
    .regex(
      PASSWORD_REGEX,
      'A senha deve conter ao menos: 1 maiúscula, 1 minúscula, 1 número e 1 especial',
    )
    .trim(),
});

export const ResetPasswordParamsValidator = z.object({
  _id: z.string({ message: 'O ID é obrigatório' }).trim(),
});

export type ResetPasswordPayload = Merge<
  z.infer<typeof ResetPasswordBodyValidator>,
  z.infer<typeof ResetPasswordParamsValidator>
>;
