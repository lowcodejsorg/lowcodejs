import z from 'zod';

export const MenuShowParamValidator = z.object({
  _id: z.string().trim(),
});

export type MenuShowPayload = z.infer<typeof MenuShowParamValidator>;
