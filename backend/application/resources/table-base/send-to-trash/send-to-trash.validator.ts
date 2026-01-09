import z from 'zod';

export const TableSendToTrashParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableSendToTrashPayload = z.infer<typeof TableSendToTrashParamsValidator>;
