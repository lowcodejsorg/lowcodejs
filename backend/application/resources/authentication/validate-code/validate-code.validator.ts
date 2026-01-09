import z from 'zod';

export const ValidateCodeBodyValidator = z.object({
  code: z.string().trim(),
});

export type ValidateCodePayload = z.infer<typeof ValidateCodeBodyValidator>;
