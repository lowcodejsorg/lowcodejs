import z from 'zod';

export const SignInBodyValidator = z.object({
  email: z.email().trim(),
  password: z.string().trim().min(1),
});

export type SignInPayload = z.infer<typeof SignInBodyValidator>;
