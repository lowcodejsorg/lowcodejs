import z from 'zod';

export const SignInBodyValidator = z.object({
  email: z.email().trim(),
  password: z.string().trim(),
});
