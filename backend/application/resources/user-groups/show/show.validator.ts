import z from 'zod';

export const UserGroupShowParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type UserGroupShowPayload = z.infer<typeof UserGroupShowParamValidator>;
