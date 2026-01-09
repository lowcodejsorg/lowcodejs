import z from 'zod';

export const TableFieldSendToTrashParamsValidator = z.object({
  slug: z.string().trim(), // reference of table slug
  _id: z.string().trim(),
});

export type TableFieldSendToTrashPayload = z.infer<
  typeof TableFieldSendToTrashParamsValidator
>;
