import z from 'zod';

export const TableFieldRemoveFromTrashParamValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});
