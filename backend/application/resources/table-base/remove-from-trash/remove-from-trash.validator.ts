import z from 'zod';

export const TableRemoveFromTrashParamValidator = z.object({
  slug: z.string().trim(),
});
