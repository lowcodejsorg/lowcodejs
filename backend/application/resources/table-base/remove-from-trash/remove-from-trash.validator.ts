import z from 'zod';

export const TableRemoveFromTrashParamsValidator = z.object({
  slug: z.string().trim(),
});

export type TableRemoveFromTrashPayload = z.infer<typeof TableRemoveFromTrashParamsValidator>;
