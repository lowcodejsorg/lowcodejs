import z from 'zod';

export const MenuDeleteParamValidator = z.object({
  _id: z.string().trim(),
});