import z from 'zod';

export const MenuRestoreParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type MenuRestorePayload = z.infer<typeof MenuRestoreParamValidator>;
