import z from 'zod';

export const MenuBulkRestoreBodyValidator = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, 'Selecione pelo menos um item'),
});

export type MenuBulkRestorePayload = z.infer<
  typeof MenuBulkRestoreBodyValidator
>;
