import z from 'zod';

export const MenuRemoveFromTrashParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type MenuRemoveFromTrashPayload = z.infer<
  typeof MenuRemoveFromTrashParamValidator
>;
