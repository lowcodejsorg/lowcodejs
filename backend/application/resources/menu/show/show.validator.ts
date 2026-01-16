import z from 'zod';

export const MenuShowParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type MenuShowPayload = z.infer<typeof MenuShowParamValidator>;
