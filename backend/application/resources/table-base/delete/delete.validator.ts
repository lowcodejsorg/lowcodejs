import z from 'zod';

export const TableDeleteParamValidator = z.object({
  slug: z.string().trim(),
});
