import z from 'zod';

export const UserGroupSendToTrashParamValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

export type UserGroupSendToTrashPayload = z.infer<
  typeof UserGroupSendToTrashParamValidator
>;
