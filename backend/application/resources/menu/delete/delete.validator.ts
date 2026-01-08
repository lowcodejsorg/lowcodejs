import z from 'zod';

export const MenuDeleteParamValidator = z.object({
  _id: z.string().trim(),
});

export type MenuDeletePayload = z.infer<typeof MenuDeleteParamValidator>;
