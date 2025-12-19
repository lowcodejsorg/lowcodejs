import z from 'zod';

export const PageShowParamValidator = z.object({
  slug: z.string().trim(),
});
