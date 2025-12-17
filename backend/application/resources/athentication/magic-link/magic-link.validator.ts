import z from 'zod';

export const MagicLinkBodyValidator = z.object({
  code: z.string().trim(),
});
