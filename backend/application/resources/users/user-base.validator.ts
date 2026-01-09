import z from 'zod';

export const UserBaseValidator = z.object({
  name: z.string().trim(),
  email: z.string().email().trim(),
  group: z.string().trim(),
});

export type UserBasePayload = z.infer<typeof UserBaseValidator>;
