import z from 'zod';

export const MenuHardDeleteParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type MenuHardDeletePayload = z.infer<
  typeof MenuHardDeleteParamValidator
>;
