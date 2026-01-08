import z from 'zod';

export const MagicLinkQueryValidator = z.object({
  code: z.string().trim(),
});

export type MagicLinkPayload = z.infer<typeof MagicLinkQueryValidator>;
