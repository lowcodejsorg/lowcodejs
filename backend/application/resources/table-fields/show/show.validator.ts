import z from 'zod';

export const TableFieldShowParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export type TableFieldShowPayload = z.infer<typeof TableFieldShowParamsValidator>;
