import z from 'zod';

export const UserGroupBulkTrashBodyValidator = z.object({
  ids: z
    .array(z.string().trim().min(1))
    .min(1, 'Selecione pelo menos um item'),
});

export type UserGroupBulkTrashPayload = z.infer<
  typeof UserGroupBulkTrashBodyValidator
>;
