import z from 'zod';

export const TableSendToTrashParamValidator = z.object({
  slug: z.string().trim(),
});
