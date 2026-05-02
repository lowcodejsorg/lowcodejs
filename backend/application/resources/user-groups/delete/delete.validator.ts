import z from 'zod';

export const UserGroupDeleteParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type UserGroupDeletePayload = z.infer<
  typeof UserGroupDeleteParamValidator
>;
