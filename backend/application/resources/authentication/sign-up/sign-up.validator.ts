import z from 'zod';

export const SignUpBodyValidator = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim(),
  password: z.string().trim().min(8),
});

export type SignUpPayload = z.infer<typeof SignUpBodyValidator>;
