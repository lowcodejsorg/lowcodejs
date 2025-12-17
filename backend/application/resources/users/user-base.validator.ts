import z from 'zod';

export const UserBaseValidator = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  group: z.string().trim(),
});
