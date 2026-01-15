import z from 'zod';

export const MenuDeleteParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type MenuDeletePayload = z.infer<typeof MenuDeleteParamValidator>;
