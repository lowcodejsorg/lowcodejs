import z from 'zod';

export const RefreshTokenPayloadValidator = z.object({
  user: z
    .string({ message: 'O usuário é obrigatório' })
    .min(1, 'O usuário é obrigatório')
    .trim(),
});

export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadValidator>;
