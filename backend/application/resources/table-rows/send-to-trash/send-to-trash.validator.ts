import z from 'zod';

export const TableRowSendToTrashParamsValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});

export type TableRowSendToTrashPayload = z.infer<typeof TableRowSendToTrashParamsValidator>;
