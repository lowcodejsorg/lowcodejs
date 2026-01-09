import z from 'zod';

export const TableRowRemoveFromTrashParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});

export type TableRowRemoveFromTrashPayload = z.infer<
  typeof TableRowRemoveFromTrashParamsValidator
>;
