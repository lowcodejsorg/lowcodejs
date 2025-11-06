import z from 'zod';

export const TableRowRemoveFromTrashParamValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});
