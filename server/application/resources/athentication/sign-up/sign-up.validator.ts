import z from 'zod';

export const SignUpBodyValidator = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  password: z.string().trim(),
});
