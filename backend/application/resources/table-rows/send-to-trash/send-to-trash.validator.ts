import z from 'zod';

export const TableRowSendToTrashParamValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});
