import z from 'zod';

export const UserShowParamValidator = z.object({
  _id: z.string().trim(),
});
