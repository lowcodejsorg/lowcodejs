import z from 'zod';

export const RefreshTokenPayloadValidator = z.object({
  user: z.string().trim(),
});

export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadValidator>;
