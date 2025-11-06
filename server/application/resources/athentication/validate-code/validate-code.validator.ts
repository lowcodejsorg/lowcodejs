import z from 'zod';

export const ValidateCodeBodyValidator = z.object({
  code: z.coerce.string().trim(),
});
