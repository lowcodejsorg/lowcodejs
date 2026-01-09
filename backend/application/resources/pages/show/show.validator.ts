import z from 'zod';

export const PageShowParamsValidator = z.object({
  slug: z.string().trim(),
});

export type PageShowPayload = z.infer<typeof PageShowParamsValidator>;
