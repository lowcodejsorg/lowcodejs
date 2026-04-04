import z from 'zod';

export const MenuSendToTrashParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type MenuSendToTrashPayload = z.infer<
  typeof MenuSendToTrashParamValidator
>;
