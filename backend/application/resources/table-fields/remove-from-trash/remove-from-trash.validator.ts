import z from 'zod';

export const TableFieldRemoveFromTrashParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export type TableFieldRemoveFromTrashPayload = z.infer<typeof TableFieldRemoveFromTrashParamsValidator>;
