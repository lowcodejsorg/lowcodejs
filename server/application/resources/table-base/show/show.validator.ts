import z from 'zod';

export const TableShowParamValidator = z.object({
  slug: z.string().trim(),
});
