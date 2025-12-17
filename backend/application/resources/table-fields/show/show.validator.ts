import z from 'zod';

export const TableFieldShowParamValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});
